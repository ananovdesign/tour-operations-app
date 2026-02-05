import React from 'react';
// Импортираме готовия модул от главната директория src
import TaskManagementModule from '../../TaskManagementModule';

const Tasks = () => {
  return (
    <div className="animate-in fade-in duration-500 font-sans">
      {/* Тук просто рендираме готовото приложение */}
      <TaskManagementModule />
    </div>
  );
};

export default Tasks;
