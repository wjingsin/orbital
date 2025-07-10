import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    Alert,
    Modal,
    FlatList,
    TouchableWithoutFeedback
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { FontAwesome5 } from "@expo/vector-icons";
import { format, startOfWeek, endOfWeek, addWeeks, isSameWeek, parseISO } from 'date-fns';

import { PointsProvider, usePoints } from "../contexts/PointsContext";
import Spacer from "../components/Spacer";
import InAppLayout from "../components/InAppLayout";

export default function AppWrapper() {
    return (
        <PointsProvider>
            <App />
        </PointsProvider>
    );
}
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const reminderOptions = [
    { label: '10 minutes', value: 10 },
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '12 hours', value: 720 },
    { label: '1 day', value: 1440 },
];
const colorOptions = [
    { name: 'Red', value: '#ff6b6b' },
    { name: 'Yellow', value: '#ffd166' },
    { name: 'Blue', value: '#72ccff' },
    { name: 'Green', value: '#76c893' },
    { name: 'Purple', value: '#9b72ff' },
    { name: 'Orange', value: '#fb8500' },
];

async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for notification!');
        return;
    }
}
async function scheduleNotification(task, reminderMinutes) {
    const taskTime = new Date(task.dateTime);

    const notificationTime = new Date(taskTime);
    notificationTime.setMinutes(notificationTime.getMinutes() - reminderMinutes);
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Task Reminder',
            body: `Reminder for "${task.name}" in ${reminderMinutes === 60 ? '1 hour' :
                reminderMinutes === 120 ? '2 hours' :
                    reminderMinutes === 720 ? '12 hours' :
                        reminderMinutes === 1440 ? '1 day' :
                            `${reminderMinutes} minutes`}`,
            data: { taskId: task.id },
        },
        trigger: notificationTime,
        identifier: task.id,
    });
}

