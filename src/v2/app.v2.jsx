import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db, appId, onAuthStateChanged, signOut } from './services/firebase'; 
import { collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';

// Страници
import Dashboard from './pages/Dashboard';
import ReservationsPage from './pages/Reservations';
import InvoicesPage from './pages/Invoices';
import FinancialsPage from './pages/Financials';
import DocumentsPage from './pages/Documents';

// Компоненти
import { TABS } from './constants/appConstants';
import { NotificationDisplay, ConfirmationModal } from './components/ui/Feedback';
import MarketingHubModule from '../MarketingHubModule';
import TaskManagementModule from '../TaskManagementModule';

const AppV2 = () => {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [tab, setTab] = useState(TABS.DASHBOARD);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // СТРУКТУРИ ДАННИ (Идентични със стария App.jsx)
    const [reservations, setReservations] = useState([]);
    const [financialEntries, setFinancialEntries] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [tasks, setTasks] = useState([]);

    // Системни състояния
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);

    const addNotification = useCallback((message, type = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setUserId(u ? u.uid : null);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // СЛУШАТЕЛИ - ИЗПОЛЗВАМЕ ТОЧНИТЕ ПЪТИЩА ОТ СТАРОТО ПРИЛОЖЕНИЕ
    useEffect(() => {
        if (!userId) return;

        const base = `artifacts/${appId}/users/${userId}`;

        // 1. Резервации (За метриките: Total Reservations, Profit, Stay)
        const unsubRes = onSnapshot(collection(db, `${base}/reservations`), (s) => {
            setReservations(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 2. Финанси (За Financial Overview: Income, Expenses, Balances)
        const unsubFin = onSnapshot(collection(db, `${base}/financials`), (s) => {
            setFinancialEntries(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 3. Фактури (За Invoice Health: Unpaid, Overdue)
        const unsubInv = onSnapshot(collection(db, `${base}/invoices`), (s) => {
            setInvoices(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 4. Задачи
        const unsubTasks = onSnapshot(collection(db, `${base}/tasks`), (s) => {
            setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubRes(); unsubFin(); unsubInv(); unsubTasks(); };
    }, [userId]);

    const renderContent = () => {
        const commonProps = { 
            userId, db, appId, addNotification, setTab,
            reservations, financialEntries, invoices, tasks,
            setShowConfirmModal, setConfirmMessage, setConfirmAction 
        };

        switch (tab) {
            case TABS.DASHBOARD: return <Dashboard {...commonProps} />;
            case TABS.RESERVATIONS: return <ReservationsPage {...commonProps} />;
            case TABS.INVOICES: return <InvoicesPage {...commonProps} />;
            case TABS.FINANCIALS: return <FinancialsPage {...commonProps} />;
            case TABS.TASKS: return <TaskManagementModule isAuthReady={!!user} {...commonProps} />;
            case TABS.MARKETING: return <MarketingHubModule isAuthReady={!!user} {...commonProps} />;
            default: return <Dashboard {...commonProps} />;
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-bold">Зареждане...</div>;
    if (!user) return <div className="h-screen flex items-center justify-center font-bold text-red-600 uppercase">Влезте в системата</div>;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <NotificationDisplay notifications={notifications} onDismiss={(id) => setNotifications(n => n.filter(x => x.id !== id))} />
            
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20">
                <div className="p-6 border-b text-center">
                    <img src="../Logo.png" alt="Logo" className="h-10 mx-auto" />
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {Object.values(TABS).map((t) => (
                        <button key={t} onClick={() => setTab(t)} className={`w-full text-left px-4 py-3 rounded-xl transition ${tab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="font-semibold text-sm">{t}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t bg-gray-50">
                    <button onClick={() => signOut(auth)} className="w-full bg-red-50 text-red-600 p-2 rounded-lg font-bold text-sm">Изход</button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-8">{renderContent()}</main>
            
            <ConfirmationModal show={showConfirmModal} message={confirmMessage} onConfirm={() => { confirmAction?.(); setShowConfirmModal(false); }} onCancel={() => setShowConfirmModal(false)} />
        </div>
    );
};

export default AppV2;
