// App.js
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
    Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

import { PointsProvider, usePoints } from "../contexts/PointsContext";
import Spacer from "../components/Spacer";
import InAppLayout from "../components/InAppLayout";
import {FontAwesome5} from "@expo/vector-icons";

export default function AppWrapper() {
    return (
        <PointsProvider>
            <App />
        </PointsProvider>
    );
}

// Configure notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Request permissions for notifications
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

// Schedule a notification
async function scheduleNotification(task) {
    const taskTime = new Date(task.dateTime);

    // Create a notification time 1 hour before the task
    const notificationTime = new Date(taskTime);
    notificationTime.setHours(notificationTime.getHours() - 1);

    // Use the task.id as the identifier so we can cancel it later if needed
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Task Reminder',
            body: `"${task.name}" is scheduled in 1 hour`,
            data: { taskId: task.id },
        },
        trigger: notificationTime,
        identifier: task.id,
    });
}

function App() {
    const [tasks, setTasks] = useState({});
    const [taskName, setTaskName] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { points, addPoint } = usePoints();

    // Load tasks from storage when the app starts
    useEffect(() => {
        loadTasks();
        registerForPushNotificationsAsync();
    }, []);

    const loadTasks = async () => {
        try {
            const storedTasks = await AsyncStorage.getItem('tasks');
            if (storedTasks !== null) {
                setTasks(JSON.parse(storedTasks));
            } else {
                // Initialize with empty arrays for each weekday
                const initialTasks = {};
                weekdays.forEach(day => {
                    initialTasks[day] = [];
                });
                setTasks(initialTasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    // Save tasks to storage whenever they change
    useEffect(() => {
        const saveTasks = async () => {
            try {
                await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
            } catch (error) {
                console.error('Error saving tasks:', error);
            }
        };

        if (Object.keys(tasks).length > 0) {
            saveTasks();
        }
    }, [tasks]);

    const addTask = () => {
        if (taskName.trim() === '') {
            Alert.alert('Error', 'Task name cannot be empty');
            return;
        }

        const taskDate = new Date(date);

        // Determine which weekday this task belongs to
        const dayIndex = taskDate.getDay();
        // Convert from JS day (0=Sunday) to our weekday array (0=Monday)
        // So Sunday (0) becomes index 6, Monday (1) becomes index 0, etc.
        const weekdayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        const weekday = weekdays[weekdayIndex];

        const newTask = {
            id: Date.now().toString(),
            name: taskName,
            dateTime: taskDate.toISOString(),
            completed: false,
            pointAwarded: false,
        };

        setTasks(prevTasks => {
            const updatedTasks = {
                ...prevTasks,
                [weekday]: [...(prevTasks[weekday] || []), newTask]
            };
            return updatedTasks;
        });

        // Schedule a notification for this task
        scheduleNotification(newTask);

        // Reset input fields
        setTaskName('');
        setDate(new Date());
    };

    const toggleTaskCompletion = (weekday, taskId) => {
        setTasks(prevTasks => {
            const updatedWeekdayTasks = prevTasks[weekday].map(task => {
                if (task.id === taskId) {
                    const isBeingCompleted = !task.completed;

                    // Only add point if completing (not uncompleting) and not already awarded
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

            return {
                ...prevTasks,
                [weekday]: updatedWeekdayTasks
            };
        });
    };

    const deleteTask = (weekday, taskId) => {
        // Cancel the notification for this task
        Notifications.cancelScheduledNotificationAsync(taskId).catch(error => {
            console.log('Error cancelling notification:', error);
        });

        // Remove the task from state
        setTasks(prevTasks => {
            const updatedWeekdayTasks = prevTasks[weekday].filter(task => task.id !== taskId);

            return {
                ...prevTasks,
                [weekday]: updatedWeekdayTasks
            };
        });
    };

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(false);
        setDate(currentDate);
    };

    return (
        <InAppLayout>
        <GestureHandlerRootView style={{ flex: 1 }}>

            <Spacer height={20}/>
            <View style={styles.container}>
                <Text style={styles.header}>Weekly Tasks 📋 </Text>


                <View style={styles.pointsIndicator}>
                    <FontAwesome5 name="bone" size={16} color="#eb7d42" />
                    <Text style={styles.pointsText}> {points}</Text>
                </View>


                {/* Add Task Section */}
                <View style={styles.addTaskContainer}>
                    <Text style={styles.addTaskHeader}>Add New Task</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Task Name"
                        value={taskName}
                        onChangeText={setTaskName}
                    />

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
                        <DateTimePicker
                            value={date}
                            mode="datetime"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}

                    <TouchableOpacity style={styles.addButton} onPress={addTask}>
                        <Text style={styles.addButtonText}>Add Task</Text>
                    </TouchableOpacity>
                </View>

                {/* Tasks List Section */}
                <ScrollView style={styles.weekdaysContainer}>
                    {weekdays.map(weekday => (
                        <View key={weekday} style={styles.weekdayContainer}>
                            <Text style={styles.weekdayHeader}>{weekday}</Text>

                            {tasks[weekday]?.length > 0 ? (
                                tasks[weekday].map(task => (
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
                                                                onPress: () => deleteTask(weekday, task.id),
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
                                                task.completed && styles.completedTask
                                            ]}
                                            onPress={() => toggleTaskCompletion(weekday, task.id)}
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
            </View>
        </GestureHandlerRootView>
        </InAppLayout>
    );
}

const styles = StyleSheet.create({
    pointsIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff5ee',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ffead9',
    },
    pointsContainer: {
        backgroundColor: '#eb7d42',
        padding: 10,
        borderRadius: 20,
        alignSelf: 'center',
        marginBottom: 10,
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
    },
    addTaskHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#343a40',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
        fontSize: 16,
    },
    pickerContainer: {
        marginBottom: 12,
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
});