import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, addDoc, setDoc, deleteDoc, query, orderBy, onSnapshot, doc } from 'firebase/firestore';

const TaskManagementModule = ({ db, userId, isAuthReady, addNotification, setShowConfirmModal, setConfirmMessage, setConfirmAction }) => {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null); // For editing
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        status: 'Planned', // Default status
        createdAt: '',
    });
    const [filterTaskStatus, setFilterTaskStatus] = useState('All');
    const [sortTaskConfig, setSortTaskConfig] = useState({ key: 'createdAt', direction: 'descending' });

    // App ID needs to be consistent with your Firebase setup
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Firestore listener for Tasks
    useEffect(() => {
        let unsubscribe;
        if (isAuthReady && userId) {
            if (!db) {
                console.warn("Firestore instance not available for tasks yet.");
                return;
            }
            // setLoading(true); // Handled by App.jsx
            const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);
            const q = query(tasksCollectionRef, orderBy('createdAt', 'desc')); // Order tasks by creation date newest first

            unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setTasks(data);
                // setLoading(false); // Handled by App.jsx, avoid double setting
            }, (err) => {
                console.error("Error fetching tasks:", err);
                addNotification("Failed to load tasks. Please try again.", 'error');
                // setLoading(false); // Handled by App.jsx
            });
        } else {
            setTasks([]);
            // setLoading(false); // Handled by App.jsx
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isAuthReady, userId, appId, db, addNotification]);


    // --- Task Management Functions ---
    const handleTaskFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setTaskForm(prev => ({ ...prev, [name]: value }));
    }, []);

    const resetTaskForm = useCallback(() => {
        setTaskForm({
            title: '',
            description: '',
            dueDate: '',
            status: 'Planned',
            createdAt: '',
        });
        setSelectedTask(null);
    }, []);

    const handleSubmitTask = async (e) => {
        e.preventDefault();
        // setLoading(true); // Handled by App.jsx
        // setError(null); // Handled by App.jsx
        addNotification('');

        if (!userId) {
            addNotification("User not authenticated. Please log in to save data.", 'error');
            // setLoading(false);
            return;
        }

        try {
            const taskData = {
                ...taskForm,
                createdAt: taskForm.createdAt || new Date().toISOString(), // Set creation date if new
            };

            const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);

            if (selectedTask) {
                const taskDocRef = doc(tasksCollectionRef, selectedTask.id);
                await setDoc(taskDocRef, taskData, { merge: true });
                addNotification('Task updated successfully!', 'success');
            } else {
                await addDoc(tasksCollectionRef, taskData);
                addNotification('Task added successfully!', 'success');
            }

            resetTaskForm();
        } catch (err) {
            console.error("Error saving task:", err);
            addNotification(`Failed to save task: ${err.message || err.toString()}`, 'error');
        } finally {
            // setLoading(false);
        }
    };

    const handleEditTask = useCallback((task) => {
        setTaskForm({
            ...task,
            // Ensure dueDate is correctly formatted for input type="date"
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        });
        setSelectedTask(task);
    }, []);

    const handleDeleteTask = useCallback((taskId) => {
        setShowConfirmModal(true);
        setConfirmMessage("Are you sure you want to delete this task?");
        setConfirmAction(() => async () => {
            // setLoading(true); // Handled by App.jsx
            // setError(null); // Handled by App.jsx
            addNotification('');
            if (!userId) {
                addNotification("User not authenticated. Please log in to delete data.", 'error');
                // setLoading(false);
                return;
            }
            try {
                const taskDocRef = doc(db, `artifacts/${appId}/users/${userId}/tasks`, taskId);
                await deleteDoc(taskDocRef);
                addNotification('Task deleted successfully!', 'success');
            } catch (err) {
                console.error("Error deleting task:", err);
                addNotification(`Failed to delete task: ${err.message || err.toString()}`, 'error');
            } finally {
                // setLoading(false);
            }
        });
    }, [userId, appId, db, addNotification, setShowConfirmModal, setConfirmMessage, setConfirmAction]);

    const handleTaskFilterChange = useCallback((e) => {
        setFilterTaskStatus(e.target.value);
    }, []);

    const handleTaskSortRequest = useCallback((key) => {
        let direction = 'ascending';
        if (sortTaskConfig.key === key && sortTaskConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortTaskConfig({ key, direction });
    }, [sortTaskConfig]);

    const filteredAndSortedTasks = useMemo(() => {
        let currentTasks = [...tasks];

        // Filter by status
        if (filterTaskStatus !== 'All') {
            currentTasks = currentTasks.filter(task => task.status === filterTaskStatus);
        }

        // Sort
        currentTasks.sort((a, b) => {
            const aValue = a[sortTaskConfig.key];
            const bValue = b[sortTaskConfig.key];

            if (aValue < bValue) {
                return sortTaskConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortTaskConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return currentTasks;
    }, [tasks, filterTaskStatus, sortTaskConfig]);

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
                Task Management
            </h2>

            {/* Task Form (Add/Edit) */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg shadow-inner border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{selectedTask ? 'Edit Task' : 'Create New Task'}</h3>
                <form onSubmit={handleSubmitTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            id="taskTitle"
                            name="title"
                            value={taskForm.title}
                            onChange={handleTaskFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            id="taskStatus"
                            name="status"
                            value={taskForm.status}
                            onChange={handleTaskFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        >
                            <option value="Planned">Planned</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            id="taskDescription"
                            name="description"
                            rows="3"
                            value={taskForm.description}
                            onChange={handleTaskFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                            type="date"
                            id="taskDueDate"
                            name="dueDate"
                            value={taskForm.dueDate}
                            onChange={handleTaskFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        />
                    </div>
                    <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
                        <button
                            type="button"
                            onClick={resetTaskForm}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-200 shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 shadow-md"
                            disabled={!taskForm.title.trim()}
                        >
                            {selectedTask ? 'Update Task' : 'Add Task'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Task List with Filters and Sort */}
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">All Tasks</h3>
            <div className="flex flex-wrap gap-4 mb-6">
                <div>
                    <label htmlFor="filterTaskStatus" className="block text-sm font-medium text-gray-700">Filter by Status</label>
                    <select
                        id="filterTaskStatus"
                        value={filterTaskStatus}
                        onChange={handleTaskFilterChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                    >
                        <option value="All">All</option>
                        <option value="Planned">Planned</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={() => handleTaskSortRequest('dueDate')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200 shadow-sm border border-gray-200"
                    >
                        Sort by Due Date {sortTaskConfig.key === 'dueDate' ? (sortTaskConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                    </button>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={() => handleTaskSortRequest('createdAt')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200 shadow-sm border border-gray-200"
                    >
                        Sort by Creation Date {sortTaskConfig.key === 'createdAt' ? (sortTaskConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                    </button>
                </div>
            </div>

            {filteredAndSortedTasks.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No tasks found. Create a new task to get started!</p>
            ) : (
                <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium">Title</th>
                                <th className="py-3 px-4 text-left font-medium">Status</th>
                                <th className="py-3 px-4 text-left font-medium">Due Date</th>
                                <th className="py-3 px-4 text-left font-medium">Created At</th>
                                <th className="py-3 px-4 text-center font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {filteredAndSortedTasks.map(task => (
                                <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                                    <td className="py-3 px-4 font-semibold">{task.title}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                            ${task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                              task.status === 'Planned' ? 'bg-blue-100 text-blue-800' :
                                              'bg-red-100 text-red-800'}`
                                        }>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{task.dueDate || 'N/A'}</td>
                                    <td className="py-3 px-4 text-gray-600">{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    <td className="py-3 px-4 flex justify-center space-x-2">
                                        <button
                                            onClick={() => handleEditTask(task)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full shadow-md transition duration-200"
                                            title="Edit Task"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-5.69 5.69L11.586 7.586 14.414 10.414 11.586 13.242 8.758 10.414l2.828-2.828z" /><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm-4 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 14a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM3 18a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition duration-200"
                                            title="Delete Task"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm-1 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1zm-1 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                    </td>
                                </tr>
                                {selectedTask && selectedTask.id === task.id && (
                                    <tr className="bg-gray-50">
                                        <td colSpan="5" className="p-4 text-sm text-gray-700 border-t">
                                            <p className="font-semibold mb-1">Description:</p>
                                            <p>{task.description || 'No description provided.'}</p>
                                        </td>
                                    </tr>
                                )}
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TaskManagementModule;
