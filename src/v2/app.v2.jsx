import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, db, appId, onAuthStateChanged, signOut 
} from './services/firebase'; 
import { 
  collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, orderBy 
} from 'firebase/firestore';

// Импорт на новите страници (вече създадени)
import Dashboard from './pages/Dashboard';
import ReservationsPage from './pages/Reservations';
import InvoicesPage from './pages/Invoices';
import FinancialsPage from './pages/Financials';
import DocumentsPage from './pages/Documents';

// Импорт на външните модули и компоненти за печат
import MarketingHubModule from '../MarketingHubModule';
import TaskManagementModule from '../TaskManagementModule';
import InvoicePrint from '../InvoicePrint';
import VoucherPrint from '../VoucherPrint';
import CustomerContractPrint from '../CustomerContractPrint';
import BusTourContractPrint from '../BusTourContractPrint';

// Импорт на Константи и Помощни функции
import { TABS } from './constants/appConstants';
import { NotificationDisplay, ConfirmationModal } from './components/ui/Feedback';

const AppV2 = () => {
    // --- ОСНОВНИ СЪСТОЯНИЯ (States) ---
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [tab, setTab] = useState(TABS.DASHBOARD);
    const [notifications, setNotifications] = useState([]);
    
    // Данни от БД
    const [reservations, setReservations] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [financialEntries, setFinancialEntries] = useState([]);
    const [tasks, setTasks] = useState([]);

    // Състояния за форми и редактиране
    const [reservationForm, setReservationForm] = useState({
        hotel: '', guestName: '', checkIn: '', checkOut: '',
        adults: 2, children: 0, roomType: '', status: 'Confirmed'
    });
    const [editingReservation, setEditingReservation] = useState(null);
    const [invoiceForm, setInvoiceForm] = useState({
        invoiceNumber: '', invoiceDate: '', clientName: '', 
        products: [{ productName: '', quantity: 1, price: 0 }]
    });

    // Състояния за Модални прозорци и Печат 
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);
    const [printData, setPrintData] = useState(null);
    const [invoicePrintData, setInvoicePrintData] = useState(null);

    // --- СИСТЕМНИ ФУНКЦИИ (Handlers) ---
    const addNotification = useCallback((message, type = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }, []);

    const handleLogout = () => signOut(auth);

    // --- FIREBASE LISTENERS ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setUserId(currentUser ? currentUser.uid : null);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!userId) return;
        
        // Listener за Резервации
        const qRes = query(collection(db, `artifacts/${appId}/users/${userId}/reservations`), orderBy('createdAt', 'desc'));
        const unsubRes = onSnapshot(qRes, (snap) => {
            setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Listener за Фактури
        const qInv = query(collection(db, `artifacts/${appId}/users/${userId}/invoices`), orderBy('invoiceDate', 'desc'));
        const unsubInv = onSnapshot(qInv, (snap) => {
            setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Listener за Финанси
        const qFin = query(collection(db, `artifacts/${appId}/users/${userId}/financials`), orderBy('createdAt', 'desc'));
        const unsubFin = onSnapshot(qFin, (snap) => {
            setFinancialEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubRes(); unsubInv(); unsubFin(); };
    }, [userId]);

    // --- ОБРАБОТКА НА РЕЗЕРВАЦИИ ---
    const handleReservationSubmit = async (e) => {
        e.preventDefault();
        try {
            const colRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
            if (editingReservation) {
                await setDoc(doc(db, `artifacts/${appId}/users/${userId}/reservations`, editingReservation.id), {
                    ...reservationForm, updatedAt: new Date().toISOString()
                });
                addNotification('Резервацията е обновена!');
                setEditingReservation(null);
            } else {
                await addDoc(colRef, { ...reservationForm, createdAt: new Date().toISOString() });
                addNotification('Успешно добавена резервация!');
            }
            setReservationForm({ hotel: '', guestName: '', checkIn: '', checkOut: '', adults: 2, children: 0, roomType: '', status: 'Confirmed' });
        } catch (err) {
            addNotification('Грешка при запис: ' + err.message, 'error');
        }
    };

    const handleDeleteReservation = (id) => {
        setConfirmMessage('Наистина ли искате да изтриете тази резервация?');
        setConfirmAction(() => async () => {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/reservations`, id));
            addNotification('Резервацията е изтрита');
        });
        setShowConfirmModal(true);
    };

    // --- РУТИРАНЕ (Render Logic)  ---
    const renderContent = () => {
        const commonProps = { userId, db, addNotification, setTab };

        switch (tab) {
            case TABS.DASHBOARD:
                return <Dashboard reservations={reservations} financialEntries={financialEntries} tasks={tasks} {...commonProps} />;
            case TABS.RESERVATIONS:
                return (
                    <ReservationsPage 
                        reservations={reservations}
                        reservationForm={reservationForm}
                        editingReservation={editingReservation}
                        setReservationForm={setReservationForm}
                        setEditingReservation={setEditingReservation}
                        handleReservationSubmit={handleReservationSubmit}
                        handleDeleteReservation={handleDeleteReservation}
                        setPrintData={setPrintData}
                        {...commonProps}
                    />
                );
            case TABS.INVOICES:
                return <InvoicesPage invoices={invoices} invoiceForm={invoiceForm} setInvoicePrintData={setInvoicePrintData} {...commonProps} />;
            case TABS.FINANCIALS:
                return <FinancialsPage financialEntries={financialEntries} {...commonProps} />;
            case TABS.DOCUMENTS:
                return <DocumentsPage reservations={reservations} setPrintData={setPrintData} {...commonProps} />;
            case TABS.TASKS:
                return <TaskManagementModule isAuthReady={!!user} {...commonProps} />;
            case TABS.MARKETING:
                return <MarketingHubModule isAuthReady={!!user} {...commonProps} />;
            
            // Компоненти за печат
            case 'VoucherPrint':
                return <VoucherPrint reservationData={printData} onBack={() => setTab(TABS.RESERVATIONS)} />;
            case 'InvoicePrint':
                return <InvoicePrint invoiceData={invoicePrintData} onBack={() => setTab(TABS.INVOICES)} />;
            case 'CustomerContractPrint':
                return <CustomerContractPrint reservationData={printData} onBack={() => setTab(TABS.DOCUMENTS)} />;
            default:
                return <Dashboard />;
        }
    };

    if (!user) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="p-8 bg-white shadow-xl rounded-2xl text-center">
                <img src="../Logo.png" alt="Logo" className="h-16 mx-auto mb-4" />
                <p className="text-gray-600">Моля, влезте в профила си, за да продължите.</p>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <NotificationDisplay notifications={notifications} onDismiss={(id) => setNotifications(n => n.filter(x => x.id !== id))} />
            
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-2xl flex flex-col z-20">
                <div className="p-6 border-b flex flex-col items-center">
                    <img src="../Logo.png" alt="Logo" className="h-12 mb-2" />
                    <span className="text-[10px] text-gray-400 font-mono">v2.0 Refactored</span>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {Object.values(TABS).map((t) => (
                        <button 
                            key={t}
                            onClick={() => setTab(t)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                                tab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-blue-50'
                            }`}
                        >
                            <span className="font-medium">{t}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t bg-gray-50">
                    <div className="text-xs text-gray-500 mb-3 truncate px-2">{user?.email}</div>
                    <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 p-3 rounded-xl hover:bg-red-100 transition font-bold">Изход</button>
                </div>
            </aside>

            {/* Main Area */}
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
