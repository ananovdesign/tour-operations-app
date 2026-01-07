import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, db, appId, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from '../firebase'; 
import { 
  collection, query, onSnapshot, orderBy, 
  addDoc, serverTimestamp, getDocs 
} from 'firebase/firestore';

// Импортираме твоите работещи модули
import MarketingHubModule from '../MarketingHubModule.jsx';
import TaskManagementModule from '../TaskManagementModule.jsx';

// КОНСТАНТАТА ЗА ЕВРОТО
const BGN_TO_EUR = 1.95583;

const AppV2 = () => {
  // --- СЪСТОЯНИЯ ОТ ТВОЯ СТАР КОД ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // --- 1. ТВОЯТА ОРИГИНАЛНА AUTH ЛОГИКА ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. ТВОЯТА ОРИГИНАЛНА ЛОГИКА ЗА ДАННИ (TASKS) ---
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, `artifacts/${appId}/users/${user.uid}/tasks`), 
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
  }, [user]);

  // --- 3. ТВОЯТА ОРИГИНАЛНА ЛОГИКА ЗА ФАКТУРИ ---
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'invoices'), orderBy('date', 'desc'));
      return onSnapshot(q, (snapshot) => {
        setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
  }, [user]);

  // --- ФУНКЦИИ ЗА ВХОД/ИЗХОД ---
  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, loginEmail, loginPassword).catch(err => alert(err.message));
  };

  if (loading) return <div className="p-10 text-center">Зареждане на Dynamex...</div>;

  // АКО НЯМА ПОТРЕБИТЕЛ - ПОКАЗВАМЕ ТВОЯ ЛОГИН (със същия стил)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-xl mb-4 font-bold">Dynamex Tour - Вход</h2>
          <input className="w-full border p-2 mb-2" type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
          <input className="w-full border p-2 mb-4" type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
          <button onClick={handleLogin} className="w-full bg-blue-500 text-white p-2">Влез</button>
        </div>
      </div>
    );
  }

  // --- ГЛАВЕН ИНТЕРФЕЙС (Твоето съдържание, подредено) ---
  return (
    <div className="flex h-screen bg-gray-50">
      {/* МЕНЮ (SIDEBAR) */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 font-bold text-xl border-b border-slate-800">DYNAMEX 2026</div>
        <nav className="flex-1 p-4 space-y-2">
          {['dashboard', 'reservations', 'bus-tours', 'documents', 'marketing', 'tasks'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left p-3 rounded ${activeTab === tab ? 'bg-blue-600' : 'hover:bg-slate-800 uppercase text-xs font-bold'}`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="p-4 bg-red-800 hover:bg-red-700 text-sm">ИЗХОД ({user.email})</button>
      </div>

      {/* СЪДЪРЖАНИЕ - ТУК СЛАГАМЕ ТВОЯТА ЛОГИКА */}
      <div className="flex-1 overflow-auto p-8">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                <h3 className="text-gray-500 text-sm">Общо приходи (EUR)</h3>
                <p className="text-2xl font-bold">€ {(invoices.reduce((s, i) => s + (i.totalAmount || 0), 0)).toFixed(2)}</p>
             </div>
          </div>
        )}

        {/* ТУК ВИНАГИ ЩЕ ИЗПОЛЗВАМЕ ТВОИТЕ ОРИГИНАЛНИ МОДУЛИ */}
        {activeTab === 'marketing' && <MarketingHubModule db={db} userId={user.uid} isAuthReady={true} />}
        {activeTab === 'tasks' && <TaskManagementModule db={db} userId={user.uid} isAuthReady={true} tasks={tasks} />}
        
        {/* ЗА ФАКТУРИТЕ И ДОГОВОРИТЕ - ЩЕ ИЗПОЛЗВАМЕ ТВОИТЕ ФУНКЦИИ, НО С ЕВРО */}
        {activeTab === 'documents' && (
          <div className="bg-white p-6 rounded shadow">
             <h2 className="text-xl font-bold mb-4">Документи и Фактури</h2>
             <p className="text-sm text-gray-500 mb-4 italic text-orange-600 font-bold">Всички нови документи се генерират по фиксиран курс {BGN_TO_EUR}</p>
             {/* Тук ще вградим твоята функция renderInvoiceForm директно */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppV2;
