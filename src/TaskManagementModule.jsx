import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, addDoc, setDoc, deleteDoc, query, orderBy, onSnapshot, doc } from 'firebase/firestore';

const TaskManagementModule = ({ db, userId, isAuthReady, addNotification, setShowConfirmModal, setConfirmMessage, setConfirmAction }) => {
    // Task Management states
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

    // App ID fallback
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Firestore listener for Tasks
    useEffect(() => {
        let unsubscribe;
        if (isAuthReady && userId) {
            if (!db) {
                console.warn("Firestore instance not available for tasks yet.");
                return;
            }
            const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);
            const q = query(tasksCollectionRef, orderBy('createdAt', 'desc'));

            unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setTasks(data);
            }, (err) => {
                console.error("Error fetching tasks:", err);
                addNotification("Failed to load tasks. Please try again.", 'error');
            });
        } else {
            setTasks([]);
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
        addNotification('');

        if (!userId) {
            addNotification("User not authenticated. Please log in to save data.", 'error');
            return;
        }

        try {
            const taskData = {
                ...taskForm,
                createdAt: taskForm.createdAt || new Date().toISOString(),
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
        }
    };

    const handleEditTask = useCallback((task) => {
        setTaskForm({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        });
        setSelectedTask(task);
        // Scroll to form (optional UX improvement)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleDeleteTask = useCallback((taskId) => {
        setShowConfirmModal(true);
        setConfirmMessage("Are you sure you want to delete this task?");
        setConfirmAction(() => async () => {
            addNotification('');
            if (!userId) {
                addNotification("User not authenticated. Please log in to delete data.", 'error');
                return;
            }
            try {
                const taskDocRef = doc(db, `artifacts/${appId}/users/${userId}/tasks`, taskId);
                await deleteDoc(taskDocRef);
                addNotification('Task deleted successfully!', 'success');
            } catch (err) {
                console.error("Error deleting task:", err);
                addNotification(`Failed to delete task: ${err.message || err.toString()}`, 'error');
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

        if (filterTaskStatus !== 'All') {
            currentTasks = currentTasks.filter(task => task.status === filterTaskStatus);
        }

        currentTasks.sort((a, b) => {
            const aValue = a[sortTaskConfig.key];
            const bValue = b[sortTaskConfig.key];

            if (aValue < bValue) return sortTaskConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortTaskConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return currentTasks;
    }, [tasks, filterTaskStatus, sortTaskConfig]);

    return (
        <div className="bg-white w-full shadow-xl rounded-lg overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Задачи</h2>
                    <p className="text-slate-500 text-sm mt-1">Управление на оперативни задачи и напомняния.</p>
                </div>
                <div className="text-3xl">📋</div>
            </div>

            <div className="p-6 md:p-8">
                {/* Task Form (Add/Edit) */}
                <div className="mb-8 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                        <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                            {selectedTask ? 'Редактиране на задача' : 'Нова задача'}
                        </h3>
                    </div>
                    
                    <form onSubmit={handleSubmitTask} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="taskTitle" className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Заглавие</label>
                            <input
                                type="text"
                                id="taskTitle"
                                name="title"
                                value={taskForm.title}
                                onChange={handleTaskFormChange}
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="Напр: Обаждане на хотел..."
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="taskStatus" className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Статус</label>
                            <select
                                id="taskStatus"
                                name="status"
                                value={taskForm.status}
                                onChange={handleTaskFormChange}
                                className="w-full p-2 border border-slate-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Planned">Планирана</option>
                                <option value="Completed">Завършена</option>
                                <option value="Cancelled">Отменена</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="taskDueDate" className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Краен срок</label>
                            <input
                                type="date"
                                id="taskDueDate"
                                name="dueDate"
                                value={taskForm.dueDate}
                                onChange={handleTaskFormChange}
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="taskDescription" className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Описание</label>
                            <textarea
                                id="taskDescription"
                                name="description"
                                rows="3"
                                value={taskForm.description}
                                onChange={handleTaskFormChange}
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Допълнителни детайли..."
                            ></textarea>
                        </div>

                        <div className="md:col-span-2 flex justify-end space-x-3 pt-2">
                            {selectedTask && (
                                <button
                                    type="button"
                                    onClick={resetTaskForm}
                                    className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 transition text-sm font-medium"
                                >
                                    Отказ
                                </button>
                            )}
                            <button
                                type="submit"
                                className={`px-6 py-2 rounded text-white text-sm font-bold shadow-md transition transform hover:scale-105 ${
                                    selectedTask ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                                disabled={!taskForm.title.trim() || !isAuthReady || !userId}
                            >
                                {selectedTask ? '💾 Запази промените' : '+ Добави задача'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Filters & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
                    <div className="w-full md:w-auto">
                        <label htmlFor="filterTaskStatus" className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Филтър по статус</label>
                        <select
                            id="filterTaskStatus"
                            value={filterTaskStatus}
                            onChange={handleTaskFilterChange}
                            className="w-full md:w-48 p-2 border border-slate-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="All">Всички</option>
                            <option value="Planned">Планирани</option>
                            <option value="Completed">Завършени</option>
                            <option value="Cancelled">Отменени</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleTaskSortRequest('dueDate')}
                            className={`px-3 py-2 text-xs font-bold rounded border transition ${
                                sortTaskConfig.key === 'dueDate' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            Срок {sortTaskConfig.key === 'dueDate' ? (sortTaskConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                        </button>
                        <button
                            onClick={() => handleTaskSortRequest('createdAt')}
                            className={`px-3 py-2 text-xs font-bold rounded border transition ${
                                sortTaskConfig.key === 'createdAt' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            Създадени {sortTaskConfig.key === 'createdAt' ? (sortTaskConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                        </button>
                    </div>
                </div>

                {/* Task List */}
                {!isAuthReady || !userId ? (
                    <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Моля, влезте в системата, за да управлявате задачи.</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Няма намерени задачи. Създайте нова!</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                        <table className="min-w-full bg-white text-sm">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Заглавие</th>
                                    <th className="py-3 px-4 text-center">Статус</th>
                                    <th className="py-3 px-4 text-left">Краен срок</th>
                                    <th className="py-3 px-4 text-left">Създадена</th>
                                    <th className="py-3 px-4 text-right">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAndSortedTasks.map(task => (
                                    <React.Fragment key={task.id}>
                                        <tr className={`hover:bg-slate-50 transition ${selectedTask && selectedTask.id === task.id ? 'bg-blue-50' : ''}`}>
                                            <td className="py-3 px-4 font-semibold text-slate-700">{task.title}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                    ${task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                      task.status === 'Planned' ? 'bg-blue-100 text-blue-700' :
                                                      'bg-red-100 text-red-700'}`
                                                }>
                                                    {task.status === 'Planned' ? 'Планирана' : 
                                                     task.status === 'Completed' ? 'Завършена' : 
                                                     task.status === 'Cancelled' ? 'Отменена' : task.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">
                                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('bg-BG') : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 text-xs">
                                                {task.createdAt ? new Date(task.createdAt).toLocaleDateString('bg-BG') : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEditTask(task)}
                                                    className="text-yellow-600 hover:text-yellow-800 p-1 hover:bg-yellow-50 rounded transition"
                                                    title="Редактирай"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                                                    title="Изтрий"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Description Row - Visible only when editing or if desired explicitly */}
                                        {((selectedTask && selectedTask.id === task.id) || task.description) && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan="5" className="px-4 py-2 text-xs text-slate-500 italic border-b border-slate-100 pl-8">
                                                    {task.description}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskManagementModule;
