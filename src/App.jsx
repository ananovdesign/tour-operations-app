import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Home, PlusCircle, Eye, DollarSign, TrendingUp, FileText, ArrowLeftRight, Hotel, Users, ChevronsRight, ChevronsLeft, Edit, Briefcase, ChevronDown, ChevronUp, Crown, Bus, CalendarCheck, UserPlus, Shield, CheckCircle, XCircle, UserRound, Banknote, Users2 } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// NOTE: For PDF generation, we use jspdf and jspdf-autotable via CDN in the HTML file.

// --- HELPER FUNCTIONS ---
const getMonthYear = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
};

// --- REUSABLE UI COMPONENTS ---
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


// --- CORE FEATURE COMPONENTS ---

const Dashboard = ({ reservations, payments, expenses, tours, insurances }) => {
    const totalReservations = reservations.length;
    const confirmedAndPastReservations = reservations.filter(r => r.status === 'Confirmed' || r.status === 'Past');
    const totalProfit = confirmedAndPastReservations.reduce((sum, res) => sum + (res.profit || 0), 0);
    const avgProfitPerReservation = confirmedAndPastReservations.length > 0 ? (totalProfit / confirmedAndPastReservations.length).toFixed(2) : 0;
    
    const totalTravelIncome = payments.filter(p => p.reservationId).reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalTravelExpenses = expenses.filter(e => e.reservationId).reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalTravelProfit = totalTravelIncome - totalTravelExpenses;

    const totalBusTourMaxCapacity = tours.reduce((sum, tour) => sum + (tour.maxPassengers || 0), 0);
    const totalBusTourBookedPassengers = reservations
        .filter(res => res.busTourId)
        .reduce((sum, res) => sum + (res.tourists.reduce((tSum, t) => tSum + (t.numberOfTourists || 1), 0)), 0);
    const overallBusTourFulfillment = totalBusTourMaxCapacity > 0
        ? ((totalBusTourBookedPassengers / totalBusTourMaxCapacity) * 100).toFixed(1)
        : '0.0';

    const totalInsuranceCommission = insurances.reduce((sum, ins) => sum + (ins.commission || 0), 0);
    const totalInsuranceExpenses = expenses.filter(e => e.insuranceId).reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalInsuranceProfit = totalInsuranceCommission - totalInsuranceExpenses;

    const overallTotalIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const overallTotalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const overallNetProfit = overallTotalIncome - overallTotalExpenses;
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Reservations" value={totalReservations} icon={<Users className="h-6 w-6 text-white"/>} color="bg-blue-500" />
                <StatCard title="Reservations Profit" value={`€${totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<TrendingUp className="h-6 w-6 text-white"/>} color="bg-green-500" />
                <StatCard title="Avg. Profit / Res." value={`€${avgProfitPerReservation}`} icon={<DollarSign className="h-6 w-6 text-white"/>} color="bg-yellow-500" />
                <StatCard title="Insurance Profit" value={`€${totalInsuranceProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<Shield className="h-6 w-6 text-white"/>} color="bg-teal-500" />
                <StatCard title="Travel Net" value={`€${totalTravelProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<Bus className="h-6 w-6 text-white"/>} color="bg-purple-500" />
                <StatCard title="Bus Fulfillment" value={`${overallBusTourFulfillment}%`} icon={<Users2 className="h-6 w-6 text-white"/>} color="bg-sky-600" />
                <StatCard title="Total Income" value={`€${overallTotalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ChevronsRight className="h-6 w-6 text-white"/>} color="bg-emerald-600" />
                <StatCard title="Total Net" value={`€${overallNetProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<Banknote className="h-6 w-6 text-white"/>} color={overallNetProfit >= 0 ? "bg-green-700" : "bg-red-700"} />
            </div>
            {/* Charts and other visual elements would go here */}
        </div>
    );
};

// ... All other components (CreateReservation, ViewReservations, AddPayment, etc.) would be here.
// For brevity, I will only show the main App component logic that has changed.
// You should paste your entire component code from the last file you sent.
// The important changes are in the App component below.

const App = () => {
    // === STATE MANAGEMENT ===
    // Data states are now empty arrays, waiting for Firebase
    const [reservations, setReservations] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [tours, setTours] = useState([]);
    const [insurances, setInsurances] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Start in loading state

    // UI State
    const [activePage, setActivePage] = useState('Dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);
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
                // Fetch all collections simultaneously
                const [reservationsSnap, paymentsSnap, expensesSnap, toursSnap, insurancesSnap, customersSnap] = await Promise.all([
                    getDocs(collection(db, 'reservations')),
                    getDocs(collection(db, 'payments')),
                    getDocs(collection(db, 'expenses')),
                    getDocs(collection(db, 'tours')),
                    getDocs(collection(db, 'insurances')),
                    getDocs(collection(db, 'customers')),
                ]);

                // Process and set state for each collection
                setReservations(reservationsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setPayments(paymentsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a, b) => new Date(b.date) - new Date(a.date)));
                setExpenses(expensesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a, b) => new Date(b.date) - new Date(a.date)));
                setTours(toursSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setInsurances(insurancesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setCustomers(customersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));

            } catch (error) {
                console.error("Error fetching data from Firebase:", error);
                // Handle error state in UI if necessary
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // === DATA WRITING (CRUD FUNCTIONS) ===
    const addData = async (collectionName, data) => {
        try {
            const docRef = await addDoc(collection(db, collectionName), data);
            console.log(`${collectionName} added with ID: `, docRef.id);
            // Re-fetch data to update UI instantly (simple approach)
            // A more advanced approach would be to just add the new item to the local state
            const updatedSnapshot = await getDocs(collection(db, collectionName));
            const updatedList = updatedSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));

            // Update the correct state based on collection name
            if(collectionName === 'reservations') setReservations(updatedList);
            if(collectionName === 'tours') setTours(updatedList);
            if(collectionName === 'insurances') setInsurances(updatedList);
            if(collectionName === 'payments') setPayments(updatedList.sort((a, b) => new Date(b.date) - new Date(a.date)));
            if(collectionName === 'expenses') setExpenses(updatedList.sort((a, b) => new Date(b.date) - new Date(a.date)));

        } catch (error) {
            console.error(`Error adding ${collectionName}: `, error);
        }
    };
    
    const updateData = async (collectionName, id, data) => {
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, data);
            console.log(`${collectionName} with ID ${id} updated.`);
            // Re-fetch data to update UI
            const updatedSnapshot = await getDocs(collection(db, collectionName));
            const updatedList = updatedSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));

            if(collectionName === 'reservations') setReservations(updatedList);
            if(collectionName === 'tours') setTours(updatedList);
            if(collectionName === 'insurances') setInsurances(updatedList);
            
        } catch (error) {
            console.error(`Error updating ${collectionName}: `, error);
        }
    };

    const deleteData = async (collectionName, id) => {
        if (window.confirm(`Are you sure you want to delete this item from ${collectionName}?`)) {
            try {
                await deleteDoc(doc(db, collectionName, id));
                console.log(`${collectionName} with ID ${id} deleted.`);
                 // Re-fetch data to update UI
                const updatedSnapshot = await getDocs(collection(db, collectionName));
                const updatedList = updatedSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
                
                if(collectionName === 'reservations') setReservations(updatedList);
                // Add other collections if delete functionality is needed for them
                
            } catch (error) {
                console.error(`Error deleting ${collectionName}: `, error);
            }
        }
    };

    // --- RENDER LOGIC ---
    // (This part includes your NavItem, NavSection, renderPage, and the main return statement)
    // It remains largely the same as the code you sent, just ensure the function calls match the new firebase functions
    
    const renderPage = () => {
        if (isLoading) {
            return <div className="p-8 text-center"><h1>Loading Data from Database...</h1></div>;
        }
        // Example: Pass the firebase functions to the components that need them
        switch (activePage) {
            case 'Dashboard': 
                return <Dashboard reservations={reservations} payments={payments} expenses={expenses} tours={tours} insurances={insurances} />;
            case 'Create Reservation': 
                return <CreateReservation onAddReservation={(data) => addData('reservations', data)} expenses={expenses} />;
            case 'View Reservations': 
                return <ViewReservations 
                            reservations={reservations} 
                            onEdit={setEditingReservation} 
                            onDelete={(id) => deleteData('reservations', id)} 
                        />;
            case 'Add Payment': 
                return <AddPayment onAddPayment={(data) => addData('payments', data)} payments={payments} reservations={reservations} insurances={insurances} />;
            case 'Add Expense': 
                return <AddExpense onAddExpense={(data) => addData('expenses', data)} expenses={expenses} reservations={reservations} insurances={insurances} />;
            case 'Create Tour': 
                return <CreateTour onAddTour={(data) => addData('tours', data)} tours={tours} />;
            case 'View Tours':
                return <ViewTours tours={tours} reservations={reservations} onEditTour={setEditingTour} />;
            case 'Add Insurance': 
                return <AddInsurance onAddInsurance={(data) => addData('insurances', data)} insurances={insurances} />;
            case 'View Insurance':
                return <ViewInsurance insurances={insurances} />;
            case 'View All Customers':
                return <Customers customers={customers} reservations={reservations} insurances={insurances} onViewCustomer={setViewingCustomer} />;
            // Add other cases as needed...
            default:
                return <Dashboard reservations={reservations} payments={payments} expenses={expenses} tours={tours} insurances={insurances} />;
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
            {isOpen && (
                <ul className="ml-4 border-l border-blue-700 pl-2">
                    {children}
                </ul>
            )}
        </>
    );

    // Main JSX Return
    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <aside className={`fixed lg:relative lg:translate-x-0 inset-y-0 left-0 w-64 bg-blue-900 shadow-xl z-20 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
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
                        </NavSection>
                        <NavSection title="Insurance Management" icon={<Shield />} isOpen={isInsuranceManagementOpen} toggleOpen={() => setIsInsuranceManagementOpen(!isInsuranceManagementOpen)}>
                            <NavItem icon={<PlusCircle />} label="Add Insurance" />
                            <NavItem icon={<Eye />} label="View Insurance" />
                        </NavSection>
                         <NavSection title="Customer Management" icon={<UserRound />} isOpen={isCustomerManagementOpen} toggleOpen={() => setIsCustomerManagementOpen(!isCustomerManagementOpen)}>
                             <NavItem icon={<Users />} label="View All Customers" />
                         </NavSection>
                         <hr className="my-2 border-blue-700/50" />
                         <NavItem icon={<DollarSign />} label="Add Payment" />
                         <NavItem icon={<ArrowLeftRight />} label="Add Expense" />
                    </ul>
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto">
                {renderPage()}
            </main>

            {/* Modals */}
            {editingReservation && <EditReservationModal isOpen={!!editingReservation} onClose={() => setEditingReservation(null)} reservation={editingReservation} onUpdate={(data) => updateData('reservations', editingReservation.id, data)} />}
            {editingTour && <EditTourModal isOpen={!!editingTour} onClose={() => setEditingTour(null)} tour={editingTour} onUpdate={(data) => updateData('tours', editingTour.id, data)} />}
            {viewingCustomer && <CustomerDetailModal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} customer={viewingCustomer} reservations={reservations} insurances={insurances} />}
        </div>
    );
};

export default App;

