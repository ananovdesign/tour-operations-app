import React, { useState, useEffect } from 'react';
import { db, appId, auth } from '../../firebase'; // Връзка с базата и аутентикацията
import { collection, onSnapshot } from 'firebase/firestore'; 
import TaskManagementModule from '../../TaskManagementModule'; // Твоят оригинален файл

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
        setLoading(false);
        return;
    }

    // 1. Предполагам, че задачите се пазят в 'tasks' колекцията на потребителя.
    // Ако не се появят, може пътят да е 'todos', но 'tasks' е стандартът в твоята система.
    const tasksRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);
    
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
      setLoading(false);
    }, (error) => {
      console.error("Error loading tasks:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
        <div className="flex h-64 items-center justify-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest">Зареждане на Задачи...</p>
        </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 font-sans">
      {/* 2. Подаваме всичко необходимо на стария модул:
         - db: за да може да записва нови задачи
         - userId: за да знае кой ги създава
         - isAuthReady: за да махне съобщението "Please log in"
         - tasks: списъкът със задачи (ако модулът го очаква като prop)
      */}
      <TaskManagementModule 
        db={db}
        userId={userId}
        isAuthReady={!!userId}
        tasks={tasks} 
      />
    </div>
  );
};

export default Tasks;
