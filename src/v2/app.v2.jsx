import React, { useState, useEffect, useCallback } from 'react';
import { auth, db, appId, onAuthStateChanged, signOut } from './services/firebase'; 
import { collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Страници и Компоненти
import Dashboard from './pages/Dashboard';
import ReservationsPage from './pages/Reservations';
import InvoicesPage from './pages/Invoices';
import FinancialsPage from './pages/Financials';
import DocumentsPage from './pages/Documents';
import { TABS } from './constants/appConstants';
import { NotificationDisplay, ConfirmationModal } from './components/ui/Feedback';

// Външни модули
import MarketingHubModule from '../MarketingHubModule';
import TaskManagementModule from '../TaskManagementModule';
import InvoicePrint from '../InvoicePrint';
import VoucherPrint from '../VoucherPrint';
import CustomerContractPrint from '../CustomerContractPrint';
import BusTourContractPrint from '../BusTourContractPrint';

const AppV2 = () => {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [tab, setTab] = useState(TABS.DASHBOARD);
    const [notifications, setNotifications] = useState([]);

    // --- ДАННИ (Зареждат се от Firebase) ---
    const [reservations, setReservations] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [financialEntries, setFinancialEntries] = useState([]);
    const [tasks, setTasks] = useState([]);

    // --- ФОРМИ ---
    const [reservationForm, setReservationForm] = useState({
        hotel: '', guestName: '', checkIn: '', checkOut: '',
        adults: 2, children: 0, roomType: '', status: 'Confirmed'
    });
    const [editingReservation, setEditingReservation] = useState(null);
    const [invoiceForm, setInvoiceForm] = useState({
        invoiceNumber: '', invoiceDate: '', clientName: '', 
        products: [{ productName: '', quantity: 1, price: 0 }]
    });

    // --- МОДАЛИ И ПЕЧАТ ---
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);
    const [printData, setPrintData] = useState(null);
    const [invoicePrintData, setInvoicePrintData] = useState(null);

    const addNotification = useCallback((message, type = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }, []);

    // --- СЛУШАТЕЛИ ЗА ДАННИ (LISTENERS) ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setUserId(u ? u.uid : null);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!userId) return;

        // 1. Резервации
        const unsubRes = onSnapshot(query(collection(db, `artifacts/${appId}/users/${userId}/reservations`), orderBy('createdAt', 'desc')), (s) => {
            setReservations(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 2. Фактури
        const unsubInv = onSnapshot(query(collection(db, `artifacts/${appId}/users/${userId}/invoices`), orderBy('invoiceDate', 'desc')), (s) => {
            setInvoices(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 3. Финанси
        const unsubFin = onSnapshot(query(collection(db, `artifacts/${appId}/users/${userId}/financials`), orderBy('createdAt', 'desc')), (s) => {
            setFinancialEntries(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 4. Задачи (за Dashboard брояча)
        const unsubTasks = onSnapshot(collection(db, `artifacts/${appId}/users/${userId}/tasks`), (s) => {
            setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubRes(); unsubInv(); unsubFin(); unsubTasks(); };
    }, [userId]);

    // --- ДЕЙСТВИЯ (HANDLERS) ---
    const handleReservationSubmit = async (e) => {
        e.preventDefault();
        try {
            const path = `artifacts/${appId}/users/${userId}/reservations`;
            if (editingReservation) {
                await setDoc(doc(db, path, editingReservation.id), { ...reservationForm, updatedAt: new Date().toISOString() });
                addNotification('Обновено успешно!');
                setEditingReservation(null);
            } else {
                await addDoc(collection(db, path), { ...reservationForm, createdAt: new Date().toISOString() });
                addNotification('Добавено успешно!');
            }
            setReservationForm({ hotel: '', guestName: '', checkIn: '', checkOut: '', adults: 2, children: 0, roomType: '', status: 'Confirmed' });
        } catch (err) { addNotification(err.message, 'error'); }
    };

    const handleDeleteReservation = (id) => {
        setConfirmMessage('Изтриване на резервация?');
        setConfirmAction(() => async () => {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/reservations`, id));
            addNotification('Изтрито!');
        });
        setShowConfirmModal(true);
    };

    const renderContent = () => {
        const props = { userId, db, addNotification, setTab, reservations, invoices, financialEntries, tasks };

        switch (tab) {
            case TABS.DASHBOARD: return <Dashboard {...props} />;
            case TABS.RESERVATIONS: return <ReservationsPage {...props} reservationForm={reservationForm} setReservationForm={setReservationForm} editingReservation={editingReservation} setEditingReservation={setEditingReservation} handleReservationSubmit={handleReservationSubmit} handleDeleteReservation={handleDeleteReservation} setPrintData={setPrintData} />;
            case TABS.INVOICES: return <InvoicesPage {...props} invoiceForm={invoiceForm} setInvoicePrintData={setInvoicePrintData} />;
            case TABS.FINANCIALS: return <FinancialsPage {...props} />;
            case TABS.DOCUMENTS: return <DocumentsPage {...props} setPrintData={setPrintData} />;
            case TABS.TASKS: return <TaskManagementModule isAuthReady={!!user} {...props} setShowConfirmModal={setShowConfirmModal} setConfirmMessage={setConfirmMessage} setConfirmAction={setConfirmAction} />;
            case TABS.MARKETING: return <MarketingHubModule isAuthReady={!!user} {...props} />;
            case 'VoucherPrint': return <VoucherPrint reservationData={printData} onBack={() => setTab(TABS.RESERVATIONS)} />;
            case 'InvoicePrint': return <InvoicePrint invoiceData={invoicePrintData} onBack={() => setTab(TABS.INVOICES)} />;
            case 'CustomerContractPrint': return <CustomerContractPrint reservationData={printData} onBack={() => setTab(TABS.DOCUMENTS)} />;
            default: return <Dashboard {...props} />;
        }
    };

    if (!user) return <div className="h-screen flex items-center justify-center font-bold">Зареждане...</div>;

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
            <NotificationDisplay notifications={notifications} onDismiss={(id) => setNotifications(n => n.filter(x => x.id !== id))} />
            <aside className="w-64 bg-white shadow-xl flex flex-col z-20">
                <div className="p-6 border-b text-center"><img src="../Logo.png" alt="Logo" className="h-10 mx-auto" /></div>
                <nav className="flex-1 p-4 space-y-1">
                    {Object.values(TABS).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`w-full text-left px-4 py-2 rounded-lg transition ${tab === t ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>{t}</button>
                    ))}
                </nav>
                <div className="p-4 border-t bg-gray-50 text-xs text-center">
                    <div className="mb-2 text-gray-400">{user.email}</div>
                    <button onClick={() => signOut(auth)} className="w-full bg-red-50 text-red-600 p-2 rounded-lg font-bold">Изход</button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto p-8">{renderContent()}</main>
            <ConfirmationModal show={showConfirmModal} message={confirmMessage} onConfirm={() => { confirmAction?.(); setShowConfirmModal(false); }} onCancel={() => setShowConfirmModal(false)} />
        </div>
    );
};

export default AppV2;
