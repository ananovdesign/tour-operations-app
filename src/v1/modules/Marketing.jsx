import React from 'react';
// Импортираме готовия модул от главната директория src
import MarketingHubModule from '../../MarketingHubModule';

const Marketing = () => {
  return (
    <div className="animate-in fade-in duration-500 font-sans">
      {/* Тук просто рендираме готовото приложение */}
      <MarketingHubModule />
    </div>
  );
};

export default Marketing;
