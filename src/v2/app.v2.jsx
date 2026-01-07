import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db, appId, onAuthStateChanged, signOut } from './services/firebase'; 
import { collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Страници
import Dashboard from './pages/Dashboard';
import ReservationsPage from './pages/Reservations';
import InvoicesPage from './pages/Invoices';
import FinancialsPage from './pages/Financials';
import DocumentsPage from './pages/Documents';

// Компоненти и Модули
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

    // Държави (States) за данни
    const [reservations, setReservations] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [financialEntries, setFinancialEntries] = useState([]);
    const [tasks, setTasks] = useState([]);

    // Системни състояния за модали
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);

    // 1. Добавяне на известие
    const addNotification = useCallback((message, type = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }, []);

    // 2. Аутентикация
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setUserId(u ? u.uid : null);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 3. СЛУШАТЕЛИ ЗА ДАННИ - ТУК Е КЛЮЧЪТ КЪМ ПЪЛНИЯ DASHBOARD
    useEffect(() => {
        if (!userId) return;

        const paths = {
            res: `artifacts/${appId}/users/${userId}/reservations`,
            inv: `artifacts/${appId}/users/${userId}/invoices`,
            fin: `artifacts/${appId}/users/${userId}/financials`,
            tsks: `artifacts/${appId}/users/${userId}/tasks`
        };

        const unsubRes = onSnapshot(query(collection(db, paths.res), orderBy('createdAt', 'desc')), (s) => {
            setReservations(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubInv = onSnapshot(query(collection(db, paths.inv), orderBy('invoiceDate', 'desc')), (s) => {
            setInvoices(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubFin = onSnapshot(query(collection(db, paths.fin), orderBy('createdAt', 'desc')), (s) => {
            setFinancialEntries(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubTasks = onSnapshot(collection(db, paths.tsks), (s) => {
            setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubRes(); unsubInv(); unsubFin(); unsubTasks(); };
    }, [userId]);

    // 4. Рендиране на съдържанието
    const renderContent = () => {
        // Тези пропсове трябва да са идентични с това, което страниците очакват
        const commonProps = { 
            userId, db, addNotification, setTab, 
            reservations, invoices, financialEntries, tasks,
            setShowConfirmModal, setConfirmMessage, setConfirmAction
        };

        switch (tab) {
            case TABS.DASHBOARD: 
                return <Dashboard {...commonProps} />;
            case TABS.RESERVATIONS: 
                return <ReservationsPage {...commonProps} />;
            case TABS.INVOICES: 
                return <InvoicesPage {...commonProps} />;
            case TABS.FINANCIALS: 
                return <FinancialsPage {...commonProps} />;
            case TABS.TASKS: 
                return <TaskManagementModule isAuthReady={!!user} {...commonProps} />;
            case TABS.MARKETING: 
                return <MarketingHubModule isAuthReady={!!user} {...commonProps} />;
            default: 
                return <Dashboard {...commonProps} />;
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center">Зареждане на системата...</div>;

    if (!user) return (
        <div className="h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
                <img src="../Logo.png" alt="Logo" className="h-16 mx-auto mb-6" />
                <h2 className="text-xl font-bold mb-4">Вход в системата</h2>
                <p className="text-gray-500 mb-6">Моля, използвайте оторизиран достъп.</p>
                {/* Тук можеш да добавиш твоя Login компонент */}
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <NotificationDisplay notifications={notifications} onDismiss={(id) => setNotifications(n => n.filter(x => x.id !== id))} />
            
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20">
                <div className="p-6 border-b flex flex-col items-center">
                    <img src="../Logo.png" alt="Logo" className="h-10 mb-2" />
                    <div className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold uppercase tracking-wider">Control Panel v2</div>
                </div>
                
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {Object.values(TABS).map((t) => (
                        <button 
                            key={t}
                            onClick={() => setTab(t)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                                tab === t ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <span className="font-semibold text-sm">{t}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t bg-gray-50">
                    <div className="text-xs text-gray-400 mb-3 px-2 truncate">{user.email}</div>
                    <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 bg-white border border-red-100 text-red-600 p-2.5 rounded-xl hover:bg-red-50 transition text-sm font-bold">
                        Изход
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-[1600px] mx-auto">
                    {renderContent()}
                </div>
            </main>

            <ConfirmationModal 
                show={showConfirmModal} 
                message={confirmMessage} 
                onConfirm={() => { confirmAction?.(); setShowConfirmModal(false); }} 
                onCancel={() => setShowConfirmModal(false)} 
            />
        </div>
    );
};

export default AppV2;
