import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, db, appId, onAuthStateChanged, signOut 
} from './services/firebase'; // Използваме новия път към услугите 
import { 
  collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, orderBy 
} from 'firebase/firestore';

// Импорт на новите страници
import Dashboard from './pages/Dashboard';
import ReservationsPage from './pages/Reservations';
import InvoicesPage from './pages/Invoices';
import FinancialsPage from './pages/Financials';
import DocumentsPage from './pages/Documents';

// Импорт на съществуващите модули и принтиращи компоненти
import MarketingHubModule from '../MarketingHubModule';
import TaskManagementModule from '../TaskManagementModule';
import InvoicePrint from '../InvoicePrint';
import VoucherPrint from '../VoucherPrint';
import CustomerContractPrint from '../CustomerContractPrint';
import BusTourContractPrint from '../BusTourContractPrint';

// Импорт на Константи
import { TABS } from './constants/appConstants';

const AppV2 = () => {
    // --- State Management (Запазено от оригиналния App.jsx) ---
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [tab, setTab] = useState(TABS.DASHBOARD);
    const [reservations, setReservations] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [financialEntries, setFinancialEntries] = useState([]);
    const [tasks, setTasks] = useState([]);
    
    // Форми и помощни състояния
    const [reservationForm, setReservationForm] = useState({
        hotel: '', guestName: '', checkIn: '', checkOut: '',
        adults: 2, children: 0, roomType: '', status: 'Confirmed'
    });
    const [invoiceForm, setInvoiceForm] = useState({
        invoiceNumber: '', invoiceDate: '', clientName: '', products: [{ productName: '', quantity: 1, price: 0 }]
    });
    const [printData, setPrintData] = useState(null);
    const [invoicePrintData, setInvoicePrintData] = useState(null);

    // --- Firebase Auth Listener  ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setUserId(currentUser ? currentUser.uid : null);
        });
        return () => unsubscribe();
    }, []);

    // --- Data Listeners (Пример за Резервации) ---
    useEffect(() => {
        if (!userId) return;
        const q = query(collection(db, `artifacts/${appId}/users/${userId}/reservations`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [userId]);

    // Аналогични Listeners за Invoices и Financials се добавят тук...

    // --- Handlers (Логика за обработка на данни) ---
    const handleLogout = () => signOut(auth);

    const handleReservationSubmit = async (e) => {
        e.preventDefault();
        const colRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
        await addDoc(colRef, { ...reservationForm, createdAt: new Date().toISOString() });
        setReservationForm({ hotel: '', guestName: '', checkIn: '', checkOut: '', adults: 2, children: 0, roomType: '', status: 'Confirmed' });
    };

    // --- Main Content Router ---
    const renderContent = () => {
        switch (tab) {
            case TABS.DASHBOARD:
                return <Dashboard reservations={reservations} financialEntries={financialEntries} tasks={tasks} setTab={setTab} />;
            case TABS.RESERVATIONS:
                return (
                    <ReservationsPage 
                        reservations={reservations} 
                        reservationForm={reservationForm}
                        setReservationForm={setReservationForm}
                        handleReservationSubmit={handleReservationSubmit}
                        setTab={setTab}
                        setPrintData={setPrintData}
                    />
                );
            case TABS.INVOICES:
                return (
                    <InvoicesPage 
                        invoices={invoices} 
                        invoiceForm={invoiceForm}
                        setInvoicePrintData={setInvoicePrintData}
                        setTab={setTab}
                    />
                );
            case TABS.FINANCIALS:
                return <FinancialsPage financialEntries={financialEntries} />;
            case TABS.DOCUMENTS:
                return <DocumentsPage reservations={reservations} setTab={setTab} setPrintData={setPrintData} />;
            case TABS.TASKS:
                return <TaskManagementModule db={db} userId={userId} isAuthReady={!!user} />;
            case TABS.MARKETING:
                return <MarketingHubModule db={db} userId={userId} isAuthReady={!!user} />;
            
            // Специфични изгледи за печат
            case 'VoucherPrint':
                return <VoucherPrint reservationData={printData} onBack={() => setTab(TABS.RESERVATIONS)} />;
            case 'InvoicePrint':
                return <InvoicePrint invoiceData={invoicePrintData} onBack={() => setTab(TABS.INVOICES)} />;
            default:
                return <Dashboard />;
        }
    };

    if (!user) return <div className="p-10 text-center">Моля, влезте в системата...</div>;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar (Можеш да го изнесеш в src/v2/components/Sidebar.jsx) */}
            <aside className="w-64 bg-white shadow-xl flex flex-col">
                <div className="p-6 border-b flex justify-center">
                    <img src="../Logo.png" alt="Logo" className="h-12" />
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {Object.values(TABS).map((t) => (
                        <button 
                            key={t}
                            onClick={() => setTab(t)}
                            className={`w-full text-left p-3 rounded-lg transition ${tab === t ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50'}`}
                        >
                            {t}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t">
                    <button onClick={handleLogout} className="w-full text-red-600 p-2 hover:bg-red-50 rounded-lg">Изход</button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 overflow-y-auto p-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default AppV2;
