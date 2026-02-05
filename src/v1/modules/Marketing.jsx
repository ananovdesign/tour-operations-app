import React, { useState, useEffect } from 'react';
import { db, appId, auth } from '../../firebase'; // Взимаме глобалните настройки
import { collection, onSnapshot } from 'firebase/firestore';
// Импортираме твоя оригинален, непроменен файл
import MarketingHubModule from '../../MarketingHubModule';

const Marketing = () => {
  // 1. Създаваме състояние за данните, които старият модул очаква
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const userId = auth.currentUser?.uid;

  // 2. Изтегляме данните, за да ги подадем на модула
  useEffect(() => {
    // Използваме пътя, който видях в твоя код: artifacts/{appId}/public/data/campaigns
    const campaignsRef = collection(db, `artifacts/${appId}/public/data/campaigns`);
    
    const unsubscribe = onSnapshot(campaignsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(data);
      setLoading(false);
    }, (error) => {
      console.error("Error loading campaigns:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
        <div className="flex h-64 items-center justify-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest">Зареждане на Маркетинг модула...</p>
        </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 font-sans">
      {/* 3. ТУК Е РАЗКОВНИЧЕТО:
         Подаваме всички props, които твоят оригинален MarketingHubModule очаква.
         Така той ще спре да дава грешка, защото вече ще има "campaigns", "db" и "userId".
      */}
      <MarketingHubModule 
        db={db}
        userId={userId}
        isAuthReady={!!userId}
        campaigns={campaigns} // Ето това липсваше и чупеше .filter()
      />
    </div>
  );
};

export default Marketing;
