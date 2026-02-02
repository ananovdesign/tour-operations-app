import React, { useState, useEffect, useCallback } from 'react';
import { auth, db, appId, onAuthStateChanged, signOut } from './services/firebase'; 
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Страници
import Dashboard from './pages/Dashboard';
import ReservationsPage from './pages/Reservations';
import InvoicesPage from './pages/Invoices';
import FinancialsPage from './pages/Financials';

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

    // --- ДАННИ ОТ FIREBASE ---
    const [reservations, setReservations] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [tours, setTours] = useState([]);
    const [financialTransactions, setFinancialTransactions] = useState([]);
    const [salesInvoices, setSalesInvoices] = useState([]);
    const [expenseInvoices, setExpenseInvoices] = useState([]);
    const [products, setProducts] = useState([]);
    const [tasks, setTasks] = useState([]);

    // --- СЪСТОЯНИЯ ЗА ФОРМИТЕ (КРИТИЧНО ЗА РЕЗЕРВАЦИИТЕ) ---
    const [editingReservation, setEditingReservation] = useState(null);
    const [reservationForm, setReservationForm] = useState({
        hotel: '', guestName: '', checkIn: '', checkOut: '', 
        adults: 2, children: 0, status: 'Confirmed', profit: 0, totalNights: 0
    });
    const [printData, setPrintData] = useState(null);

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

    // --- СЛУШАТЕЛИ ЗА FIREBASE ---
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

    // --- ФУНКЦИИ ЗА УПРАВЛЕНИЕ НА РЕЗЕРВАЦИИ ---
    const handleReservationSubmit = async (e) => {
        e.preventDefault();
        const path = `artifacts/${appId}/users/${userId}/reservations`;
        try {
            if (editingReservation) {
                await updateDoc(doc(db, path, editingReservation.id), reservationForm);
                addNotification('Резервацията е обновена!');
                setEditingReservation(null);
            } else {
                await addDoc(collection(db, path), reservationForm);
                addNotification('Успешно добавена резервация!');
            }
            setReservationForm({ hotel: '', guestName: '', checkIn: '', checkOut: '', adults: 2, children: 0, status: 'Confirmed', profit: 0, totalNights: 0 });
        } catch (error) {
            addNotification('Грешка при запис!', 'error');
        }
    };

    const handleDeleteReservation = (id) => {
        setConfirmMessage('Сигурни ли сте, че искате да изтриете тази резервация?');
        setConfirmAction(() => async () => {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/reservations`, id));
                addNotification('Резервацията е изтрита!');
            } catch (error) {
                addNotification('Грешка при изтриване!', 'error');
            }
        });
        setShowConfirmModal(true);
    };

    const renderContent = () => {
        const props = { 
            userId, db, addNotification, setTab, 
            reservations, customers, tours, financialTransactions, 
            salesInvoices, expenseInvoices, products, tasks,
            reservationForm, setReservationForm,
            editingReservation, setEditingReservation,
            handleReservationSubmit, handleDeleteReservation,
            setPrintData,
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

    if (loading) return <div className="h-screen flex items-center justify-center bg-white">Синхронизиране с Firebase...</div>;
    if (!user) return <div className="h-screen flex items-center justify-center font-bold text-red-600">МОЛЯ, ВЛЕЗТЕ В СИСТЕМАТА</div>;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
            <NotificationDisplay notifications={notifications} onDismiss={(id) => setNotifications(n => n.filter(x => x.id !== id))} />
            
            <aside className="w-64 bg-white border-r flex flex-col z-20 shadow-sm">
                <div className="p-6 border-b flex justify-center">
                    <img src="/Logo.png" alt="Logo" className="h-10 object-contain" />
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {Object.values(TABS).map(t => (
                        <button 
                            key={t} 
                            onClick={() => setTab(t)} 
                            className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                                tab === t 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t bg-gray-50">
                    <div className="mb-4 px-2 text-xs text-gray-400 truncate">{user.email}</div>
                    <button onClick={() => signOut(auth)} className="w-full bg-red-50 text-red-600 p-2.5 rounded-xl font-bold hover:bg-red-100 transition-colors">
                        Изход
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto relative">
                <div className="p-8 max-w-7xl mx-auto">
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
