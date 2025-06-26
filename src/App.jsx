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
    const overallTotalIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const overallTotalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const overallNetProfit = overallTotalIncome - overallTotalExpenses;

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
                <StatCard title="Bank Balance" value={`€${(payments.filter(p=>p.method==='BANK').reduce((a,c)=>a+c.amount,0) - expenses.filter(e=>e.method==='BANK').reduce((a,c)=>a+c.amount,0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<Banknote className="h-6 w-6 text-white"/>} color={"bg-emerald-600"} />
                <StatCard title="Cash Balance" value={`€${(payments.filter(p=>p.method==='CASH').reduce((a,c)=>a+c.amount,0) - expenses.filter(e=>e.method==='CASH').reduce((a,c)=>a+c.amount,0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<DollarSign className="h-6 w-6 text-white"/>} color={"bg-amber-600"} />
                <StatCard title="Overall Net" value={`€${overallNetProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<TrendingUp className="h-6 w-6 text-white"/>} color={overallNetProfit >= 0 ? "bg-green-700" : "bg-red-700"} />
            </div>
        </div>
    );
};

const CreateReservation = ({ onAddReservation, expenses }) => {
    const [reservation, setReservation] = useState({
        id: '', creationDate: new Date().toISOString().split('T')[0], tourName: '', tourType: 'BUS', checkIn: '', checkOut: '', adults: 1, children: 0,
        tourists: [{ name: '', fatherName: '', familyName: '', id: '', address: '', city: '', postCode: '', mail: '', phone: '' , numberOfTourists: 1}],
        depositPaid: 'NO', depositAmount: 0, finalPaymentPaid: 'NO', finalPaymentAmount: 0, owedToHotel: 0, profit: 0, tourOperator: '', status: 'Pending', busTourId: '', customerId: '',
        hotelAccommodation: '', foodIncluded: 'NO', place: '', transport: '',
    });
    const [totalNights, setTotalNights] = useState(0);
    useEffect(() => {
        if (reservation.checkIn && reservation.checkOut) {
            const start = new Date(reservation.checkIn);
            const end = new Date(reservation.checkOut);
            if (end > start) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setTotalNights(diffDays);
            } else {
                setTotalNights(0);
            }
        }
    }, [reservation.checkIn, reservation.checkOut]);

    useEffect(() => {
        const finalAmount = parseFloat(reservation.finalPaymentAmount) || 0;
        const owedToHotel = parseFloat(reservation.owedToHotel) || 0;
        const calculatedProfit = finalAmount - owedToHotel;
        setReservation(prev => ({ ...prev, profit: calculatedProfit }));
    }, [reservation.finalPaymentAmount, reservation.owedToHotel]);

    const handleTouristChange = (index, e) => {
        const { name, value } = e.target;
        const updatedTourists = [...reservation.tourists];
        updatedTourists[index][name] = (name === 'numberOfTourists') ? parseInt(value) || 0 : value;
        setReservation(prev => ({ ...prev, tourists: updatedTourists }));
    };
    const addTourist = () => {
        setReservation(prev => ({ ...prev, tourists: [...prev.tourists, { name: '', fatherName: '', familyName: '', id: '', address: '', city: '', postCode: '', mail: '', phone: '', numberOfTourists: 1 }] }));
    };
    const removeTourist = (index) => {
        const updatedTourists = reservation.tourists.filter((_, i) => i !== index);
        setReservation(prev => ({ ...prev, tourists: updatedTourists }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onAddReservation(reservation);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Create Reservation</h1>
            <ReservationForm
                reservationData={reservation} onReservationDataChange={setReservation} onSubmit={handleSubmit} totalNights={totalNights}
                onAddTourist={addTourist} onRemoveTourist={removeTourist} onTouristChange={handleTouristChange} buttonText="Create Reservation"
            />
        </div>
    );
};

const ViewReservations = ({ reservations, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredReservations, setFilteredReservations] = useState(reservations);
    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = reservations.filter(item => {
            return Object.keys(item).some(key => {
                if (typeof item[key] === 'string') return item[key].toLowerCase().includes(lowercasedFilter);
                if (key === 'tourists' && Array.isArray(item[key])) {
                    return item[key].some(t =>
                        (t.name && t.name.toLowerCase().includes(lowercasedFilter)) ||
                        (t.familyName && t.familyName.toLowerCase().includes(lowercasedFilter))
                    );
                }
                return false;
            });
        });
        setFilteredReservations(filteredData);
    }, [searchTerm, reservations]);

    const exportToCsv = () => {
        const headers = ["ID", "Creation Date", "Tour Name", "Check-in", "Check-out", "Status", "Profit", "Lead Guest Name", "Lead Guest Family Name"];
        const rows = filteredReservations.map(res => [
            res.id, res.creationDate, res.tourName, res.checkIn, res.checkOut, res.status, res.profit,
            res.tourists[0]?.name || '', res.tourists[0]?.familyName || ''
        ].map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reservations.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">View Reservations</h1>
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <input type="text" placeholder="Search reservations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm" />
                <div className="flex gap-2">
                    <button onClick={exportToCsv} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-md">Export CSV</button>
                    <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 shadow-md" disabled>Import CSV</button>
                </div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-md overflow-x-auto border border-gray-200">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Res. #</th>
                            <th className="px-6 py-3">Tour</th>
                            <th className="px-6 py-3">Lead Guest</th>
                            <th className="px-6 py-3">Dates</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Profit</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReservations.length > 0 ? (
                            filteredReservations.map(res => (
                                <tr key={res.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{res.id}</td>
                                    <td className="px-6 py-4">{res.tourName}</td>
                                    <td className="px-6 py-4">{res.tourists[0]?.name || 'N/A'} {res.tourists[0]?.familyName}</td>
                                    <td className="px-6 py-4">{res.checkIn} to {res.checkOut}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${res.status === 'Confirmed' ? 'bg-green-100 text-green-800' : res.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : res.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{res.status}</span>
                                    </td>
                                    <td className="px-6 py-4">€{res.profit ? res.profit.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}</td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => onEdit(res)} className="text-blue-600 hover:text-blue-800 font-medium p-1 rounded-md hover:bg-blue-100 transition-colors" title="Edit Reservation"><Edit size={18} /></button>
                                        <button onClick={() => onDelete(res.id)} className="text-red-600 hover:text-red-800 font-medium p-1 rounded-md hover:bg-red-100 transition-colors" title="Delete Reservation">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">No reservations found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AddPayment = ({ onAddPayment, payments, reservations, insurances, prefillReservationId = '' }) => {
    const [payment, setPayment] = useState({ date: new Date().toISOString().split('T')[0], method: 'BANK', amount: '', reason: '', reservationId: prefillReservationId, insuranceId: '', vat: 24 });
    useEffect(() => { setPayment(prev => ({ ...prev, reservationId: prefillReservationId })); }, [prefillReservationId]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayment(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onAddPayment({ ...payment, amount: parseFloat(payment.amount), vat: parseFloat(payment.vat) });
        setPayment({ date: new Date().toISOString().split('T')[0], method: 'BANK', amount: '', reason: '', reservationId: '', insuranceId: '', vat: 24 });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            {/* ... AddPayment Form JSX ... */}
        </div>
    );
};

// ... ALL OTHER COMPONENTS (AddExpense, FinancialReports, CreateVouchers, EditReservationModal, CreateTour, ViewTours, etc.) MUST be included here in their entirety ...

const App = () => {
    const [reservations, setReservations] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [tours, setTours] = useState([]);
    const [insurances, setInsurances] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activePage, setActivePage] = useState('Dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);
    const [editingTour, setEditingTour] = useState(null);
    const [viewingCustomer, setViewingCustomer] = useState(null);
    const [editingInsurance, setEditingInsurance] = useState(null);
    const [prefillReservationIdForPayment, setPrefillReservationIdForPayment] = useState('');
    const [prefillReservationIdForExpense, setPrefillReservationIdForExpense] = useState('');
    const [isTravelManagementOpen, setIsTravelManagementOpen] = useState(true);
    const [isInsuranceManagementOpen, setIsInsuranceManagementOpen] = useState(false);
    const [isCustomerManagementOpen, setIsCustomerManagementOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const collections = ['reservations', 'payments', 'expenses', 'tours', 'insurances', 'customers'];
                const promises = collections.map(name => getDocs(collection(db, name)));
                const [reservationsSnap, paymentsSnap, expensesSnap, toursSnap, insurancesSnap, customersSnap] = await Promise.all(promises);
                
                setReservations(reservationsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setPayments(paymentsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a, b) => new Date(b.date) - new Date(a.date)));
                setExpenses(expensesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a, b) => new Date(b.date) - new Date(a.date)));
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
            const { id, ...dataToSend } = data; // Don't save a client-side ID to Firebase
            await addDoc(collection(db, collectionName), dataToSend);
            await fetchDataByCollection(collectionName);
            if (successPage) setActivePage(successPage);
        } catch (error) { console.error(`Error adding to ${collectionName}:`, error); }
    };

    const updateData = async (collectionName, id, data) => {
        try {
            const { id: docId, ...dataToSend } = data; // Don't save the id field inside the document
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

    const handleAddPaymentForTour = (tourId) => { setPrefillReservationIdForPayment(tourId); setActivePage('Add Payment'); };
    const handleAddExpenseForTour = (tourId) => { setPrefillReservationIdForExpense(tourId); setActivePage('Add Expense'); };

    const renderPage = () => {
        if (isLoading) {
            return <div className="p-8 text-center text-2xl font-semibold text-gray-500">Loading Data from Database...</div>;
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
            case 'View Insurance': return <ViewInsurance insurances={insurances} onEdit={setEditingInsurance} onAddPayment={() => setActivePage('Add Payment')} onAddExpense={() => setActivePage('Add Expense')} />;
            case 'Insurance Financial Reports': return <InsuranceFinancialReports insurances={insurances} payments={payments} expenses={expenses} />;
            case 'View All Customers': return <Customers customers={customers} reservations={reservations} insurances={insurances} onEditCustomer={(c) => console.log('Edit', c)} onViewCustomer={setViewingCustomer} />;
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