function App() {
    const [allTasks, setAllTasks] = useState({});
    const [taskName, setTaskName] = useState('');
    const [taskSuggestions, setTaskSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [pastTaskNames, setPastTaskNames] = useState([]);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedReminderOption, setSelectedReminderOption] = useState(reminderOptions[2]);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
    const [showColorModal, setShowColorModal] = useState(false);
    const { points, addPoint } = usePoints();

    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [currentWeekEnd, setCurrentWeekEnd] = useState(endOfWeek(new Date(), { weekStartsOn: 1 }));

    useEffect(() => {
        loadTasks();
        loadPastTaskNames();
        registerForPushNotificationsAsync();
    }, []);

    useEffect(() => {
        const newWeekStart = startOfWeek(addWeeks(new Date(), currentWeekOffset), { weekStartsOn: 1 });
        const newWeekEnd = endOfWeek(addWeeks(new Date(), currentWeekOffset), { weekStartsOn: 1 });

        setCurrentWeekStart(newWeekStart);
        setCurrentWeekEnd(newWeekEnd);
    }, [currentWeekOffset]);

    const loadTasks = async () => {
        try {
            const storedTasks = await AsyncStorage.getItem('allTasks');
            if (storedTasks !== null) {
                setAllTasks(JSON.parse(storedTasks));
            } else {
                // Initialize with empty structure
                setAllTasks({});
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    const loadPastTaskNames = async () => {
        try {
            const storedNames = await AsyncStorage.getItem('pastTaskNames');
            if (storedNames !== null) {
                setPastTaskNames(JSON.parse(storedNames));
            }
        } catch (error) {
            console.error('Error loading past task names:', error);
        }
    };

    useEffect(() => {
        const saveTasks = async () => {
            try {
                await AsyncStorage.setItem('allTasks', JSON.stringify(allTasks));
            } catch (error) {
                console.error('Error saving tasks:', error);
            }
        };

        if (Object.keys(allTasks).length > 0) {
            saveTasks();
        }
    }, [allTasks]);

    useEffect(() => {
        const savePastTaskNames = async () => {
            try {
                await AsyncStorage.setItem('pastTaskNames', JSON.stringify(pastTaskNames));
            } catch (error) {
                console.error('Error saving past task names:', error);
            }
        };

        if (pastTaskNames.length > 0) {
            savePastTaskNames();
        }
    }, [pastTaskNames]);

    const updateTaskSuggestions = (text) => {
        setTaskName(text);
        if (text.trim() === '') {
            setTaskSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const filteredSuggestions = pastTaskNames.filter(name =>
            name.toLowerCase().includes(text.toLowerCase())
        );

        setTaskSuggestions(filteredSuggestions);
        setShowSuggestions(filteredSuggestions.length > 0);
    };

    const selectSuggestion = (suggestion) => {
        setTaskName(suggestion);
        setShowSuggestions(false);
    };

    const changeWeek = (offset) => {
        setCurrentWeekOffset(prevOffset => prevOffset + offset);
    };

    const goToCurrentWeek = () => {
        setCurrentWeekOffset(0);
    };

    const addTask = () => {
        if (taskName.trim() === '') {
            Alert.alert('Error', 'Task name cannot be empty');
            return;
        }

        const taskDate = new Date(date);
        const dayIndex = taskDate.getDay();
        const weekdayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        const weekday = weekdays[weekdayIndex];
        const taskWeekStart = format(startOfWeek(taskDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

        const newTask = {
            id: Date.now().toString(),
            name: taskName,
            dateTime: taskDate.toISOString(),
            completed: false,
            pointAwarded: false,
            reminderMinutes: selectedReminderOption.value,
            color: selectedColor.value,
        };

        setAllTasks(prevTasks => {
            const updatedTasks = { ...prevTasks };
            if (!updatedTasks[taskWeekStart]) {
                updatedTasks[taskWeekStart] = {};
                weekdays.forEach(day => {
                    updatedTasks[taskWeekStart][day] = [];
                });
            }
            if (!updatedTasks[taskWeekStart][weekday]) {
                updatedTasks[taskWeekStart][weekday] = [];
            }
            updatedTasks[taskWeekStart][weekday] = [
                ...updatedTasks[taskWeekStart][weekday],
                newTask
            ];

            return updatedTasks;
        });

        scheduleNotification(newTask, selectedReminderOption.value);

        if (!pastTaskNames.includes(taskName)) {
            setPastTaskNames(prev => [...prev, taskName]);
        }

        setTaskName('');
        setDate(new Date());
        setShowAddTaskForm(false);
    };

    const toggleTaskCompletion = (weekKey, weekday, taskId) => {
        setAllTasks(prevTasks => {
            const updatedTasks = { ...prevTasks };

            if (updatedTasks[weekKey] && updatedTasks[weekKey][weekday]) {
                updatedTasks[weekKey][weekday] = updatedTasks[weekKey][weekday].map(task => {
                    if (task.id === taskId) {
                        const isBeingCompleted = !task.completed;

                        if (isBeingCompleted && !task.pointAwarded) {
                            addPoint();
                        }

                        return {
                            ...task,
                            completed: !task.completed,
                            pointAwarded: task.pointAwarded || !task.completed
                        };
                    }
                    return task;
                });
            }

            return updatedTasks;
        });
    };

    const deleteTask = (weekKey, weekday, taskId) => {
        Notifications.cancelScheduledNotificationAsync(taskId).catch(error => {
            console.log('Error cancelling notification:', error);
        });
        setAllTasks(prevTasks => {
            const updatedTasks = { ...prevTasks };

            if (updatedTasks[weekKey] && updatedTasks[weekKey][weekday]) {
                updatedTasks[weekKey][weekday] = updatedTasks[weekKey][weekday].filter(
                    task => task.id !== taskId
                );
            }

            return updatedTasks;
        });
    };

    const onDateChange = (event, selectedDate) => {
        if (event.type === 'dismissed') {
            setShowDatePicker(false);
            return;
        }

        const currentDate = selectedDate || date;
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            setDate(currentDate);
        } else {
            setDate(currentDate);
        }
    };

    const dismissModal = () => {
        setShowReminderModal(false);
    };

    const dismissColorModal = () => {
        setShowColorModal(false);
    };

    const currentWeekKey = format(currentWeekStart, 'yyyy-MM-dd');

    const currentWeekTasks = allTasks[currentWeekKey] || {};

    return (
        <InAppLayout>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.container}>
                    <Spacer height={20}/>
                    <View style={styles.headerContainer}>
                        <Text style={styles.header}>Tasks</Text>
                    </View>
                    <View style={[styles.pointsIndicator, {marginTop: -55}]}>
                        <FontAwesome5 name="bone" size={16} color="#eb7d42" />
                        <Text style={styles.pointsText}> {points}</Text>
                    </View>
                    <Spacer height={10}/>
                    <View style={styles.weekNavigationContainer}>
                        <Text style={styles.weekDateRange}>
                            {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d, yyyy')}
                        </Text>

                        <View style={styles.weekNavigationControls}>
                            <TouchableOpacity
                                style={styles.weekNavButton}
                                onPress={() => changeWeek(-1)}
                            >
                                <Text style={styles.weekNavButtonText}>◀</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.currentWeekButton}
                                onPress={goToCurrentWeek}
                            >
                                <Text style={styles.currentWeekButtonText}>
                                    Current Week: {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.weekNavButton}
                                onPress={() => changeWeek(1)}
                            >
                                <Text style={styles.weekNavButtonText}>▶</Text>
                            </TouchableOpacity>
                        </View>
                        {!showAddTaskForm && (
                            <TouchableOpacity
                                style={styles.addTaskButton}
                                onPress={() => setShowAddTaskForm(true)}
                            >
                                <Text style={styles.addTaskButtonText}>+ Add New Task</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {showAddTaskForm && (
                        <View style={styles.addTaskContainer}>
                            <View style={styles.addTaskHeaderContainer}>
                                <Text style={styles.addTaskHeader}>Add New Task</Text>
                                <TouchableOpacity
                                    onPress={() => setShowAddTaskForm(false)}
                                    style={styles.closeButton}
                                >
                                    <Text style={styles.closeButtonText}>×</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.autocompleteContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Task Name"
                                    value={taskName}
                                    onChangeText={updateTaskSuggestions}
                                    onFocus={() => {
                                        if (taskName.trim() !== '' && taskSuggestions.length > 0) {
                                            setShowSuggestions(true);
                                        }
                                    }}
                                />
                                {showSuggestions && (
                                    <View style={styles.suggestionsContainer}>
                                        <FlatList
                                            data={taskSuggestions}
                                            keyExtractor={(item, index) => index.toString()}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={styles.suggestionItem}
                                                    onPress={() => selectSuggestion(item)}
                                                >
                                                    <Text>{item}</Text>
                                                </TouchableOpacity>
                                            )}
                                            style={styles.suggestionsList}
                                            nestedScrollEnabled={true}
                                        />
                                    </View>
                                )}
                            </View>

                            <View style={styles.colorPickerRow}>
                                <Text style={styles.label}>Colour:</Text>
                                <TouchableOpacity
                                    style={[styles.colorButton, {backgroundColor: selectedColor.value}]}
                                    onPress={() => setShowColorModal(true)}
                                >
                                    <Text style={styles.colorButtonText}>{selectedColor.name}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dateTimeRow}>
                                <Text style={styles.label}>Date & Time:</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateButtonText}>
                                        {date.toLocaleString()}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showDatePicker && (
                                <>
                                    <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
                                        <View style={styles.datePickerBackdrop} />
                                    </TouchableWithoutFeedback>
                                    <View style={styles.datePickerContainer}>
                                        <DateTimePicker
                                            value={date}
                                            mode="datetime"
                                            display="default"
                                            onChange={onDateChange}
                                            style={styles.datePicker}
                                        />
                                        {Platform.OS === 'ios' && (
                                            <TouchableOpacity
                                                style={styles.datePickerDoneButton}
                                                onPress={() => setShowDatePicker(false)}
                                            >
                                                <Text style={styles.datePickerDoneText}>Done</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </>
                            )}

                            <View style={styles.reminderRow}>
                                <Text style={styles.label}>Reminder:</Text>
                                <TouchableOpacity
                                    style={styles.reminderButton}
                                    onPress={() => setShowReminderModal(true)}
                                >
                                    <Text style={styles.reminderButtonText}>
                                        {selectedReminderOption.label} before
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Spacer height={15}/>
                            <TouchableOpacity style={styles.addButton} onPress={addTask}>
                                <Text style={styles.addButtonText}>Add Task</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <ScrollView
                        style={styles.weekdaysContainer}
                    >
                        {weekdays.map(weekday => (
                            <View key={weekday} style={styles.weekdayContainer}>
                                <Text style={styles.weekdayHeader}>{weekday}</Text>

                                {currentWeekTasks[weekday]?.length > 0 ? (
                                    currentWeekTasks[weekday].map(task => (
                                        <Swipeable
                                            key={task.id}
                                            renderRightActions={() => (
                                                <TouchableOpacity
                                                    style={styles.deleteAction}
                                                    onPress={() => {
                                                        Alert.alert(
                                                            "Delete Task",
                                                            "Are you sure you want to delete this task?",
                                                            [
                                                                {
                                                                    text: "Cancel",
                                                                    style: "cancel"
                                                                },
                                                                {
                                                                    text: "Delete",
                                                                    onPress: () => deleteTask(currentWeekKey, weekday, task.id),
                                                                    style: "destructive"
                                                                }
                                                            ]
                                                        );
                                                    }}
                                                >
                                                    <Text style={styles.deleteActionText}>Delete</Text>
                                                </TouchableOpacity>
                                            )}
                                        >
                                            <TouchableOpacity
                                                style={[
                                                    styles.taskItem,
                                                    { borderLeftWidth: 5, borderLeftColor: task.color || '#e19a50' },
                                                    task.completed && styles.completedTask
                                                ]}
                                                onPress={() => toggleTaskCompletion(currentWeekKey, weekday, task.id)}
                                            >
                                                <View style={styles.taskDetails}>
                                                    <Text
                                                        style={[
                                                            styles.taskName,
                                                            task.completed && styles.completedTaskText
                                                        ]}
                                                    >
                                                        {task.name}
                                                    </Text>
                                                    <Text style={styles.taskDateTime}>
                                                        {new Date(task.dateTime).toLocaleString()}
                                                    </Text>
                                                    <Text style={styles.taskReminder}>
                                                        Reminder: {
                                                        task.reminderMinutes === 60 ? '1 hour' :
                                                            task.reminderMinutes === 120 ? '2 hours' :
                                                                task.reminderMinutes === 720 ? '12 hours' :
                                                                    task.reminderMinutes === 1440 ? '1 day' :
                                                                        `${task.reminderMinutes} minutes`
                                                    } before
                                                    </Text>
                                                </View>
                                                <View
                                                    style={[
                                                        styles.checkbox,
                                                        task.completed && styles.checkedBox
                                                    ]}
                                                >
                                                    {task.completed && <Text style={styles.checkmark}>✓</Text>}
                                                </View>
                                            </TouchableOpacity>
                                        </Swipeable>
                                    ))
                                ) : (
                                    <Text style={styles.noTasksText}>No tasks for {weekday}</Text>
                                )}
                            </View>
                        ))}
                    </ScrollView>

                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={showReminderModal}
                        onRequestClose={dismissModal}
                    >
                        <TouchableWithoutFeedback onPress={dismissModal}>
                            <View style={styles.modalOverlay}>
                                <TouchableWithoutFeedback>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.modalHeader}>Select Reminder Time</Text>
                                        {reminderOptions.map((option) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                style={[
                                                    styles.reminderOption,
                                                    selectedReminderOption.value === option.value && styles.selectedReminderOption
                                                ]}
                                                onPress={() => {
                                                    setSelectedReminderOption(option);
                                                    setShowReminderModal(false);
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.reminderOptionText,
                                                        selectedReminderOption.value === option.value && styles.selectedReminderOptionText
                                                    ]}
                                                >
                                                    {option.label} before
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            style={styles.closeModalButton}
                                            onPress={dismissModal}
                                        >
                                            <Text style={styles.closeModalButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    </Modal>

                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={showColorModal}
                        onRequestClose={dismissColorModal}
                    >
                        <TouchableWithoutFeedback onPress={dismissColorModal}>
                            <View style={styles.modalOverlay}>
                                <TouchableWithoutFeedback>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.modalHeader}>Select Task Color</Text>
                                        <View style={styles.colorOptionsContainer}>
                                            {colorOptions.map((color) => (
                                                <TouchableOpacity
                                                    key={color.name}
                                                    style={[
                                                        styles.colorOption,
                                                        { backgroundColor: color.value },
                                                        selectedColor.name === color.name && styles.selectedColorOption
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedColor(color);
                                                        setShowColorModal(false);
                                                    }}
                                                >
                                                    {selectedColor.name === color.name && (
                                                        <Text style={styles.colorOptionCheck}>✓</Text>
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        <TouchableOpacity
                                            style={styles.closeModalButton}
                                            onPress={dismissColorModal}
                                        >
                                            <Text style={styles.closeModalButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    </Modal>
                </View>
            </GestureHandlerRootView>
        </InAppLayout>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    headerLeftSpace: {
        width: 60,
    },
    pointsIndicator: {
        flexDirection: 'row',
        alignItems: '',
        backgroundColor: '#fff5ee',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ffead9',
        alignSelf: 'flex-end'
    },
    pointsContainer: {
        backgroundColor: '#eb7d42',
        padding: 10,
        borderRadius: 20,
        marginBottom: 30,
    },
    pointsText: {
        color: '#eb7d42',
        fontWeight: 'bold',
        fontSize: 16,
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingTop: 50,
        paddingHorizontal: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#343a40',
    },
    weekNavigationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    addTaskButton: {
        backgroundColor: '#e19a50',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: '100%',
    },
    addTaskButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    addTaskContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 1,
    },
    addTaskHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addTaskHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#343a40',
    },
    closeButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#343a40',
        lineHeight: 24,
    },
    autocompleteContainer: {
        position: 'relative',
        zIndex: 2,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
    suggestionsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 6,
        maxHeight: 150,
        zIndex: 3,
    },
    suggestionsList: {
        width: '100%',
    },
    suggestionItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    colorPickerRow: {
        marginBottom: 16,
        zIndex: 1,
    },
    colorButton: {
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    colorButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    colorOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    colorOption: {
        width: '15%',
        aspectRatio: 1,
        borderRadius: 8,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: 2,
    },
    selectedColorOption: {
        borderWidth: 2,
        borderColor: '#343a40',
    },
    colorOptionCheck: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 6,
        color: '#495057',
    },
    weekdayButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#e9ecef',
    },
    weekdayButtonText: {
        fontSize: 14,
        color: '#495057',
    },
    selectedWeekdayText: {
        color: 'white',
        fontWeight: '500',
    },
    dateTimeRow: {
        marginBottom: 16,
        zIndex: 1,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dateButtonText: {
        fontSize: 16,
        color: '#495057',
    },
    datePickerBackdrop: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 4,
    },
    datePickerContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 0 : 'auto',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        zIndex: 5,
        padding: 15,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    datePicker: {
        backgroundColor: 'white',
    },
    datePickerDoneButton: {
        alignSelf: 'flex-end',
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    datePickerDoneText: {
        color: '#e19a50',
        fontSize: 16,
        fontWeight: '600',
    },
    reminderRow: {
        marginBottom: 16,
        zIndex: 1,
    },
    reminderButton: {
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    reminderButtonText: {
        fontSize: 16,
        color: '#495057',
    },
    addButton: {
        backgroundColor: '#e19a50',
        borderRadius: 6,
        paddingVertical: 12,
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    weekdaysContainer: {
        flex: 1,
        zIndex: 0,
    },
    weekdayContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    weekdayHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#343a40',
    },
    taskItemContainer: {
        marginBottom: 8,
    },
    taskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        backgroundColor: 'white',
    },
    completedTask: {
        opacity: 0.7,
    },
    taskDetails: {
        flex: 1,
    },
    taskName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
        color: '#343a40',
    },
    completedTaskText: {
        textDecorationLine: 'line-through',
        color: '#6c757d',
    },
    taskDateTime: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 2,
    },
    taskReminder: {
        fontSize: 12,
        color: '#6c757d',
        fontStyle: 'italic',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#4263eb',
        borderRadius: 4,
        marginLeft: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkedBox: {
        backgroundColor: '#4263eb',
    },
    checkmark: {
        color: 'white',
        fontSize: 16,
    },
    noTasksText: {
        fontSize: 14,
        color: '#6c757d',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 12,
    },
    deleteAction: {
        backgroundColor: '#ff6b6b',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
    },
    deleteActionText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#343a40',
    },
    reminderOption: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 6,
        marginBottom: 8,
        backgroundColor: '#f8f9fa',
    },
    selectedReminderOption: {
        backgroundColor: '#e19a50',
    },
    reminderOptionText: {
        fontSize: 16,
        color: '#495057',
        textAlign: 'center',
    },
    selectedReminderOptionText: {
        color: 'white',
        fontWeight: '500',
    },
    closeModalButton: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        backgroundColor: '#f1f1f1',
    },
    closeModalButtonText: {
        fontSize: 16,
        color: '#495057',
    },
    weekNavigationContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
    },
    weekDateRange: {
        fontSize: 18,
        fontWeight: '600',
        color: '#343a40',
        marginBottom: 12,
        textAlign: 'center',
    },
    weekNavigationControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    weekNavButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e19a50',
    },
    weekNavButtonText: {
        color: '#e19a50',
        fontWeight: '600',
        fontSize: 14,
    },
    currentWeekButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e19a50',
    },
    currentWeekButtonText: {
        color: '#e19a50',
        fontWeight: '600',
        fontSize: 14,
    },

});
