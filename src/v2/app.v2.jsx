import React, { useState, useEffect, useCallback } from 'react';
import { auth, db, appId, onAuthStateChanged, signOut } from './services/firebase'; 
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// Страници
import Dashboard from './pages/Dashboard';
import ReservationsPage from './pages/Reservations';
import InvoicesPage from './pages/Invoices';
import FinancialsPage from './pages/Financials';
import DocumentsPage from './pages/Documents';

// Компоненти и Константи
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

    // --- ПЪЛЕН СПИСЪК С ДАННИ (ОТ СТАРИЯ APP.JSX) ---
    const [reservations, setReservations] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [tours, setTours] = useState([]);
    const [financialTransactions, setFinancialTransactions] = useState([]);
    const [salesInvoices, setSalesInvoices] = useState([]);
    const [expenseInvoices, setExpenseInvoices] = useState([]);
    const [products, setProducts] = useState([]);
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
        const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setUserId(u ? u.uid : null);
            setLoading(false);
        });
        return () => unsubscribeAuth();
    }, []);

    // --- СЛУШАТЕЛИ ЗА ВСИЧКИ КОЛЕКЦИИ (ТОЧНИ ИМЕНА ОТ СТАР И КЪМ APP.JSX) ---
    useEffect(() => {
        if (!userId) return;
        const base = `artifacts/${appId}/users/${userId}`;

        const unsubRes = onSnapshot(collection(db, `${base}/reservations`), (s) => setReservations(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubCust = onSnapshot(collection(db, `${base}/customers`), (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubTours = onSnapshot(collection(db, `${base}/tours`), (s) => setTours(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubFin = onSnapshot(collection(db, `${base}/financialTransactions`), (s) => setFinancialTransactions(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubSales = onSnapshot(collection(db, `${base}/salesInvoices`), (s) => setSalesInvoices(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubExp = onSnapshot(collection(db, `${base}/expenseInvoices`), (s) => setExpenseInvoices(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubProd = onSnapshot(collection(db, `${base}/products`), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubTasks = onSnapshot(collection(db, `${base}/tasks`), (s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));

        return () => {
            unsubRes(); unsubCust(); unsubTours(); unsubFin();
            unsubSales(); unsubExp(); unsubProd(); unsubTasks();
        };
    }, [userId]);

    const renderContent = () => {
        const props = { 
            userId, db, addNotification, setTab, 
            reservations, customers, tours, financialTransactions, 
            salesInvoices, expenseInvoices, products, tasks,
            setShowConfirmModal, setConfirmMessage, setConfirmAction 
        };

        switch (tab) {
            case TABS.DASHBOARD: return <Dashboard {...props} />;
            case TABS.RESERVATIONS: return <ReservationsPage {...props} />;
            case TABS.INVOICES: return <InvoicesPage {...props} />;
            case TABS.FINANCIALS: return <FinancialsPage {...props} />;
            case TABS.TASKS: return <TaskManagementModule isAuthReady={!!user} {...props} />;
            case TABS.MARKETING: return <MarketingHubModule isAuthReady={!!user} {...props} />;
            default: return <Dashboard {...props} />;
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center">Синхронизиране с Firebase...</div>;
    if (!user) return <div className="h-screen flex items-center justify-center font-bold text-red-600">МОЛЯ, ВЛЕЗТЕ В СИСТЕМАТА</div>;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <NotificationDisplay notifications={notifications} onDismiss={(id) => setNotifications(n => n.filter(x => x.id !== id))} />
            <aside className="w-64 bg-white border-r flex flex-col z-20">
                <div className="p-6 border-b text-center"><img src="../Logo.png" alt="Logo" className="h-10 mx-auto" /></div>
                <nav className="flex-1 p-4 space-y-1">
                    {Object.values(TABS).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`w-full text-left px-4 py-2 rounded-lg transition ${tab === t ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>{t}</button>
                    ))}
                </nav>
                <div className="p-4 border-t bg-gray-50"><button onClick={() => signOut(auth)} className="w-full bg-red-50 text-red-600 p-2 rounded-lg font-bold">Изход</button></div>
            </aside>
            <main className="flex-1 overflow-y-auto bg-gray-50">{renderContent()}</main>
            <ConfirmationModal show={showConfirmModal} message={confirmMessage} onConfirm={() => { confirmAction?.(); setShowConfirmModal(false); }} onCancel={() => setShowConfirmModal(false)} />
        </div>
    );
};

export default AppV2;
