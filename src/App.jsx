import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Home, PlusCircle, Eye, DollarSign, TrendingUp, FileText, ArrowLeftRight, Hotel, Users, ChevronsRight, ChevronsLeft, Edit, Briefcase, ChevronDown, ChevronUp, Crown, Bus, CalendarCheck, UserPlus, FileSignature, Receipt, Package, Truck, Bed, Users2, Shield, Calendar, CreditCard, Tag, User, Car, CheckCircle, XCircle, Search, UserRound, Banknote } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';


// NOTE: For PDF generation, jsPDF is assumed to be loaded via CDN in index.html

// Helper function to format month and year from a date string
const getMonthYear = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
};

// Reusable component for displaying statistical cards
const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center border border-gray-200">
        <div className={`p-3 rounded-full mr-4 ${color}`}>{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input {...props} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100" />
    </div>
);

const SelectField = ({ label, options, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <select {...props} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm">
            {options.map(opt => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
        </select>
    </div>
);

// Dashboard component displays various analytics and summaries
const Dashboard = ({ reservations, payments, expenses, tours, insurances }) => {
    const totalReservations = reservations.length;
    const confirmedAndPastReservations = reservations.filter(r => r.status === 'Confirmed' || r.status === 'Past');
    const totalProfit = confirmedAndPastReservations.reduce((sum, res) => sum + (res.profit || 0), 0);
    const avgProfitPerReservation = confirmedAndPastReservations.length > 0 ? (totalProfit / confirmedAndPastReservations.length).toFixed(2) : "0.00";
    const totalTravelIncome = payments.filter(p => p.reservationId).reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalTravelExpenses = expenses.filter(e => e.reservationId).reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalTravelProfit = totalTravelIncome - totalTravelExpenses;
    const totalBusTourMaxCapacity = tours.reduce((sum, tour) => sum + (tour.maxPassengers || 0), 0);
    const totalBusTourBookedPassengers = reservations
        .filter(res => res.busTourId)
        .reduce((sum, res) => sum + (res.tourists ? res.tourists.reduce((tSum, t) => tSum + (t.numberOfTourists || 1), 0) : 0), 0);
    const overallBusTourFulfillment = totalBusTourMaxCapacity > 0 ? ((totalBusTourBookedPassengers / totalBusTourMaxCapacity) * 100).toFixed(1) : '0.0';
    const totalInsuranceCommission = insurances.reduce((sum, ins) => sum + (ins.commission || 0), 0);
    const totalInsuranceExpenses = expenses.filter(e => e.insuranceId).reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalInsuranceProfit = totalInsuranceCommission - totalInsuranceExpenses;
    const avgProfitPerInsurance = insurances.length > 0 ? (totalInsuranceProfit / insurances.length).toFixed(2) : "0.00";
    const overallTotalIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const overallTotalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const overallNetProfit = overallTotalIncome - overallTotalExpenses;
    const totalBankBalance = payments.filter(p => p.method === 'BANK').reduce((a, c) => a + c.amount, 0) - expenses.filter(e => e.method === 'BANK').reduce((a, c) => a + c.amount, 0);
    const totalCashBalance = payments.filter(p => p.method === 'CASH').reduce((a, c) => a + c.amount, 0) - expenses.filter(e => e.method === 'CASH').reduce((a, c) => a + c.amount, 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Travel Management Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Reservations" value={totalReservations} icon={<Users className="h-6 w-6 text-white"/>} color="bg-blue-500" />
                <StatCard title="Total Travel Profit" value={`€${totalTravelProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<TrendingUp className="h-6 w-6 text-white"/>} color="bg-green-500" />
                <StatCard title="Bus Tour Fulfillment" value={`${overallBusTourFulfillment}%`} icon={<Bus className="h-6 w-6 text-white"/>} color="bg-blue-600" />
                <StatCard title="Total Bus Passengers" value={totalBusTourBookedPassengers} icon={<Users2 className="h-6 w-6 text-white"/>} color="bg-sky-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Insurance Management Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Insurance Commissions" value={`€${totalInsuranceCommission.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<CreditCard className="h-6 w-6 text-white"/>} color="bg-teal-500" />
                <StatCard title="Insurance Expenses" value={`€${totalInsuranceExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ArrowLeftRight className="h-6 w-6 text-white"/>} color="bg-rose-500" />
                <StatCard title="Insurance Net Profit" value={`€${totalInsuranceProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<DollarSign className="h-6 w-6 text-white"/>} color={totalInsuranceProfit >= 0 ? "bg-green-500" : "bg-orange-500"} />
                <StatCard title="Avg. Profit / Policy" value={`€${avgProfitPerInsurance}`} icon={<Tag className="h-6 w-6 text-white"/>} color="bg-indigo-500" />
            </div>
             <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Combined Cash Flow (Actual Payments)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Bank Balance" value={`€${totalBankBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<Banknote className="h-6 w-6 text-white"/>} color={"bg-emerald-600"} />
                <StatCard title="Cash Balance" value={`€${totalCashBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<DollarSign className="h-6 w-6 text-white"/>} color={"bg-amber-600"} />
                <StatCard title="Overall Net" value={`€${overallNetProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<TrendingUp className="h-6 w-6 text-white"/>} color={overallNetProfit >= 0 ? "bg-green-700" : "bg-red-700"} />
            </div>
        </div>
    );
};

const CreateReservation = ({ onAddReservation, expenses }) => {
    // ... This component's code ...
    return <div>...</div>
};
const ViewReservations = ({ reservations, onEdit, onDelete }) => {
    // ... This component's code ...
    return <div>...</div>
};
const AddPayment = ({ onAddPayment, payments, reservations, insurances, prefillReservationId = '' }) => {
    // ... This component's code ...
    return <div>...</div>
};
const AddExpense = ({ onAddExpense, expenses, reservations, insurances, prefillReservationId = '' }) => {
    // ... This component's code ...
    return <div>...</div>
};
const FinancialReports = ({ payments, expenses }) => {
    // ... This component's code ...
    return <div>...</div>
};
const CreateVouchers = () => (
    <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800">Create Vouchers (Coming Soon)</h1>
    </div>
);
const ReservationForm = ({ reservationData, onReservationDataChange, onSubmit, totalNights, onAddTourist, onRemoveTourist, onTouristChange, buttonText }) => {
    // ... This component's code ...
    return <form>...</form>
};
const EditReservationModal = ({ isOpen, onClose, reservation, onUpdate }) => {
    // ... This component's code ...
    return <div>...</div>
};
const CreateTour = ({ onAddTour, tours }) => {
    // ... This component's code ...
    return <div>...</div>
};
const ViewTours = ({ tours, reservations, onAddPaymentForTour, onAddExpenseForTour, onEditTour }) => {
    // ... This component's code ...
    return <div>...</div>
};
const AddReservationToTour = ({ onAddReservation, tours }) => {
    // ... This component's code ...
    return <div>...</div>
};
const AddInsurance = ({ onAddInsurance, insurances }) => {
    // ... This component's code ...
    return <div>...</div>
};
const ViewInsurance = ({ insurances, onEdit, onAddPayment, onAddExpense }) => {
    // ... This component's code ...
    return <div>...</div>
};
const InsuranceFinancialReports = ({ insurances, payments, expenses }) => {
    // ... This component's code ...
    return <div>...</div>
};
const Customers = ({ customers, reservations, insurances, onEditCustomer, onViewCustomer }) => {
    // ... This component's code ...
    return <div>...</div>
};
const CustomerDetailModal = ({ isOpen, onClose, customer, reservations, insurances }) => {
    // ... This component's code ...
    return <div>...</div>
};
const EditTourModal = ({ isOpen, onClose, tour, onUpdate }) => {
    // ... This component's code ...
    return <div>...</div>
};

const App = () => {
    // === STATE MANAGEMENT ===
    const [reservations, setReservations] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [tours, setTours] = useState([]);
    const [insurances, setInsurances] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- UI STATE ---
    const [activePage, setActivePage] = useState('Dashboard');
    const [prefillReservationIdForPayment, setPrefillReservationIdForPayment] = useState('');
    const [prefillReservationIdForExpense, setPrefillReservationIdForExpense] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);
    const [editingInsurance, setEditingInsurance] = useState(null);
    const [editingTour, setEditingTour] = useState(null);
    const [viewingCustomer, setViewingCustomer] = useState(null);
    const [isTravelManagementOpen, setIsTravelManagementOpen] = useState(true);
    const [isInsuranceManagementOpen, setIsInsuranceManagementOpen] = useState(false);
    const [isCustomerManagementOpen, setIsCustomerManagementOpen] = useState(false);

    // === DATA FETCHING FROM FIREBASE ===
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const collections = ['reservations', 'payments', 'expenses', 'tours', 'insurances', 'customers'];
                const promises = collections.map(name => getDocs(collection(db, name)));
                const [reservationsSnap, paymentsSnap, expensesSnap, toursSnap, insurancesSnap, customersSnap] = await Promise.all(promises);
                
                setReservations(reservationsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setPayments(paymentsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a,b) => new Date(b.date) - new Date(a.date)));
                setExpenses(expensesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a,b) => new Date(b.date) - new Date(a.date)));
                setTours(toursSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setInsurances(insurancesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setCustomers(customersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            } catch (error) {
                console.error("Error fetching data from Firebase:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // === DATA WRITING (CRUD) ===
    const fetchDataByCollection = async (collectionName) => {
        try {
            const snapshot = await getDocs(collection(db, collectionName));
            const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            switch (collectionName) {
                case 'reservations': setReservations(list); break;
                case 'tours': setTours(list); break;
                case 'insurances': setInsurances(list); break;
                case 'customers': setCustomers(list); break;
                case 'payments': setPayments(list.sort((a,b) => new Date(b.date) - new Date(a.date))); break;
                case 'expenses': setExpenses(list.sort((a,b) => new Date(b.date) - new Date(a.date))); break;
                default: break;
            }
        } catch (error) {
            console.error(`Error fetching ${collectionName}:`, error);
        }
    };

    const addData = async (collectionName, data, successPage) => {
        try {
            const { id, ...dataToSend } = data;
            await addDoc(collection(db, collectionName), dataToSend);
            await fetchDataByCollection(collectionName);
            if (successPage) setActivePage(successPage);
        } catch (error) { console.error(`Error adding to ${collectionName}:`, error); }
    };

    const updateData = async (collectionName, id, data) => {
        try {
            const { id: docId, ...dataToSend } = data;
            await updateDoc(doc(db, collectionName, id), dataToSend);
            await fetchDataByCollection(collectionName);
        } catch (error) { console.error(`Error updating ${collectionName}:`, error); }
    };
    
    const deleteData = async (collectionName, id) => {
        if (window.confirm(`Are you sure you want to delete this item from ${collectionName}? This cannot be undone.`)) {
            try {
                await deleteDoc(doc(db, collectionName, id));
                await fetchDataByCollection(collectionName);
            } catch (error) { console.error(`Error deleting from ${collectionName}:`, error); }
        }
    };

    // --- HANDLERS ---
    const handleAddPaymentForTour = (tourId) => { setPrefillReservationIdForPayment(tourId); setActivePage('Add Payment'); };
    const handleAddExpenseForTour = (tourId) => { setPrefillReservationIdForExpense(tourId); setActivePage('Add Expense'); };
    const handleAddPaymentForInsurance = (insuranceId) => { /* Logic to prefill insurance ID in payment form */ setActivePage('Add Payment'); };
    const handleAddExpenseForInsurance = (insuranceId) => { /* Logic to prefill insurance ID in expense form */ setActivePage('Add Expense'); };
    const handleEditCustomer = (customer) => { console.log("Editing customer:", customer); /* Placeholder */ };

    // --- RENDER LOGIC ---
    const renderPage = () => {
        if (isLoading) {
            return <div className="p-8 text-center text-2xl font-semibold text-gray-500">Loading Database...</div>;
        }
        switch (activePage) {
            case 'Dashboard': return <Dashboard {...{reservations, payments, expenses, tours, insurances}} />;
            case 'Create Reservation': return <CreateReservation onAddReservation={(data) => addData('reservations', data, 'View Reservations')} expenses={expenses} />;
            case 'View Reservations': return <ViewReservations reservations={reservations} onEdit={setEditingReservation} onDelete={(id) => deleteData('reservations', id)} />;
            case 'Add Payment': return <AddPayment onAddPayment={(data) => addData('payments', data)} payments={payments} reservations={reservations} insurances={insurances} prefillReservationId={prefillReservationIdForPayment} />;
            case 'Add Expense': return <AddExpense onAddExpense={(data) => addData('expenses', data)} expenses={expenses} reservations={reservations} insurances={insurances} prefillReservationId={prefillReservationIdForExpense} />;
            case 'Financial Reports': return <FinancialReports payments={payments} expenses={expenses} />;
            case 'Create Vouchers': return <CreateVouchers />;
            case 'Create Tour': return <CreateTour onAddTour={(data) => addData('tours', data, 'View Tours')} tours={tours} />;
            case 'View Tours': return <ViewTours tours={tours} reservations={reservations} onAddPaymentForTour={handleAddPaymentForTour} onAddExpenseForTour={handleAddExpenseForTour} onEditTour={setEditingTour} />;
            case 'Add Reservation to Tour': return <AddReservationToTour onAddReservation={(data) => addData('reservations', data, 'View Reservations')} tours={tours} />;
            case 'Add Insurance': return <AddInsurance onAddInsurance={(data) => addData('insurances', data, 'View Insurance')} insurances={insurances} />;
            case 'View Insurance': return <ViewInsurance insurances={insurances} onEdit={setEditingInsurance} onAddPayment={handleAddPaymentForInsurance} onAddExpense={handleAddExpenseForInsurance} />;
            case 'Insurance Financial Reports': return <InsuranceFinancialReports insurances={insurances} payments={payments} expenses={expenses} />;
            case 'View All Customers': return <Customers customers={customers} reservations={reservations} insurances={insurances} onEditCustomer={handleEditCustomer} onViewCustomer={setViewingCustomer} />;
            default: return <Dashboard {...{reservations, payments, expenses, tours, insurances}} />;
        }
    };
    
    const NavItem = ({ icon, label }) => (
        <li className={`flex items-center p-3 my-1 cursor-pointer rounded-lg transition-colors ${activePage === label ? 'bg-blue-700 text-amber-400 shadow-lg' : 'text-amber-400 hover:bg-blue-700 hover:text-white'}`}
            onClick={() => { setActivePage(label); setSidebarOpen(false); }}>
            {React.cloneElement(icon, { className: 'h-6 w-6 mr-3' })}
            <span className="font-medium">{label}</span>
        </li>
    );

    const NavSection = ({ title, icon, isOpen, toggleOpen, children }) => (
        <>
            <li className={`flex items-center justify-between p-3 my-1 cursor-pointer rounded-lg transition-colors ${isOpen ? 'bg-blue-800 text-amber-400 shadow-md' : 'text-amber-400 hover:bg-blue-700'}`}
                onClick={toggleOpen}>
                <div className="flex items-center">
                    {React.cloneElement(icon, { className: 'h-6 w-6 mr-3' })}
                    <span className="font-semibold">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </li>
            {isOpen && <ul className="ml-4 border-l border-blue-700 pl-2">{children}</ul>}
        </>
    );

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <button className="lg:hidden fixed top-4 left-4 z-30 bg-blue-900 p-2 rounded-md shadow-md text-amber-400" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? '✕' : '☰'}
            </button>
            <aside className={`fixed lg:relative lg:translate-x-0 inset-y-0 left-0 w-64 bg-blue-900 shadow-xl z-20 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
                <div className="p-4 border-b border-blue-700 flex items-center justify-center">
                    <Crown className="h-9 w-9 text-amber-400 mr-2" />
                    <h1 className="text-2xl font-extrabold text-amber-400">Ananov BMS</h1>
                </div>
                <nav className="p-4">
                    <ul>
                        <NavItem icon={<Home />} label="Dashboard" />
                        <NavSection title="Travel Management" icon={<Briefcase />} isOpen={isTravelManagementOpen} toggleOpen={() => setIsTravelManagementOpen(!isTravelManagementOpen)}>
                            <NavItem icon={<PlusCircle />} label="Create Reservation" />
                            <NavItem icon={<Eye />} label="View Reservations" />
                            <NavItem icon={<Bus />} label="Create Tour" />
                            <NavItem icon={<CalendarCheck />} label="View Tours" />
                            <NavItem icon={<UserPlus />} label="Add Reservation to Tour" />
                        </NavSection>
                        <NavSection title="Insurance Management" icon={<Shield />} isOpen={isInsuranceManagementOpen} toggleOpen={() => setIsInsuranceManagementOpen(!isInsuranceManagementOpen)}>
                            <NavItem icon={<PlusCircle />} label="Add Insurance" />
                            <NavItem icon={<Eye />} label="View Insurance" />
                            <NavItem icon={<TrendingUp />} label="Insurance Financial Reports" />
                        </NavSection>
                        <NavSection title="Customer Management" icon={<UserRound />} isOpen={isCustomerManagementOpen} toggleOpen={() => setIsCustomerManagementOpen(!isCustomerManagementOpen)}>
                            <NavItem icon={<Users />} label="View All Customers" />
                        </NavSection>
                        <hr className="my-2 border-blue-700/50" />
                        <NavItem icon={<DollarSign />} label="Add Payment" />
                        <NavItem icon={<ArrowLeftRight />} label="Add Expense" />
                        <NavItem icon={<FileText />} label="Financial Reports" />
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {renderPage()}
            </main>
            {editingReservation && <EditReservationModal isOpen={!!editingReservation} onClose={() => setEditingReservation(null)} reservation={editingReservation} onUpdate={(data) => updateData('reservations', editingReservation.id, data)} />}
            {editingTour && <EditTourModal isOpen={!!editingTour} onClose={() => setEditingTour(null)} tour={editingTour} onUpdate={(data) => updateData('tours', editingTour.id, data)} />}
            {viewingCustomer && <CustomerDetailModal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} customer={viewingCustomer} reservations={reservations} insurances={insurances} />}
        </div>
    );
};

export default App;
