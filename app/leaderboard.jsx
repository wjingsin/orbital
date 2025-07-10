import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { getAllUsers,
        subscribeToUserStatusChanges,
        createStudyGroup,
        inviteToStudyGroup,
        getStudyGroupInvites,
        acceptStudyGroupInvite,
        declineStudyGroupInvite,
        getUserStudyGroups,
        leaveStudyGroup,
        subscribeToGroupMemberChanges,
        subscribeToOnlineUsersOnly
} from '../firebaseService';
import InAppLayout from "../components/InAppLayout";
import Spacer from "../components/Spacer";
import { PET_TYPES } from "../contexts/PetContext";
import { useTokens } from '../contexts/TokenContext';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {FontAwesome, FontAwesome5, MaterialIcons} from "@expo/vector-icons";
import { debounce } from 'lodash';

const PET_IMAGES = {
    corgi: require('../assets/corgi_sit.png'),
    pomeranian: require('../assets/pom_sit.png'),
    pug: require('../assets/pug_sit.png'),
};

export default function LeaderboardScreen() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { user } = useUser();
    const { points } = useTokens();

    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [studyGroups, setStudyGroups] = useState([]);
    const [invites, setInvites] = useState([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard', 'groups'
    const [showInvitesModal, setShowInvitesModal] = useState(false);

    const [debouncedPoints, setDebouncedPoints] = useState(points);


    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedPoints(points);
        }, 5000);

        return () => clearTimeout(timer);
    }, [points]);

    useEffect(() => {
        const syncTokens = async () => {
            if (user && typeof debouncedPoints === 'number') {
                try {
                    const userRef = doc(db, 'users', user.id);
                    await updateDoc(userRef, { tokens: debouncedPoints });
                } catch (e) {
                    console.error('Failed to sync tokens to Firestore:', e);
                }
            }
        };
        syncTokens();
    }, [user, debouncedPoints]);

    useEffect(() => {
        let unsubscribe;
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const allUsers = await getAllUsers(50); // Add limit parameter
                setUsers(sortUsers(allUsers, user));

                const debouncedUpdateOnlineUsers = debounce((onlineUsersSnapshot) => {
                    const onlineUsers = [];
                    onlineUsersSnapshot.forEach((doc) => {
                        onlineUsers.push({ id: doc.id, ...doc.data() });
                    });

                    setUsers(prevUsers => {
                        const updatedUsers = prevUsers.map(user => {
                            const onlineUser = onlineUsers.find(ou => ou.id === user.id);
                            return onlineUser ? { ...user, ...onlineUser } : user;
                        });
                        return sortUsers(updatedUsers, user);
                    });
                }, 3000);

                unsubscribe = subscribeToOnlineUsersOnly(debouncedUpdateOnlineUsers);
            } catch (err) {
                setError('Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    useEffect(() => {
        const fetchStudyGroupData = async () => {
            if (user) {
                try {
                    const groups = await getUserStudyGroups(user.id);
                    setStudyGroups(groups);
                    const userInvites = await getStudyGroupInvites(user.id);
                    setInvites(userInvites);
                } catch (err) {
                    console.error('Failed to fetch study group data:', err);
                }
            }
        };
        fetchStudyGroupData();
    }, [user]);
    useEffect(() => {
        let unsubscribe;
        if (activeTab === 'groups' && studyGroups.length > 0 && studyGroups[0]?.id) {
            const debouncedGroupUpdate = debounce((updatedMembers) => {
                setStudyGroups(prevGroups => {
                    if (prevGroups.length === 0) return prevGroups;
                    return [{
                        ...prevGroups[0],
                        members: updatedMembers
                    }];
                });
            }, 1000);

            unsubscribe = subscribeToGroupMemberChanges(studyGroups[0].id, debouncedGroupUpdate);

        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [activeTab, studyGroups.length > 0 ? studyGroups[0]?.id : null]);

    const sortUsers = (usersArr, currentUser) => {
        if (!usersArr) return [];

        let foundMe = false;
        const usersWithTokens = usersArr.map(u => {
            const id = u.userId || u.id;
            if (currentUser && id === currentUser.id) foundMe = true;
            return {
                ...u,
                tokens: typeof u.tokens === 'number' ? u.tokens : 0,
                id,
            };
        });

        if (currentUser && !foundMe) {
            usersWithTokens.push({
                id: currentUser.id,
                userId: currentUser.id,
                displayName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username || 'Anonymous',
                petName: 'Pet',
                petSelection: 0,
                tokens: points || 0,
            });
        }

        return usersWithTokens
            .filter(u => u.petSelection !== undefined)
            .sort((a, b) => b.tokens - a.tokens);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const allUsers = await getAllUsers(50);
            setUsers(sortUsers(allUsers, user));
            if (user) {
                const groups = await getUserStudyGroups(user.id);
                setStudyGroups(groups);
                const userInvites = await getStudyGroupInvites(user.id);
                setInvites(userInvites);
            }
        } catch (err) {
            setError('Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    };

    const handleCreateStudyGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        try {
            const existingGroups = await getUserStudyGroups(user.id);
            if (existingGroups && existingGroups.length > 0) {
                Alert.alert('Error', 'You are already a member of a study group');
                return;
            }

            await createStudyGroup(user.id, groupName);
            setGroupName('');
            setShowCreateGroupModal(false);
            const groups = await getUserStudyGroups(user.id);
            setStudyGroups(groups);
            Alert.alert('Success', `Study group "${groupName}" created successfully!`);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to create study group');
            console.error(error);
        }
    };

    const handleInviteUsers = (groupId) => {
        setSelectedGroupId(groupId);
        setSelectedUsers([]);
        setShowInviteModal(true);
    };

    const toggleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const sendInvites = async () => {
        if (selectedUsers.length === 0) {
            Alert.alert('Error', 'Please select at least one user to invite');
            return;
        }

        try {
            const failedInvites = [];
            for (const userId of selectedUsers) {
                try {
                    await inviteToStudyGroup(selectedGroupId, userId, user);
                } catch (error) {
                    failedInvites.push({ userId, reason: error.message });
                }
            }

            setShowInviteModal(false);
            if (failedInvites.length === 0) {
                Alert.alert('Success', 'All invitations sent successfully!');
            } else if (failedInvites.length < selectedUsers.length) {
                Alert.alert('Partial Success', `${selectedUsers.length - failedInvites.length} invitations sent, ${failedInvites.length} failed. Some users may already be in other groups.`);
            } else {
                Alert.alert('Error', 'Failed to send invitations. User is already in your group.');
            }
        } catch (error) {
            Alert.alert('Errors', error.message || 'Failed to send invitations');
        }
    };

    const handleAcceptInvite = async (inviteId, groupId) => {
        try {
            const existingGroups = await getUserStudyGroups(user.id);
            if (existingGroups && existingGroups.length > 0) {
                Alert.alert('Error', 'You are already a member of a study group');
                return;
            }

            await acceptStudyGroupInvite(inviteId, user.id, groupId);
            const userInvites = await getStudyGroupInvites(user.id);
            setInvites(userInvites);
            const groups = await getUserStudyGroups(user.id);
            setStudyGroups(groups);
            Alert.alert('Success', 'You joined the study group!');
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to accept invitation');
            console.error(error);
        }
    };

    const handleDeclineInvite = async (inviteId) => {
        try {
            await declineStudyGroupInvite(inviteId);
            const userInvites = await getStudyGroupInvites(user.id);
            setInvites(userInvites);
            Alert.alert('Success', 'Invitation declined');
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to decline invitation');
            console.error(error);
        }
    };

    const handleLeaveGroup = async (groupId) => {
        try {
            const result = await leaveStudyGroup(user.id, groupId);
            const groups = await getUserStudyGroups(user.id);
            setStudyGroups(groups);
            if (result.deleted) {
                Alert.alert('Success', 'You left the group and it was deleted as you were the last member');
            } else {
                Alert.alert('Success', 'You left the study group');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to leave group');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF8C42" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const renderLeaderboard = () => (
        <>
            <Spacer height={20} />
            <FlatList
                data={users}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                renderItem={({ item, index }) => {
                    const isCurrentUser = user && (item.userId === user.id || item.id === user.id);
                    return (
                        <TouchableOpacity
                            style={[styles.userCard, isCurrentUser && styles.currentUserCard]}
                            onPress={() =>
                                router.push({ pathname: '/otherUsersProfile', params: { userId: item.userId || item.id } })}
                        >
                            <View style={styles.rankCircle}>
                                <Text style={styles.rankText}>{index + 1}</Text>
                            </View>
                            {item.hasPet === false ? (
                                <Image source={require('../assets/transparent_square.png')} style={styles.avatar} />
                            ) : (
                                <Image source={PET_IMAGES[PET_TYPES[item.petSelection]?.toLowerCase()] || require('../assets/transparent_square.png')} style={styles.avatar} />
                            )}
                            <View style={styles.userInfo}>
                                <Text style={styles.petName}>{item.hasPet === false ? "No Pet" : (item.petName || 'No Pet Name')}</Text>
                                <Text style={styles.userName}>{'Owner: ' + item.displayName || 'Unknown'}</Text>
                            </View>
                            <View style={styles.tokenContainer}>
                                <FontAwesome name="paw" size={18} color="#538ed5" />
                                <Text style={styles.tokenText}>  {item.tokens}</Text>

                            </View>
                        </TouchableOpacity>
                    );
                }}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </>
    );


    const renderStudyGroups = () => (
        <>
            <Spacer height={10} />
            <View style={styles.groupHeader}>
                {studyGroups.length === 0 && (
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => setShowCreateGroupModal(true)}
                    >
                        <FontAwesome name="plus" size={14} color="#fff" />
                        <Text style={styles.createButtonText}>Create Group</Text>
                    </TouchableOpacity>
                )}
            </View>

            {studyGroups.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>You haven't joined any study groups yet</Text>
                </View>
            ) : (
                <View style={styles.singleGroupContainer}>
                    <View style={styles.groupHeaderCard}>
                        <Text style={styles.groupNameTitle}>{studyGroups[0].name}</Text>
                        <View style={styles.groupActionButtons}>
                            <TouchableOpacity
                                style={styles.inviteButton}
                                onPress={() => handleInviteUsers(studyGroups[0].id)}
                            >
                                <FontAwesome name="user-plus" size={14} color="#FF8C42" />
                                <Text style={styles.inviteButtonText}>Invite</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.leaveButton}
                                onPress={() => handleLeaveGroup(studyGroups[0].id)}
                            >
                                <FontAwesome name="sign-out" size={14} color="#ff6b6b" />
                                <Text style={styles.leaveButtonText}>Leave</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.membersTitle}>Group Members ({studyGroups[0].members?.length || 1})</Text>

                    <FlatList
                        data={studyGroups[0].members || []}
                        keyExtractor={(item, index) => item.id || item.uid || `member-${index}`}
                        renderItem={({ item }) => {
                            const isCurrentUser = user && (item.userId === user.id || item.id === user.id);
                            return (
                            <TouchableOpacity
                                style={[styles.memberCard, isCurrentUser && styles.currentUserCard]}
                                onPress={() =>
                                    router.push({ pathname: '/otherUsersProfile', params: { userId: item.userId || item.id } })}
                            >
                                {item.hasPet === false ? (
                                    <Image source={require('../assets/transparent_square.png')} style={styles.memberAvatar} />
                                ) : (
                                    <Image
                                        source={PET_IMAGES[PET_TYPES[item.petSelection]?.toLowerCase()] || require('../assets/transparent_square.png')}
                                        style={styles.memberAvatar}
                                    />
                                )}
                                <View style={styles.userInfo}>
                                    {!item.displayName && !item.petName ? (
                                        <View style={styles.GrouploadingContainer}>
                                            <ActivityIndicator size="small" color="#FF8C42" />
                                        </View>
                                    ) : (
                                        <>
                                            <Text style={styles.petName}>
                                                {item.hasPet === false ? "No Pet" : (item.petName || '')}
                                            </Text>
                                            <Text style={styles.userName}>
                                                {item.displayName == undefined ? '' : 'Owner: ' + item.displayName}
                                            </Text>
                                        </>
                                    )}
                                </View>

                            </TouchableOpacity>
                            )}
                        }
                    />

                </View>
            )}
        </>
    );


    const renderInvitesModal = () => (
        <Modal
            visible={showInvitesModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowInvitesModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.inviteModalContent}>
                    <Text style={styles.modalTitle}>Study Group Invitations</Text>
                    {invites.length === 0 ? (
                        <Text style={styles.emptyText}>No pending invitations</Text>
                    ) : (
                        <FlatList
                            data={invites}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.inviteCard}>
                                    <View style={styles.inviteInfo}>
                                        <Text style={styles.inviteText}>
                                            <Text style={styles.inviterName}>{item.inviterName}</Text> invited you to join
                                        </Text>
                                        <Text style={styles.groupName}>{item.groupName}</Text>
                                    </View>
                                    <View style={styles.inviteActions}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.acceptButton]}
                                            onPress={() => handleAcceptInvite(item.id, item.groupId)}
                                        >
                                            <Text style={styles.actionButtonText}>Accept</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.declineButton]}
                                            onPress={() => handleDeclineInvite(item.id)}
                                        >
                                            <Text style={styles.declineButtonText}>Decline</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                    <TouchableOpacity
                        style={styles.closeInvitesButton}
                        onPress={() => setShowInvitesModal(false)}
                    >
                        <Text style={styles.closeInvitesButtonText}>Close</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );

    return (
        <InAppLayout>
            <View style={styles.container}>
                <Spacer height={50} />
                <Spacer height={20}/>
                <View style={styles.headerContainer}>
                    <Text style={styles.appTitle}>Community</Text>
                </View>
                <View style={[styles.pointsIndicator, {marginTop: -35}]}>
                    <TouchableOpacity
                        style={styles.invitesTopButton}
                        onPress={() => setShowInvitesModal(true)}
                    >
                        <FontAwesome name="envelope" size={16} color="#FF8C42" />
                        <Text style={styles.invitesTopButtonText}>({invites.length})</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
                        onPress={() => setActiveTab('leaderboard')}
                    >
                        <FontAwesome name="paw" size={18} color={activeTab === 'leaderboard' ? "#FF8C42" : "#777"} />
                        <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>Leaderboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
                        onPress={() => setActiveTab('groups')}
                    >
                        <MaterialIcons name="groups" size={18} color={activeTab === 'groups' ? "#FF8C42" : "#777"} />
                        <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>Study Group</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.contentContainer}>
                    {activeTab === 'leaderboard' && renderLeaderboard()}
                    {activeTab === 'groups' && renderStudyGroups()}
                </View>

                {/* Invites Modal */}
                {renderInvitesModal()}

                {/* Create Study Group Modal */}
                <Modal
                    visible={showCreateGroupModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowCreateGroupModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Create Study Group</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Group Name"
                                value={groupName}
                                onChangeText={setGroupName}
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setShowCreateGroupModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.createModalButton]}
                                    onPress={handleCreateStudyGroup}
                                >
                                    <Text style={styles.createModalButtonText}>Create</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Invite Users Modal */}
                <Modal
                    visible={showInviteModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowInviteModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.inviteModalContent}>
                            <Text style={styles.modalTitle}>Invite Users</Text>
                            <Text style={styles.modalSubtitle}>Select users to invite:</Text>
                            <FlatList
                                data={users.filter(u => u.id !== user?.id)}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.memberCard, selectedUsers.includes(item.id) && styles.selectedUserItem]}
                                        onPress={() => toggleUserSelection(item.id)}
                                    >
                                        {item.hasPet === false ? (
                                            <Image source={require('../assets/transparent_square.png')} style={styles.selectAvatar} />
                                        ) : (
                                            <Image source={PET_IMAGES[PET_TYPES[item.petSelection]?.toLowerCase()] || require('../assets/transparent_square.png')} style={styles.selectAvatar} />
                                        )}
                                        <View style={styles.selectUserInfo}>
                                            <Text style={styles.selectUserName}>{item.displayName || 'Unknown'}</Text>
                                            <Text style={styles.selectPetName}>{item.hasPet === false ? "No Pet" : (item.petName || 'No Pet Name')}</Text>
                                        </View>
                                        {selectedUsers.includes(item.id) && (
                                            <FontAwesome name="check" size={18} color="#FF8C42" style={styles.checkIcon} />
                                        )}
                                    </TouchableOpacity>
                                )}
                                style={styles.userSelectList}
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setShowInviteModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.inviteModalButton]}
                                    onPress={sendInvites}
                                >
                                    <Text style={styles.inviteModalButtonText}>Invite ({selectedUsers.length})</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </InAppLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    pointsIndicator: {
        flexDirection: 'row',
        alignItems: '',
        paddingVertical: 4,
        paddingHorizontal: 24,
        alignSelf: 'flex-end'
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    GrouploadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -100,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666'
    },
    header: {
        flexDirection: 'row',
        paddingTop: 15,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    headerTitleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
    },
    invitesTopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FF8C42',
    },
    invitesTopButtonText: {
        color: '#FF8C42',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 5,
    },
    contentContainer: {
        flex: 1,
        paddingTop: 15,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#333',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginTop: 20
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
        textAlign: 'center'
    },
    // Tab Navigation
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 30,
        marginHorizontal: 20,
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        padding: 5,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
    },
    activeTab: {
        backgroundColor: '#FFF0E6',
    },
    tabText: {
        fontSize: 16,
        color: '#777',
        marginLeft: 8,
        fontWeight: '500',
    },
    activeTabText: {
        color: '#FF8C42',
        fontWeight: '600',
    },
    // User Card in Leaderboard
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    currentUserCard: {
        backgroundColor: '#FFF0E6',
        borderColor: '#FFD5B5',
    },
    rankCircle: {
        width: 26,
        height: 26,
        borderRadius: 18,
        borderColor: '#FF8C42',
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5
    },
    rankText: {
        color: '#FF8C42',
        fontWeight: 'bold',
        fontSize: 16
    },
    avatar: {
        width: 80,
        height: 80,
    },
    userInfo: {
        flex: 1
    },
    petName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333'
    },
    userName: {
        fontSize: 13,
        color: '#666'
    },
    tokenContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10
    },
    tokenText: {
        fontWeight: 'bold',
        color: '#538ed5',
        fontSize: 18,
        marginRight: 4
    },
    // Study Groups
    groupHeader: {
        alignSelf: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 15,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF8C42',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 5,
    },
    invitesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF8C42',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginLeft: 8,
    },
    invitesButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 5,
    },
    groupCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    groupInfo: {
        flex: 1
    },
    groupName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333'
    },
    groupMemberCount: {
        fontSize: 13,
        color: '#666',
        marginTop: 2
    },
    groupActions: {
        flexDirection: 'row',
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#FF8C42',
        borderRadius: 20,
        marginRight: 8,
    },
    inviteButtonText: {
        color: '#FF8C42',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 5,
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ff6b6b',
        borderRadius: 20,
    },
    leaveButtonText: {
        color: '#ff6b6b',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 5,
    },
    // Invites
    inviteCard: {
        backgroundColor: '#fff',
        marginHorizontal: 10,
        marginVertical: 6,
        padding: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    inviteInfo: {
        marginBottom: 10
    },
    inviteText: {
        fontSize: 14,
        color: '#666'
    },
    inviterName: {
        fontWeight: '600',
        color: '#333'
    },
    inviteActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginLeft: 10,
    },
    acceptButton: {
        backgroundColor: '#FF8C42',
    },
    declineButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    declineButtonText: {
        color: '#666',
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    inviteModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        width: '100%',
        marginBottom: 20,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f2f2f2',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    createModalButton: {
        backgroundColor: '#FF8C42',
    },
    createModalButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    inviteModalButton: {
        backgroundColor: '#FF8C42',
    },
    inviteModalButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // User selection in invite modal
    userSelectList: {
        maxHeight: 300,
        marginBottom: 20,
    },
    userSelectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedUserItem: {
        backgroundColor: '#FFF0E6',
    },
    selectAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    selectUserInfo: {
        flex: 1
    },
    selectUserName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333'
    },
    selectPetName: {
        fontSize: 13,
        color: '#666'
    },
    checkIcon: {
        marginLeft: 10
    },
    closeInvitesButton: {
        backgroundColor: '#f2f2f2',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 10,
        width: '50%',
    },
    closeInvitesButtonText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 16,
    },
    // Group display styles
    singleGroupContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 10,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    groupHeaderCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 16,
    },
    groupNameTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    groupActionButtons: {
        flexDirection: 'row',
    },
    membersTitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 12,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginVertical: 6,
        padding: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    memberAvatar: {
        width: 80,
        height: 80,
        borderRadius: 20,
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    ownerTag: {
        fontSize: 12,
        color: '#FF8C42',
        fontWeight: '500',
        marginTop: 2,
    },


});
