import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Home, PlusCircle, Eye, DollarSign, TrendingUp, FileText, ArrowLeftRight, Hotel, Users, ChevronsRight, ChevronsLeft, Edit, Briefcase, ChevronDown, ChevronUp, Crown, Bus, CalendarCheck, UserPlus, FileSignature, Receipt, Package, Truck, Bed, Users2, Shield, Calendar, CreditCard, Tag, User, Car, CheckCircle, XCircle, Search, UserRound, Banknote } from 'lucide-react';
import { db } from './firebase'; // Import the Firebase db instance
import { ref, onValue, set, push, remove, update } from 'firebase/database';


// NOTE: For PDF generation, we use jspdf and jspdf-autotable via CDN in the HTML file.
// Helper function to format month and year from a date string
const getMonthYear = (dateString) => {
    const date = new Date(dateString);
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

// Dashboard component displays various analytics and summaries
const Dashboard = ({ reservations, payments, expenses, tours, insurances }) => {
    // --- Overall Statistics (Existing) ---
    const totalReservations = reservations.length;
    const reservationsByMonth = reservations.reduce((acc, res) => { const month = getMonthYear(res.creationDate); acc[month] = (acc[month] || 0) + 1; return acc; }, {});
    const reservationsByMonthData = Object.keys(reservationsByMonth).map(key => ({ name: key, Reservations: reservationsByMonth[key] }));
    const confirmedAndPastReservations = reservations.filter(r => r.status === 'Confirmed' || r.status === 'Past');
    const totalProfit = confirmedAndPastReservations.reduce((sum, res) => sum + (res.profit || 0), 0);
    const profitByMonth = confirmedAndPastReservations.reduce((acc, res) => { const month = getMonthYear(res.creationDate); acc[month] = (acc[month] || 0) + (res.profit || 0); return acc; }, {});
    const profitByMonthData = Object.keys(profitByMonth).map(key => ({ name: key, Profit: profitByMonth[key] }));
    const avgProfitPerReservation = confirmedAndPastReservations.length > 0 ? (totalProfit / confirmedAndPastReservations.length).toFixed(2) : 0;
    const totalNights = reservations.reduce((sum, res) => { const checkIn = new Date(res.checkIn); const checkOut = new Date(res.checkOut); if (!checkIn.getTime() || !checkOut.getTime() || checkOut <= checkIn) return sum; const diffTime = Math.abs(checkOut - checkIn); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); return sum + diffDays; }, 0);
    const avgStayPerReservation = totalReservations > 0 ? (totalNights / totalReservations).toFixed(1) : 0;
    const reservationsByStatus = reservations.reduce((acc, res) => { acc[res.status] = (acc[res.status] || 0) + 1; return acc; }, {});
    const statusData = Object.keys(reservationsByStatus).map(key => ({ name: key, value: reservationsByStatus[key] }));
    const STATUS_COLORS = { 'Confirmed': '#4caf50', 'Pending': '#ff9800', 'Cancelled': '#f44336', 'Past': '#607d8b' };
    const operatorBreakdown = reservations.reduce((acc, res) => { acc[res.tourOperator] = (acc[res.tourOperator] || 0) + 1; return acc; }, {});
    const operatorData = Object.keys(operatorBreakdown).map(key => ({ name: key, value: operatorBreakdown[key] }));
    const OPERATOR_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#83a6ed'];

    // --- SECTION 1: Travel Management Overview ---
    const travelPayments = payments.filter(p => p.reservationId);
    const travelExpenses = expenses.filter(e => e.reservationId);
    const totalTravelIncome = travelPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalTravelExpenses = travelExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalTravelProfit = totalTravelIncome - totalTravelExpenses;

    const totalBusTourMaxCapacity = tours.reduce((sum, tour) => sum + (tour.maxPassengers || 0), 0);
    const totalBusTourBookedPassengers = reservations
        .filter(res => res.busTourId)
        .reduce((sum, res) => sum + (res.tourists.reduce((tSum, t) => tSum + (t.numberOfTourists || 0), 0) || 0), 0);
    const overallBusTourFulfillment = totalBusTourMaxCapacity > 0
        ? ((totalBusTourBookedPassengers / totalBusTourMaxCapacity) * 100).toFixed(1)
        : '0.0';

    // --- SECTION 2: Insurance Management Overview ---
    const insurancePayments = payments.filter(p => p.insuranceId); // Payments directly linked to insurance policies
    const insuranceExpenses = expenses.filter(e => e.insuranceId); // Expenses directly linked to insurance policies
    const totalInsuranceCommission = insurances.reduce((sum, ins) => sum + (ins.commission || 0), 0); // Income from insurance is commission
    const totalInsuranceExpenses = insuranceExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalInsuranceProfit = totalInsuranceCommission - totalInsuranceExpenses;
    const avgProfitPerInsurance = insurances.length > 0 ? (totalInsuranceProfit / insurances.length).toFixed(2) : 0;

    const paidInsuranceCount = insurances.filter(ins => ins.paid === 'YES').length;
    const unpaidInsuranceCount = insurances.filter(ins => ins.paid === 'NO').length;
    const paidToInsurerCount = insurances.filter(ins => ins.paidToInsurer === 'YES').length;
    const notPaidToInsurerCount = insurances.filter(ins => ins.paidToInsurer === 'NO').length;

    // --- SECTION 3: Combined Cash Flow (Actual Payments) ---
    // Total income from all payments
    const overallTotalIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    // Total expenses from all expenses
    const overallTotalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const overallNetProfit = overallTotalIncome - overallTotalExpenses;

    const totalBankIncome = payments.filter(p => p.method === 'BANK').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalCashIncome = payments.filter(p => p.method === 'CASH').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalBankExpenses = expenses.filter(e => e.method === 'BANK').reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalCashExpenses = expenses.filter(e => e.method === 'CASH').reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalBankBalance = totalBankIncome - totalBankExpenses;
    const totalCashBalance = totalCashIncome - totalCashExpenses;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>

            {/* General Travel Statistics (from Phase 1 & 2) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Reservations" value={totalReservations} icon={<Users className="h-6 w-6 text-white"/>} color="bg-blue-500" />
                <StatCard title="Total Profit (Reservations)" value={`€${totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<TrendingUp className="h-6 w-6 text-white"/>} color="bg-green-500" />
                <StatCard title="Avg. Profit / Res." value={`€${avgProfitPerReservation}`} icon={<DollarSign className="h-6 w-6 text-white"/>} color="bg-yellow-500" />
                <StatCard title="Avg. Stay / Res." value={`${avgStayPerReservation} days`} icon={<Hotel className="h-6 w-6 text-white"/>} color="bg-indigo-500" />
            </div>

            {/* SECTION 1: Travel Management Summary */}
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Travel Management Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Travel Income" value={`€${totalTravelIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ChevronsRight className="h-6 w-6 text-white"/>} color="bg-green-600" />
                <StatCard title="Total Travel Expenses" value={`€${totalTravelExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ChevronsLeft className="h-6 w-6 text-white"/>} color="bg-red-600" />
                <StatCard title="Travel Net Profit" value={`€${totalTravelProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<TrendingUp className="h-6 w-6 text-white"/>} color={totalTravelProfit >= 0 ? "bg-purple-500" : "bg-orange-500"} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard title="Overall Bus Tour Fulfillment" value={`${overallBusTourFulfillment}%`} icon={<Bus className="h-6 w-6 text-white"/>} color="bg-blue-600" />
                <StatCard title="Total Bus Passengers Booked" value={totalBusTourBookedPassengers} icon={<Users2 className="h-6 w-6 text-white"/>} color="bg-sky-600" />
            </div>


            {/* SECTION 2: Insurance Management Summary */}
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Insurance Management Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Insurance Income (Commissions)" value={`€${totalInsuranceCommission.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<CreditCard className="h-6 w-6 text-white"/>} color="bg-teal-500" />
                <StatCard title="Total Insurance Expenses" value={`€${totalInsuranceExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ArrowLeftRight className="h-6 w-6 text-white"/>} color="bg-rose-500" />
                <StatCard title="Insurance Net Profit" value={`€${totalInsuranceProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<DollarSign className="h-6 w-6 text-white"/>} color={totalInsuranceProfit >= 0 ? "bg-green-500" : "bg-orange-500"} />
                <StatCard title="Avg. Profit / Policy" value={`€${avgProfitPerInsurance}`} icon={<Tag className="h-6 w-6 text-white"/>} color="bg-indigo-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Policies Paid by Customer" value={paidInsuranceCount} icon={<CheckCircle className="h-5 w-5 text-white"/>} color="bg-green-500" />
                <StatCard title="Policies Not Paid by Customer" value={unpaidInsuranceCount} icon={<XCircle className="h-5 w-5 text-white"/>} color="bg-red-500" />
                <StatCard title="Policies Paid to Insurer" value={paidToInsurerCount} icon={<CheckCircle className="h-5 w-5 text-white"/>} color="bg-green-700" />
                <StatCard title="Policies Not Paid to Insurer" value={notPaidToInsurerCount} icon={<XCircle className="h-5 w-5 text-white"/>} color="bg-red-700" />
            </div>

            {/* SECTION 3: Combined Cash Flow */}
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Combined Cash Flow (Actual Payments)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Bank Balance" value={`€${totalBankBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<Banknote className="h-6 w-6 text-white"/>} color={totalBankBalance >= 0 ? "bg-emerald-600" : "bg-gray-500"} />
                <StatCard title="Cash Balance" value={`€${totalCashBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<DollarSign className="h-6 w-6 text-white"/>} color={totalCashBalance >= 0 ? "bg-amber-600" : "bg-gray-500"} />
                <StatCard title="Overall Total Income" value={`€${overallTotalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ChevronsRight className="h-6 w-6 text-white"/>} color="bg-blue-500" />
                <StatCard title="Overall Total Expenses" value={`€${overallTotalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ChevronsLeft className="h-6 w-6 text-white"/>} color="bg-red-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <StatCard title="Overall Net Profit" value={`€${overallNetProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<TrendingUp className="h-6 w-6 text-white"/>} color={overallNetProfit >= 0 ? "bg-green-500" : "bg-orange-500"} />
                <StatCard title="Overall Net VAT" value={`€${(overallTotalIncome * 0.24 - overallTotalExpenses * 0.24).toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<FileText className="h-6 w-6 text-white"/>} color="bg-pink-500" />
            </div>


            {/* Existing Charts Section (can be moved/re-organized later if needed) */}
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Detailed Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Reservations by Month Chart */}
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Reservations by Month</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reservationsByMonthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Reservations" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {/* Profit by Month Chart */}
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Profit by Month</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={profitByMonthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `€${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
                            <Legend />
                            <Line type="monotone" dataKey="Profit" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reservations by Status Pie Chart */}
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Reservations by Status</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => value.toLocaleString()} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Tour Operator Breakdown Pie Chart */}
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Tour Operator Breakdown</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={operatorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {operatorData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={OPERATOR_COLORS[index % OPERATOR_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => value.toLocaleString()} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// Component for creating new reservations
const CreateReservation = ({ onAddReservation, expenses }) => { // Added expenses prop
    // State for the new reservation form
    const [reservation, setReservation] = useState({
        id: '', // Will be generated
        creationDate: new Date().toISOString().split('T')[0],
        tourName: '',
        tourType: 'BUS',
        checkIn: '',
        checkOut: '',
        adults: 1,
        children: 0,
        tourists: [{ name: '', fatherName: '', familyName: '', id: '', address: '', city: '', postCode: '', mail: '', phone: '' , numberOfTourists: 1}], // Added numberOfTourists for each tourist
        depositPaid: 'NO',
        depositAmount: 0,
        finalPaymentPaid: 'NO',
        finalPaymentAmount: 0,
        owedToHotel: 0,
        profit: 0, // This will be calculated
        tourOperator: '',
        status: 'Pending',
        busTourId: '', // Added busTourId field
        customerId: '', // New customerId field
        // --- NEW FIELDS ADDED HERE ---
        hotelAccommodation: '',
        foodIncluded: 'NO', // Default to 'NO'
        place: '',
        transport: '',
    });

    // State for total nights calculation
    const [totalNights, setTotalNights] = useState(0);

    // Effect to calculate total nights when check-in or check-out dates change
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

    // Effect to calculate profit when relevant financial fields change
    useEffect(() => {
        const finalAmount = parseFloat(reservation.finalPaymentAmount) || 0;
        const owedToHotel = parseFloat(reservation.owedToHotel) || 0;

        // NOTE: Expenses are not dynamically linked in this form for a *new* reservation.
        // The profit calculation here is a preliminary estimate.
        // The final profit is set in the main `addReservation` handler in App.jsx.
        const expensesConnectedToThisReservation = 0; // Placeholder for future integration

        const calculatedProfit = finalAmount - owedToHotel - expensesConnectedToThisReservation;
        setReservation(prev => ({ ...prev, profit: calculatedProfit }));
    }, [reservation.finalPaymentAmount, reservation.owedToHotel]);

    // Handler for changes in tourist information
    const handleTouristChange = (index, e) => {
        const { name, value } = e.target;
        const updatedTourists = [...reservation.tourists];
        updatedTourists[index][name] = (name === 'numberOfTourists') ? parseInt(value) || 0 : value;
        setReservation(prev => ({ ...prev, tourists: updatedTourists }));
    };

    // Add a new tourist field
    const addTourist = () => {
        setReservation(prev => ({ ...prev, tourists: [...prev.tourists, { name: '', fatherName: '', familyName: '', id: '', address: '', city: '', postCode: '', mail: '', phone: '', numberOfTourists: 1 }] }));
    };

    // Remove a tourist field
    const removeTourist = (index) => {
        const updatedTourists = reservation.tourists.filter((_, i) => i !== index);
        setReservation(prev => ({ ...prev, tourists: updatedTourists }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        onAddReservation(reservation);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Create Reservation</h1>
            <ReservationForm
                reservationData={reservation}
                onReservationDataChange={setReservation}
                onSubmit={handleSubmit}
                totalNights={totalNights}
                onAddTourist={addTourist}
                onRemoveTourist={removeTourist}
                onTouristChange={handleTouristChange}
                buttonText="Create Reservation"
            />
        </div>
    );
};

// Component for viewing and searching reservations
const ViewReservations = ({ reservations, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredReservations, setFilteredReservations] = useState(reservations);

    // Effect to filter reservations based on search term
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

    // Function to export reservations to CSV
    const exportToCsv = () => {
        const headers = ["ID", "Creation Date", "Tour Name", "Check-in", "Check-out", "Status", "Profit", "Lead Guest Name", "Lead Guest Family Name"];
        const rows = filteredReservations.map(res => [
            res.id,
            res.creationDate,
            res.tourName,
            res.checkIn,
            res.checkOut,
            res.status,
            res.profit,
            res.tourists[0]?.name || '',
            res.tourists[0]?.familyName || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')); // Enclose fields in quotes and escape internal quotes

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
                <input
                    type="text"
                    placeholder="Search reservations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
                <div className="flex gap-2">
                    <button onClick={exportToCsv} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-md">Export CSV</button>
                    {/* Placeholder for Import CSV - disabled for now */}
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
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            res.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                            res.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            res.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {res.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">€{res.profit ? res.profit.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}</td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => onEdit(res)} className="text-blue-600 hover:text-blue-800 font-medium p-1 rounded-md hover:bg-blue-100 transition-colors" title="Edit Reservation">
                                            <Edit size={18} />
                                        </button>
                                        {/* Delete Reservation Button */}
                                        <button onClick={() => onDelete(res.id)} className="text-red-600 hover:text-red-800 font-medium p-1 rounded-md hover:bg-red-100 transition-colors" title="Delete Reservation">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                        </button>
                                        {/* REMOVED "Create Invoice" button as requested */}
                                        {/* REMOVED "Create Voucher" button as requested */}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No reservations found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Component for adding new payments/income
// MODIFIED: Added prefillTourId prop to allow pre-filling reservationId
const AddPayment = ({ onAddPayment, payments, reservations, insurances, prefillReservationId = '' }) => {
    // State for the new payment form, initialized with prefillReservationId if provided
    const [payment, setPayment] = useState({
        date: new Date().toISOString().split('T')[0],
        method: 'BANK',
        amount: '',
        reason: '',
        reservationId: prefillReservationId, // Set initial value from prop
        insuranceId: '',
        vat: 24
    });

    // Effect to update reservationId if prefillReservationId changes (e.g., from navigation)
    useEffect(() => {
        setPayment(prev => ({ ...prev, reservationId: prefillReservationId }));
    }, [prefillReservationId]);

    // Handler for input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayment(prev => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        onAddPayment({ ...payment, amount: parseFloat(payment.amount), vat: parseFloat(payment.vat) });
        // Reset form
        setPayment({ date: new Date().toISOString().split('T')[0], method: 'BANK', amount: '', reason: '', reservationId: '', insuranceId: '', vat: 24 });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Add Payment / Income</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField label="Date" name="date" type="date" value={payment.date} onChange={handleChange} required />
                    <SelectField label="Payment Method" name="method" value={payment.method} onChange={handleChange} options={['CASH', 'BANK']} />
                    <InputField label="Amount (€)" name="amount" type="number" value={payment.amount} onChange={handleChange} required step="0.01" min="0" />
                    <div className="lg:col-span-2">
                        <InputField label="Reason / Description" name="reason" value={payment.reason} onChange={handleChange} required />
                    </div>
                    <InputField label="VAT (%)" name="vat" type="number" value={payment.vat} onChange={handleChange} required min="0" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Associate with Reservation (Optional)</label>
                        <input list="reservations" name="reservationId" value={payment.reservationId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        <datalist id="reservations">
                            {reservations.map(r => <option key={r.id} value={r.id}>{r.id} - {r.tourName}</option>)}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Associate with Insurance (Optional)</label>
                        <input list="insurances" name="insuranceId" value={payment.insuranceId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        <datalist id="insurances">
                            {insurances.map(i => <option key={i.id} value={i.id}>{i.id} - {i.policyNumber} ({i.customer.familyName})</option>)}
                        </datalist>
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button type="submit" className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-md">Add Payment</button>
                </div>
            </form>

            <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Payments</h2>
            <div className="bg-white p-2 rounded-lg shadow-md overflow-x-auto border border-gray-200">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Reason</th>
                            <th className="px-6 py-3">Method</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Associated ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length > 0 ? (
                            payments.map(p => (
                                <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{p.date}</td>
                                    <td className="px-6 py-4">{p.reason}</td>
                                    <td className="px-6 py-4">{p.method}</td>
                                    <td className="px-6 py-4 font-medium text-green-600">€{p.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="px-6 py-4">{p.reservationId || p.insuranceId || 'N/A'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No payments recorded.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Component for adding new expenses
// MODIFIED: Added prefillTourId prop to allow pre-filling reservationId
const AddExpense = ({ onAddExpense, expenses, reservations, insurances, prefillReservationId = '' }) => {
    // State for the new expense form, initialized with prefillReservationId if provided
    const [expense, setExpense] = useState({
        date: new Date().toISOString().split('T')[0],
        method: 'BANK',
        amount: '',
        reason: '',
        reservationId: prefillReservationId, // Set initial value from prop
        insuranceId: '',
        vat: 24
    });

    // Effect to update reservationId if prefillReservationId changes (e.g., from navigation)
    useEffect(() => {
        setExpense(prev => ({ ...prev, reservationId: prefillReservationId }));
    }, [prefillReservationId]);

    // Handler for input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setExpense(prev => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        onAddExpense({ ...expense, amount: parseFloat(expense.amount), vat: parseFloat(expense.vat) });
        // Reset form
        setExpense({ date: new Date().toISOString().split('T')[0], method: 'BANK', amount: '', reason: '', reservationId: '', insuranceId: '', vat: 24 });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Add Expense</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField label="Date" name="date" type="date" value={expense.date} onChange={handleChange} required />
                    <SelectField label="Payment Method" name="method" value={expense.method} onChange={handleChange} options={['CASH', 'BANK']} />
                    <InputField label="Amount (€)" name="amount" type="number" value={expense.amount} onChange={handleChange} required step="0.01" min="0" />
                    <div className="lg:col-span-2">
                        <InputField label="Reason / Description" name="reason" value={expense.reason} onChange={handleChange} required />
                    </div>
                    <InputField label="VAT (%)" name="vat" type="number" value={expense.vat} onChange={handleChange} required min="0" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Associate with Reservation (Optional)</label>
                        <input list="reservations-expense" name="reservationId" value={expense.reservationId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        <datalist id="reservations-expense">
                            {reservations.map(r => <option key={r.id} value={r.id}>{r.id} - {r.tourName}</option>)}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Associate with Insurance (Optional)</label>
                        <input list="insurances-expense" name="insuranceId" value={expense.insuranceId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        <datalist id="insurances-expense">
                            {insurances.map(i => <option key={i.id} value={i.id}>{i.id} - {i.policyNumber} ({i.customer.familyName})</option>)}
                        </datalist>
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button type="submit" className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors shadow-md">Add Expense</button>
                </div>
            </form>

            <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Expenses</h2>
            <div className="bg-white p-2 rounded-lg shadow-md overflow-x-auto border border-gray-200">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Reason</th>
                            <th className="px-6 py-3">Method</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Associated ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length > 0 ? (
                            expenses.map(e => (
                                <tr key={e.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{e.date}</td>
                                    <td className="px-6 py-4">{e.reason}</td>
                                    <td className="px-6 py-4">{e.method}</td>
                                    <td className="px-6 py-4 font-medium text-red-600">€{e.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="px-6 py-4">{e.reservationId || e.insuranceId || 'N/A'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No expenses recorded.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Component for Financial Reports
const FinancialReports = ({ payments, expenses }) => {
    const [selectedMonth, setSelectedMonth] = useState('All Time');

    // Memoized list of available months from payments and expenses
    const availableMonths = useMemo(() => {
        const allDates = [...payments.map(p => p.date), ...expenses.map(e => e.date)];
        const months = new Set(allDates.map(date => getMonthYear(date)));
        return ['All Time', ...Array.from(months).sort((a,b) => {
            if (a === 'All Time') return -1;
            if (b === 'All Time') return 1;
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
            return new Date(`1 ${monthA} 2000`).getMonth() - new Date(`1 ${monthB} 2000`).getMonth();
        })];
    }, [payments, expenses]);

    // Memoized filtered data based on selected month
    const filteredData = useMemo(() => {
        const filteredPayments = (selectedMonth === 'All Time') ? payments : payments.filter(p => getMonthYear(p.date) === selectedMonth);
        const filteredExpenses = (selectedMonth === 'All Time') ? expenses : expenses.filter(e => getMonthYear(e.date) === selectedMonth);
        return { filteredPayments, filteredExpenses };
    }, [selectedMonth, payments, expenses]);

    // Memoized financial calculations
    const { totalIncome, totalExpenses, netResult, netVat, incomeByMethod, expenseByMethod } = useMemo(() => {
        const { filteredPayments, filteredExpenses } = filteredData;
        const totalIncome = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        // "Profit" in the context of financial reports for a period is typically Net Result (Income - Expenses)
        const netResult = totalIncome - totalExpenses;
        const vatCollected = filteredPayments.reduce((sum, p) => sum + ((p.amount || 0) / (1 + (p.vat || 0) / 100)) * ((p.vat || 0) / 100), 0);
        const vatPaid = filteredExpenses.reduce((sum, e) => sum + ((e.amount || 0) * ((e.vat || 0) / 100)), 0);
        const netVat = vatCollected - vatPaid;

        const incomeByMethod = filteredPayments.reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + (p.amount || 0);
            return acc;
        }, {});
        const expenseByMethod = filteredExpenses.reduce((acc, e) => {
            acc[e.method] = (acc[e.method] || 0) + (e.amount || 0);
            return acc;
        }, {});
        return { totalIncome, totalExpenses, netResult, netVat, incomeByMethod, expenseByMethod };
    }, [filteredData]);

    const incomeMethodData = Object.keys(incomeByMethod).map(key => ({ name: key, value: incomeByMethod[key] }));
    const expenseMethodData = Object.keys(expenseByMethod).map(key => ({ name: key, value: expenseByMethod[key] }));
    const PIE_COLORS = { CASH: '#ffc658', BANK: '#82ca9d' }; // Consistent colors for pie charts

    // --- NEW: PDF Generation Function ---
    const handleGeneratePdf = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(22);
        doc.text(`Financial Report: ${selectedMonth}`, 14, 20);

        let yPos = 30;

        // Summary Table
        doc.setFontSize(12);
        doc.text("Summary", 14, yPos + 10);
        doc.autoTable({
            // Removed duplicate startY
            head: [['Metric', 'Amount (€)']],
            body: [
                ['Total Income', totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})],
                ['Total Expenses', totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})],
                ['Net Result (Profit)', netResult.toLocaleString(undefined, {minimumFractionDigits: 2})],
                ['Net VAT', netVat.toLocaleString(undefined, {minimumFractionDigits: 2})],
            ],
            theme: 'striped',
            styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [60, 179, 113], textColor: [255, 255, 255] }, // Seafoam green for headers
            alternateRowStyles: { fillColor: [240, 255, 240] }, // Lighter green for alternate rows
            startY: yPos + 15, // This is the correct placement for startY
            margin: { left: 14, right: 14 },
            didDrawPage: function (data) {
                // Footer
                let str = 'Page ' + doc.internal.getNumberOfPages();
                if (typeof doc.setFontColor === 'function') {
                    doc.setFontSize(10).setTextColor(100);
                }
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        yPos = doc.autoTable.previous.finalY + 10;

        // Income Details Table
        doc.text("Income Details", 14, yPos + 10);
        doc.autoTable({
            // Removed duplicate startY
            head: [['Date', 'Reason', 'Method', 'Amount (€)']],
            body: filteredData.filteredPayments.map(p => [p.date, p.reason, p.method, p.amount.toFixed(2)]),
            theme: 'striped',
            styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [46, 139, 87], textColor: [255, 255, 255] }, // Darker seafoam green
            alternateRowStyles: { fillColor: [240, 255, 240] },
            startY: yPos + 15, // This is the correct placement for startY
            margin: { left: 14, right: 14 },
            didDrawPage: function (data) {
                let str = 'Page ' + doc.internal.getNumberOfPages();
                if (typeof doc.setFontColor === 'function') {
                    doc.setFontSize(10).setTextColor(100);
                }
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        yPos = doc.autoTable.previous.finalY + 10;

        // Expense Details Table
        doc.text("Expense Details", 14, yPos + 10);
        doc.autoTable({
            // Removed duplicate startY
            head: [['Date', 'Reason', 'Method', 'Amount (€)']],
            body: filteredData.filteredExpenses.map(e => [e.date, e.reason, e.method, e.amount.toFixed(2)]),
            theme: 'striped',
            styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [205, 92, 92], textColor: [255, 255, 255] }, // Indian red for expenses
            alternateRowStyles: { fillColor: [255, 240, 240] },
            startY: yPos + 15, // This is the correct placement for startY
            margin: { left: 14, right: 14 },
            didDrawPage: function (data) {
                let str = 'Page ' + doc.internal.getNumberOfPages();
                if (typeof doc.setFontColor === 'function') {
                    doc.setFontSize(10).setTextColor(100);
                }
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`Financial_Report_${selectedMonth}.pdf`);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Financial Reports</h1>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <label htmlFor="month-select" className="text-sm font-medium text-gray-700">Report for:</label>
                    <select
                        id="month-select"
                        name="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                    >
                        {availableMonths.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Income" value={`€${totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ChevronsRight className="h-6 w-6 text-white"/>} color="bg-green-500" />
                <StatCard title="Total Expenses" value={`€${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ChevronsLeft className="h-6 w-6 text-white"/>} color="bg-red-500" />
                <StatCard title="Net Result (Profit)" value={`€${netResult.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<DollarSign className="h-6 w-6 text-white"/>} color={netResult >= 0 ? "bg-blue-500" : "bg-orange-500"} />
                <StatCard title="Net VAT" value={`€${netVat.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<FileText className="h-6 w-6 text-white"/>} color="bg-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Income Details and Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-green-700">Income Details</h2>
                    <div className="h-96 overflow-y-auto mb-4 border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Reason</th>
                                    <th className="px-4 py-2">Method</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.filteredPayments.length > 0 ? (
                                    filteredData.filteredPayments.map(p => (
                                        <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-4 py-2">{p.date}</td>
                                            <td className="px-4 py-2">{p.reason}</td>
                                            <td className="px-4 py-2">{p.method}</td>
                                            <td className="px-4 py-2 text-right font-medium text-green-600">€{p.amount.toFixed(2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No income found for this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Income by Method</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={incomeMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {incomeMethodData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[entry.name]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `€${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Expense Details and Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-red-700">Expense Details</h2>
                    <div className="h-96 overflow-y-auto mb-4 border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Reason</th>
                                    <th className="px-4 py-2">Method</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.filteredExpenses.length > 0 ? (
                                    filteredData.filteredExpenses.map(e => (
                                        <tr key={e.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-4 py-2">{e.date}</td>
                                            <td className="px-4 py-2">{e.reason}</td>
                                            <td className="px-4 py-2">{e.method}</td>
                                            <td className="px-4 py-2 text-right font-medium text-red-600">€{e.amount.toFixed(2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No expenses found for this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Expenses by Method</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={expenseMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {expenseMethodData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[entry.name]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `€${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-8 flex justify-center">
                <button onClick={handleGeneratePdf} className="bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 transition-colors shadow-md">Generate PDF Report</button>
            </div>
        </div>
    );
};

// Placeholder component for Create Vouchers
const CreateVouchers = () => (
    <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800">Create Vouchers (Coming Soon)</h1>
        <p className="text-gray-600 mt-4">This section will allow you to generate vouchers for reservations.</p>
    </div>
);

// Reusable Input Field component
const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            {...props}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
    </div>
);

// Reusable Select Field component
const SelectField = ({ label, options, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <select
            {...props}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
        >
            {options.map(opt => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
        </select>
    </div>
);

// Reservation Form component, used by both Create and Edit Reservation
const ReservationForm = ({ reservationData, onReservationDataChange, onSubmit, totalNights, onAddTourist, onRemoveTourist, onTouristChange, buttonText }) => {
    // Calculate profit dynamically based on form fields
    const calculateProfit = useMemo(() => {
        const finalAmount = parseFloat(reservationData.finalPaymentAmount) || 0;
        const owedToHotel = parseFloat(reservationData.owedToHotel) || 0;
        // NOTE: For now, expenses connected to this specific reservation are not dynamically fetched or linked
        // as this is a generic form. The final calculation is done before saving to DB.
        const expensesForReservation = 0; // Placeholder for future dynamic lookup

        return (finalAmount - owedToHotel - expensesForReservation).toFixed(2);
    }, [reservationData.finalPaymentAmount, reservationData.owedToHotel]);


    return (
        <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6 border border-gray-200">
            {/* Reservation Details Section */}
            <div className="border-b pb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Reservation Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Creation Date" name="creationDate" type="date" value={reservationData.creationDate} onChange={(e) => onReservationDataChange({ ...reservationData, creationDate: e.target.value })} />
                    <InputField label="Reservation Number" name="id" value={reservationData.id} onChange={(e) => onReservationDataChange({ ...reservationData, id: e.target.value })} placeholder="e.g. DYT100101" />
                    <InputField label="Tour Name" name="tourName" value={reservationData.tourName} onChange={(e) => onReservationDataChange({ ...reservationData, tourName: e.target.value })} />
                    <SelectField label="Tour Type" name="tourType" value={reservationData.tourType} onChange={(e) => onReservationDataChange({ ...reservationData, tourType: e.target.value })} options={['BUS', 'PARTNER', 'HOTEL ONLY']} />
                    {/* --- NEW FIELDS ADDED HERE --- */}
                    <InputField label="Hotel Accommodation" name="hotelAccommodation" value={reservationData.hotelAccommodation} onChange={(e) => onReservationDataChange({ ...reservationData, hotelAccommodation: e.target.value })} />
                    <SelectField label="Food Included?" name="foodIncluded" value={reservationData.foodIncluded} onChange={(e) => onReservationDataChange({ ...reservationData, foodIncluded: e.target.value })} options={['YES', 'NO']} />
                    <InputField label="Place" name="place" value={reservationData.place} onChange={(e) => onReservationDataChange({ ...reservationData, place: e.target.value })} />
                    <InputField label="Transport" name="transport" value={reservationData.transport} onChange={(e) => onReservationDataChange({ ...reservationData, transport: e.target.value })} />
                </div>
            </div>

            {/* Dates & Guests Section */}
            <div className="border-b pb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Dates & Guests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <InputField label="Check-in Date" name="checkIn" type="date" value={reservationData.checkIn} onChange={(e) => onReservationDataChange({ ...reservationData, checkIn: e.target.value })} />
                    <InputField label="Check-out Date" name="checkOut" type="date" value={reservationData.checkOut} onChange={(e) => onReservationDataChange({ ...reservationData, checkOut: e.target.value })} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Total Nights</label>
                        <p className="mt-1 p-2 h-10 flex items-center bg-gray-100 rounded-md border border-gray-300">{totalNights}</p>
                    </div>
                    <InputField label="Adults" name="adults" type="number" value={reservationData.adults} onChange={(e) => onReservationDataChange({ ...reservationData, adults: parseInt(e.target.value) || 0 })} min="0" />
                    <InputField label="Children" name="children" type="number" value={reservationData.children} onChange={(e) => onReservationDataChange({ ...reservationData, children: parseInt(e.target.value) || 0 })} min="0" />
                </div>
            </div>

            {/* Tourist Information Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Tourist Information</h2>
                {(reservationData.tourists || []).map((tourist, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 relative border border-gray-200">
                        <h3 className="font-semibold text-gray-600 mb-2">Tourist {index + 1}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <InputField label="Name" name="name" value={tourist.name} onChange={(e) => onTouristChange(index, e)} />
                            <InputField label="Father's Name" name="fatherName" value={tourist.fatherName} onChange={(e) => onTouristChange(index, e)} />
                            <InputField label="Family Name" name="familyName" value={tourist.familyName} onChange={(e) => onTouristChange(index, e)} />
                            <InputField label="ID" name="id" value={tourist.id} onChange={(e) => onTouristChange(index, e)} />
                            <InputField label="Address" name="address" value={tourist.address} onChange={(e) => onTouristChange(index, e)} />
                            <InputField label="City" name="city" value={tourist.city} onChange={(e) => onTouristChange(index, e)} />
                            <InputField label="Post Code" name="postCode" value={tourist.postCode} onChange={(e) => onTouristChange(index, e)} />
                            <InputField label="Email" name="mail" type="email" value={tourist.mail} onChange={(e) => onTouristChange(index, e)} />
                            <InputField label="Phone" name="phone" value={tourist.phone} onChange={(e) => onTouristChange(index, e)} />
                            <InputField label="Number of Tourists" name="numberOfTourists" type="number" value={tourist.numberOfTourists} onChange={(e) => onTouristChange(index, e)} min="1" />
                        </div>
                        {/* Remove Tourist Button */}
                        <button type="button" onClick={() => onRemoveTourist(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-2xl font-bold p-1 rounded-full hover:bg-red-100">&times;</button>
                    </div>
                ))}
                {/* Add Tourist Button */}
                <button type="button" onClick={onAddTourist} className="mt-2 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                    <PlusCircle size={18} /> Add another tourist
                </button>
            </div>

            {/* Financials & Status Section */}
            <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Financials & Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SelectField label="Deposit Paid" name="depositPaid" value={reservationData.depositPaid} onChange={(e) => onReservationDataChange({ ...reservationData, depositPaid: e.target.value })} options={['YES', 'NO']} />
                    <InputField label="Deposit Amount" name="depositAmount" type="number" value={reservationData.depositAmount} onChange={(e) => onReservationDataChange({ ...reservationData, depositAmount: parseFloat(e.target.value) || 0 })} min="0" />
                    <SelectField label="Final Payment Paid" name="finalPaymentPaid" value={reservationData.finalPaymentPaid} onChange={(e) => onReservationDataChange({ ...reservationData, finalPaymentPaid: e.target.value })} options={['YES', 'NO']} />
                    <InputField label="Final Amount" name="finalPaymentAmount" type="number" value={reservationData.finalPaymentAmount} onChange={(e) => onReservationDataChange({ ...reservationData, finalPaymentAmount: parseFloat(e.target.value) || 0 })} min="0" />
                    <InputField label="Owed to Hotel" name="owedToHotel" type="number" value={reservationData.owedToHotel} onChange={(e) => onReservationDataChange({ ...reservationData, owedToHotel: parseFloat(e.target.value) || 0 })} min="0" />
                    {/* Profit calculated automatically */}
                    <InputField label="Profit" name="profit" type="number"
                        value={calculateProfit}
                        onChange={(e) => onReservationDataChange({ ...reservationData, profit: parseFloat(e.target.value) || 0 })} // Allow manual override if needed
                        readOnly // Display as read-only by default
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm"
                    />
                    <InputField label="Tour Operator" name="tourOperator" value={reservationData.tourOperator} onChange={(e) => onReservationDataChange({ ...reservationData, tourOperator: e.target.value })} />
                    <SelectField label="Status" name="status" value={reservationData.status} onChange={(e) => onReservationDataChange({ ...reservationData, status: e.target.value })} options={['Pending', 'Confirmed', 'Cancelled', 'Past']} />
                    <InputField label="Bus Tour ID (Optional)" name="busTourId" value={reservationData.busTourId} onChange={(e) => onReservationDataChange({ ...reservationData, busTourId: e.target.value })} placeholder="e.g. DYTAL001" />
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md">{buttonText}</button>
            </div>
        </form>
    );
};

// Modal for editing reservations
const EditReservationModal = ({ isOpen, onClose, reservation, onUpdate }) => {
    // State for the reservation data being edited
    const [reservationData, setReservationData] = useState(reservation);
    const [totalNights, setTotalNights] = useState(0);

    // Update reservationData when the 'reservation' prop changes
    useEffect(() => {
        setReservationData(reservation);
    }, [reservation]);

    // Recalculate total nights if check-in/out dates in the modal change
    useEffect(() => {
        if (reservationData?.checkIn && reservationData?.checkOut) {
            const start = new Date(reservationData.checkIn);
            const end = new Date(reservationData.checkOut);
            if (end > start) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setTotalNights(diffDays);
            } else {
                setTotalNights(0);
            }
        }
    }, [reservationData?.checkIn, reservationData?.checkOut]);

    // Handlers for tourist data changes within the modal
    const handleTouristChange = (index, e) => {
        const { name, value } = e.target;
        const updatedTourists = [...(reservationData.tourists || [])];
        updatedTourists[index][name] = (name === 'numberOfTourists') ? parseInt(value) || 0 : value;
        setReservationData(prev => ({ ...prev, tourists: updatedTourists }));
    };

    // Add tourist within the modal
    const addTourist = () => {
        const newTourists = [...(reservationData.tourists || []), { name: '', fatherName: '', familyName: '', id: '', address: '', city: '', postCode: '', mail: '', phone: '', numberOfTourists: 1 }];
        setReservationData(prev => ({ ...prev, tourists: newTourists }));
    };

    // Remove tourist within the modal
    const removeTourist = (index) => {
        const updatedTourists = (reservationData.tourists || []).filter((_, i) => i !== index);
        setReservationData(prev => ({ ...prev, tourists: updatedTourists }));
    };

    // Handle modal form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(reservationData);
        onClose(); // Close the modal after updating
    };

    // Render nothing if modal is not open or no reservation data
    if (!isOpen || !reservationData) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-4xl relative">
                <div className="p-6">
                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Edit Reservation: {reservation.id}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-200">&times;</button>
                    </div>
                    <ReservationForm
                        reservationData={reservationData}
                        onReservationDataChange={setReservationData}
                        onSubmit={handleSubmit}
                        totalNights={totalNights}
                        onAddTourist={addTourist}
                        onRemoveTourist={removeTourist}
                        onTouristChange={handleTouristChange}
                        buttonText="Save Changes"
                    />
                </div>
            </div>
        </div>
    );
};

// Component for creating new Bus Tours
const CreateTour = ({ onAddTour, tours }) => {
    const [tour, setTour] = useState({
        id: '', // Auto-generated
        departureDate: '',
        arrivalDate: '',
        nights: 0, // Manual input
        daysIncludingTravel: 0, // Auto-calculated
        transportCompany: '',
        hotel: '',
        maxPassengers: 1,
    });

    // Effect to calculate daysIncludingTravel
    useEffect(() => {
        if (tour.departureDate && tour.arrivalDate) {
            const start = new Date(tour.departureDate);
            const end = new Date(tour.arrivalDate);
            if (end >= start) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive of arrival day
                setTour(prev => ({ ...prev, daysIncludingTravel: diffDays }));
            } else {
                setTour(prev => ({ ...prev, daysIncludingTravel: 0 }));
            }
        }
    }, [tour.departureDate, tour.arrivalDate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTour(prev => ({ ...prev, [name]: (name === 'maxPassengers' || name === 'nights') ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddTour(tour);
        // Reset form
        setTour({
            id: '',
            departureDate: '',
            arrivalDate: '',
            nights: 0,
            daysIncludingTravel: 0,
            transportCompany: '',
            hotel: '',
            maxPassengers: 1,
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Create Bus Tour</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InputField label="Tour ID (Manual or Auto)" name="id" value={tour.id} onChange={handleChange} placeholder={`e.g. DYTAL${(tours.length + 1).toString().padStart(3, '0')}`} />
                    <InputField label="Departure Date" name="departureDate" type="date" value={tour.departureDate} onChange={handleChange} required />
                    <InputField label="Arrival Date" name="arrivalDate" type="date" value={tour.arrivalDate} onChange={handleChange} required />
                    <InputField label="Nights" name="nights" type="number" value={tour.nights} onChange={handleChange} min="0" required />
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Days Including Travel</label>
                        <p className="mt-1 p-2 h-10 flex items-center bg-gray-100 rounded-md border border-gray-300">{tour.daysIncludingTravel}</p>
                    </div>
                    <InputField label="Transport Company" name="transportCompany" value={tour.transportCompany} onChange={handleChange} required />
                    <InputField label="Hotel" name="hotel" value={tour.hotel} onChange={handleChange} required />
                    <InputField label="Max Passengers" name="maxPassengers" type="number" value={tour.maxPassengers} onChange={handleChange} min="1" required />
                </div>
                <div className="flex justify-end mt-6">
                    <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md">Create Tour</button>
                </div>
            </form>
        </div>
    );
};

// Component for viewing Bus Tours
// MODIFIED: Added linked reservations display and activated "Add Tour Payment"/"Add Tour Expense" buttons
const ViewTours = ({ tours, reservations, onAddPaymentForTour, onAddExpenseForTour, onEditTour }) => {
    const [expandedTourId, setExpandedTourId] = useState(null);

    const toggleTourExpansion = (tourId) => {
        setExpandedTourId(expandedTourId === tourId ? null : tourId);
    };

    // Prepare tours with calculated fields and linked reservations
    const toursWithDetails = useMemo(() => {
        return tours.map(tour => {
            const linkedReservations = reservations.filter(res => res.busTourId === tour.id);
            const bookedPassengers = linkedReservations.reduce((sum, res) => sum + (res.tourists.reduce((tSum, t) => tSum + (t.numberOfTourists || 0), 0) || 0), 0); // Sum of numberOfTourists from all tourists in reservation
            const fulfillment = tour.maxPassengers > 0 ? ((bookedPassengers / tour.maxPassengers) * 100).toFixed(1) : '0.0';
            return {
                ...tour,
                bookedPassengers,
                fulfillment,
                linkedReservations // Attach linked reservations for display
            };
        });
    }, [tours, reservations]);

    // --- NEW: PDF Generation Function for Rooming List ---
    const handleGenerateRoomingListPdf = (tour) => {
        // jsPDF is assumed to be globally available via CDN
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text(`Rooming List for Tour: ${tour.id}`, 14, 20);
        doc.setFontSize(12);
        doc.text(`Hotel: ${tour.hotel}`, 14, 28);
        doc.text(`Dates: ${tour.departureDate} to ${tour.arrivalDate}`, 14, 35);

        const tableColumn = ["Reservation #", "Name", "Family Name", "ID", "Room Type", "No. of Tourists"];
        const tableRows = [];

        tour.linkedReservations.forEach(res => {
            res.tourists.forEach(tourist => {
                const touristData = [
                    res.id,
                    tourist.name || '',
                    tourist.familyName || '',
                    tourist.id || '',
                    tourist.roomType || '',
                    tourist.numberOfTourists || 0
                ];
                tableRows.push(touristData);
            });
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] }, // Dark blue-gray for headers
            alternateRowStyles: { fillColor: [245, 245, 245] }, // Light gray for alternate rows
            startY: 45, // This is the correct placement for startY
            margin: { left: 14, right: 14 },
            didDrawPage: function (data) {
                let str = 'Page ' + doc.internal.getNumberOfPages();
                if (typeof doc.setFontColor === 'function') {
                    doc.setFontSize(10).setTextColor(100);
                }
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`Rooming_List_${tour.id}.pdf`);
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">View Bus Tours & Holidays</h1>
            {toursWithDetails.length === 0 ? (
                <p className="text-gray-600">No bus tours created yet.</p>
            ) : (
                <div className="space-y-4">
                    {toursWithDetails.map(tour => (
                        <div key={tour.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleTourExpansion(tour.id)}>
                                <h2 className="text-xl font-semibold text-gray-700">{tour.id}: {tour.hotel} ({tour.departureDate} - {tour.arrivalDate})</h2>
                                <button className="p-2 rounded-full hover:bg-gray-100">
                                    {expandedTourId === tour.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                            </div>
                            {expandedTourId === tour.id && (
                                <div className="mt-4 border-t border-gray-200 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700 text-sm">
                                        <p><strong>Departure:</strong> {tour.departureDate}</p>
                                        <p><strong>Arrival:</strong> {tour.arrivalDate}</p>
                                        <p><strong>Nights:</strong> {tour.nights}</p>
                                        <p><strong>Days Incl. Travel:</strong> {tour.daysIncludingTravel}</p>
                                        <p><strong>Transport Co:</strong> {tour.transportCompany}</p>
                                        <p><strong>Hotel:</strong> {tour.hotel}</p>
                                        <p><strong>Max Passengers:</strong> {tour.maxPassengers}</p>
                                        <p><strong>Booked Passengers:</strong> {tour.bookedPassengers}</p>
                                        <p><strong>Fulfillment:</strong> <span className="font-bold text-blue-600">{tour.fulfillment}%</span></p>
                                    </div>

                                    <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-700">Financials & Actions:</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {/* Activated buttons with navigation */}
                                        <button onClick={() => onAddPaymentForTour(tour.id)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors shadow-sm">Add Tour Payment</button>
                                        <button onClick={() => onAddExpenseForTour(tour.id)} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors shadow-sm">Add Tour Expense</button>
                                        <button onClick={() => onEditTour(tour)} className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors shadow-sm">Edit Tour Details</button>
                                        {/* Activated Rooming List PDF button */}
                                        <button onClick={() => handleGenerateRoomingListPdf(tour)} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow-sm">Rooming List PDF</button>
                                        {/* Placeholders for other PDF generators for Bus Tours */}
                                        <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors shadow-sm disabled:opacity-50" disabled>Contract with Transport Co.</button>
                                        <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors shadow-sm disabled:opacity-50" disabled>Business Trip Order</button>
                                        <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors shadow-sm disabled:opacity-50" disabled>Bus List</button>
                                        <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors shadow-sm disabled:opacity-50" disabled>Bus List BG</button>
                                    </div>

                                    {/* Display Linked Reservations Table */}
                                    <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-700">Linked Reservations:</h3>
                                    {tour.linkedReservations.length > 0 ? (
                                        <div className="overflow-x-auto bg-gray-50 rounded-md border border-gray-200">
                                            <table className="min-w-full text-sm text-left text-gray-500">
                                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-2">Res. #</th>
                                                        <th className="px-4 py-2">Lead Guest</th>
                                                        <th className="px-4 py-2">Adults/Children</th>
                                                        <th className="px-4 py-2">Status</th>
                                                        <th className="px-4 py-2 text-right">Profit</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tour.linkedReservations.map(res => (
                                                        <tr key={res.id} className="bg-white border-b hover:bg-gray-100">
                                                            <td className="px-4 py-2 font-medium text-gray-900">{res.id}</td>
                                                            <td className="px-4 py-2">{res.tourists[0]?.name || 'N/A'} {res.tourists[0]?.familyName}</td>
                                                            <td className="px-4 py-2">{res.adults}/{res.children}</td>
                                                            <td className="px-4 py-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                    res.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                                    res.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    res.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {res.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-right">€{res.profit ? res.profit.toFixed(2) : '0.00'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No reservations linked to this tour yet.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Placeholder for adding reservation to a specific tour
const AddReservationToTour = ({ onAddReservation, tours }) => {
    const [reservation, setReservation] = useState({
        id: '', // Will be generated
        creationDate: new Date().toISOString().split('T')[0],
        tourName: '', // Will be auto-filled if tour selected
        tourType: 'BUS',
        checkIn: '',
        checkOut: '',
        adults: 1,
        children: 0,
        tourists: [{ name: '', fatherName: '', familyName: '', id: '', address: '', city: '', postCode: '', mail: '', phone: '', numberOfTourists: 1, roomType: '' }], // Added roomType
        depositPaid: 'NO',
        depositAmount: 0,
        finalPaymentPaid: 'NO',
        finalPaymentAmount: 0,
        owedToHotel: 0,
        profit: 0,
        tourOperator: '',
        status: 'Pending',
        busTourId: '',
        customerId: '' // New customerId field
    });

    // Handle selecting a tour from the dropdown
    const handleTourSelect = (e) => {
        const selectedTourId = e.target.value;
        const selectedTour = tours.find(t => t.id === selectedTourId);
        if (selectedTour) {
            setReservation(prev => ({
                ...prev,
                busTourId: selectedTour.id,
                tourName: selectedTour.hotel, // Or tour.name if you add one
                checkIn: selectedTour.departureDate,
                checkOut: selectedTour.arrivalDate,
            }));
        } else {
            setReservation(prev => ({ ...prev, busTourId: '', tourName: '', checkIn: '', checkOut: '' }));
        }
    };

    const handleTouristChange = (index, e) => {
        const { name, value } = e.target;
        const updatedTourists = [...reservation.tourists];
        updatedTourists[index][name] = (name === 'numberOfTourists') ? parseInt(value) || 0 : value;
        setReservation(prev => ({ ...prev, tourists: updatedTourists }));
    };

    const addTourist = () => {
        setReservation(prev => ({ ...prev, tourists: [...prev.tourists, { name: '', fatherName: '', familyName: '', id: '', address: '', city: '', postCode: '', mail: '', phone: '', numberOfTourists: 1, roomType: '' }] })); // Added roomType
    };

    const removeTourist = (index) => {
        const updatedTourists = reservation.tourists.filter((_, i) => i !== index);
        setReservation(prev => ({ ...prev, tourists: updatedTourists }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddReservation(reservation);
    };

    const totalNights = useMemo(() => {
        if (reservation.checkIn && reservation.checkOut) {
            const start = new Date(reservation.checkIn);
            const end = new Date(reservation.checkOut);
            if (end > start) {
                const diffTime = Math.abs(end - start);
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }
        return 0;
    }, [reservation.checkIn, reservation.checkOut]);

    const calculateProfit = useMemo(() => {
        const price = parseFloat(reservation.finalPaymentAmount) || 0; // Assuming finalPaymentAmount is the 'Price' for tour reservations
        const owedToHotel = parseFloat(reservation.owedToHotel) || 0;
        const transportCost = parseFloat(reservation.transportCostApprox) || 0; // Assuming this field will be added

        // Profit = Price - Owed to Hotel (as per instruction for tours)
        return (price - owedToHotel).toFixed(2);
    }, [reservation.finalPaymentAmount, reservation.owedToHotel, reservation.transportCostApprox]);


    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Add Reservation to Tour</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6 border border-gray-200">
                <div className="border-b pb-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Tour Selection</h2>
                    <SelectField
                        label="Select Tour"
                        name="busTourId"
                        value={reservation.busTourId}
                        onChange={handleTourSelect}
                        options={[{ id: '', hotel: 'Select a Tour', departureDate: '' }, ...tours].map(tour => ({ value: tour.id, label: tour.hotel ? `${tour.id} - ${tour.hotel} (${tour.departureDate})` : tour.label }))}
                        required
                    />
                </div>
                <div className="border-b pb-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Reservation Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Creation Date" name="creationDate" type="date" value={reservation.creationDate} onChange={(e) => setReservation({ ...reservation, creationDate: e.target.value })} />
                        <InputField label="Reservation Number (Auto-fill or Edit)" name="id" value={reservation.id} onChange={(e) => setReservation({ ...reservation, id: e.target.value })} placeholder="e.g. DYT100101" />
                        <InputField label="Tour Name" name="tourName" value={reservation.tourName} readOnly disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                        <InputField label="Check-in Date" name="checkIn" type="date" value={reservation.checkIn} onChange={(e) => setReservation({ ...reservation, checkIn: e.target.value })} readOnly disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                        <InputField label="Check-out Date" name="checkOut" type="date" value={reservation.checkOut} onChange={(e) => setReservation({ ...reservation, checkOut: e.target.value })} readOnly disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Total Nights</label>
                            <p className="mt-1 p-2 h-10 flex items-center bg-gray-100 rounded-md border border-gray-300">{totalNights}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Tourist Information</h2>
                    {(reservation.tourists || []).map((tourist, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 relative border border-gray-200">
                            <h3 className="font-semibold text-gray-600 mb-2">Tourist {index + 1}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <InputField label="Name" name="name" value={tourist.name} onChange={(e) => handleTouristChange(index, e)} />
                                <InputField label="Family Name" name="familyName" value={tourist.familyName} onChange={(e) => handleTouristChange(index, e)} />
                                <InputField label="Father's Name" name="fatherName" value={tourist.fatherName} onChange={(e) => handleTouristChange(index, e)} />
                                <InputField label="ID" name="id" value={tourist.id} onChange={(e) => handleTouristChange(index, e)} />
                                <InputField label="Room Type" name="roomType" value={tourist.roomType || ''} onChange={(e) => handleTouristChange(index, e)} />
                                <InputField label="Number of Tourists (in this room)" name="numberOfTourists" type="number" value={tourist.numberOfTourists} onChange={(e) => handleTouristChange(index, e)} min="1" />
                            </div>
                            <button type="button" onClick={() => removeTourist(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-2xl font-bold p-1 rounded-full hover:bg-red-100">&times;</button>
                        </div>
                    ))}
                    <button type="button" onClick={addTourist} className="mt-2 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                        <PlusCircle size={18} /> Add another tourist
                    </button>
                </div>

                <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Financials</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <InputField label="Price (€)" name="finalPaymentAmount" type="number" value={reservation.finalPaymentAmount} onChange={(e) => setReservation({ ...reservation, finalPaymentAmount: parseFloat(e.target.value) || 0 })} min="0" />
                        <InputField label="Deposit (€)" name="depositAmount" type="number" value={reservation.depositAmount} onChange={(e) => setReservation({ ...reservation, depositAmount: parseFloat(e.target.value) || 0 })} min="0" />
                        <InputField label="Owed to Hotel (€)" name="owedToHotel" type="number" value={reservation.owedToHotel} onChange={(e) => setReservation({ ...reservation, owedToHotel: parseFloat(e.target.value) || 0 })} min="0" />
                        <InputField label="Transport Cost Approx. (€)" name="transportCostApprox" type="number" value={reservation.transportCostApprox || 0} onChange={(e) => setReservation({ ...reservation, transportCostApprox: parseFloat(e.target.value) || 0 })} min="0" />
                        <InputField label="Profit (€)" name="profit" type="number" value={calculateProfit} readOnly disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-md">Add Reservation to Tour</button>
                </div>
            </form>
        </div>
    );
};


// Component for creating new Insurance Policies
const AddInsurance = ({ onAddInsurance, insurances }) => {
    const [policy, setPolicy] = useState({
        id: '', // Auto-generated
        type: 'New Policy',
        policyDate: new Date().toISOString().split('T')[0],
        total: 0,
        commission: 0,
        validUntil: '',
        customer: { name: '', familyName: '', phone: '', id: '', address: '', city: '', postCode: '' }, // customer ID will be used for linking
        policyNumber: '', // Auto-generated if empty
        vehicleNumber: '',
        insuranceType: '',
        paid: 'NO',
        paidToInsurer: 'NO',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('customer.')) {
            const customerField = name.split('.')[1];
            setPolicy(prev => ({
                ...prev,
                customer: { ...prev.customer, [customerField]: value }
            }));
        } else {
            setPolicy(prev => ({
                ...prev,
                [name]: (name === 'total' || name === 'commission') ? parseFloat(value) || 0 : value
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddInsurance(policy);
        // Reset form
        setPolicy({
            id: '',
            type: 'New Policy',
            policyDate: new Date().toISOString().split('T')[0],
            total: 0,
            commission: 0,
            validUntil: '',
            customer: { name: '', familyName: '', phone: '', id: '', address: '', city: '', postCode: '' },
            policyNumber: '',
            vehicleNumber: '',
            insuranceType: '',
            paid: 'NO',
            paidToInsurer: 'NO',
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Add Insurance Policy</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6 border border-gray-200">
                <div className="border-b pb-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Policy Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SelectField
                            label="Policy Type"
                            name="type"
                            value={policy.type}
                            onChange={handleChange}
                            options={['Toll', 'Policy payment', 'New Policy', 'Assessment', 'Sticker']}
                            required
                        />
                        <InputField label="Policy Date" name="policyDate" type="date" value={policy.policyDate} onChange={handleChange} required />
                        <InputField label="Valid Until" name="validUntil" type="date" value={policy.validUntil} onChange={handleChange} required />
                        <InputField label="Total (€)" name="total" type="number" value={policy.total} onChange={handleChange} min="0" step="0.01" required />
                        <InputField label="Commission (€)" name="commission" type="number" value={policy.commission} onChange={handleChange} min="0" step="0.01" required />
                        <InputField label="Policy Number (Auto-generated)" name="policyNumber" value={policy.policyNumber} onChange={handleChange} placeholder="e.g. PN-XXXXXX" />
                        <InputField label="Vehicle Number (Optional)" name="vehicleNumber" value={policy.vehicleNumber} onChange={handleChange} />
                        <InputField label="Insurance Type" name="insuranceType" value={policy.insuranceType} onChange={handleChange} required />
                        <SelectField label="Paid by Customer" name="paid" value={policy.paid} onChange={handleChange} options={['YES', 'NO']} />
                        <SelectField label="Paid to Insurer" name="paidToInsurer" value={policy.paidToInsurer} onChange={handleChange} options={['YES', 'NO']} />
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Customer Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <InputField label="Name" name="customer.name" value={policy.customer.name} onChange={handleChange} required />
                        <InputField label="Family Name" name="customer.familyName" value={policy.customer.familyName} onChange={handleChange} required />
                        <InputField label="Phone" name="customer.phone" value={policy.customer.phone} onChange={handleChange} required />
                        <InputField label="ID" name="customer.id" value={policy.customer.id} onChange={handleChange} required />
                        <InputField label="Address" name="customer.address" value={policy.customer.address} onChange={handleChange} />
                        <InputField label="City" name="customer.city" value={policy.customer.city} onChange={handleChange} />
                        <InputField label="Post Code" name="customer.postCode" value={policy.customer.postCode} onChange={handleChange} />
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md">Add Insurance</button>
                </div>
            </form>
        </div>
    );
};

// Component for viewing Insurance Policies
const ViewInsurance = ({ insurances, onEdit, onAddPayment, onAddExpense }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState('none'); // 'none', 'validUntilAsc', 'validUntilDesc'
    const [filteredAndSortedInsurances, setFilteredAndSortedInsurances] = useState(insurances);

    // Effect to filter and sort insurances
    useEffect(() => {
        let currentData = [...insurances];

        // Filter
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            currentData = currentData.filter(item => {
                return (
                    (item.policyNumber && item.policyNumber.toLowerCase().includes(lowercasedFilter)) ||
                    (item.customer.name && item.customer.name.toLowerCase().includes(lowercasedFilter)) ||
                    (item.customer.familyName && item.customer.familyName.toLowerCase().includes(lowercasedFilter)) ||
                    (item.insuranceType && item.insuranceType.toLowerCase().includes(lowercasedFilter))
                );
            });
        }

        // Sort
        if (sortBy !== 'none') {
            currentData.sort((a, b) => {
                const dateA = new Date(a.validUntil);
                const dateB = new Date(b.validUntil);
                if (sortBy === 'validUntilAsc') {
                    return dateA.getTime() - dateB.getTime();
                } else if (sortBy === 'validUntilDesc') {
                    return dateB.getTime() - dateA.getTime();
                }
                return 0; // Should not happen with valid sortBy values
            });
        }

        setFilteredAndSortedInsurances(currentData);
    }, [searchTerm, insurances, sortBy]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">View Insurance Policies</h1>
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <input
                    type="text"
                    placeholder="Search policies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
                <div className="flex gap-2 items-center">
                    <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                        id="sort-by"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="none">None</option>
                        <option value="validUntilAsc">Valid Until (Asc)</option>
                        <option value="validUntilDesc">Valid Until (Desc)</option>
                    </select>
                </div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-md overflow-x-auto border border-gray-200">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Policy ID</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Policy #</th>
                            <th className="px-6 py-3">Valid Until</th>
                            <th className="px-6 py-3">Total</th>
                            <th className="px-6 py-3">Commission</th>
                            <th className="px-6 py-3">Paid</th>
                            <th className="px-6 py-3">Paid to Insurer</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedInsurances.length > 0 ? (
                            filteredAndSortedInsurances.map(policy => (
                                <tr key={policy.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{policy.id}</td>
                                    <td className="px-6 py-4">{policy.type}</td>
                                    <td className="px-6 py-4">{policy.customer.name} {policy.customer.familyName}</td>
                                    <td className="px-6 py-4">{policy.policyNumber}</td>
                                    <td className="px-6 py-4">{policy.validUntil}</td>
                                    <td className="px-6 py-4">€{policy.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="px-6 py-4">€{policy.commission.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="px-6 py-4">
                                        {policy.paid === 'YES' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                                    </td>
                                    <td className="px-6 py-4">
                                        {policy.paidToInsurer === 'YES' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                                    </td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => onEdit(policy)} className="text-blue-600 hover:text-blue-800 font-medium p-1 rounded-md hover:bg-blue-100 transition-colors" title="Edit Policy">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => onAddPayment(policy.id)} className="text-green-600 hover:text-green-800 font-medium p-1 rounded-md hover:bg-green-100 transition-colors" title="Add Payment">
                                            <DollarSign size={18} />
                                        </button>
                                        <button onClick={() => onAddExpense(policy.id)} className="text-red-600 hover:text-red-800 font-medium p-1 rounded-md hover:bg-red-100 transition-colors" title="Add Expense">
                                            <ArrowLeftRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="10" className="px-6 py-4 text-center text-gray-500">No insurance policies found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Component for Insurance Financial Reports
const InsuranceFinancialReports = ({ insurances, payments, expenses }) => {
    const [selectedMonth, setSelectedMonth] = useState('All Time');

    const availableMonths = useMemo(() => {
        const allDates = [
            ...insurances.map(i => i.policyDate),
            ...payments.filter(p => p.insuranceId).map(p => p.date),
            ...expenses.filter(e => e.insuranceId).map(e => e.date)
        ];
        const months = new Set(allDates.map(date => getMonthYear(date)));
        return ['All Time', ...Array.from(months).sort((a,b) => {
            if (a === 'All Time') return -1;
            if (b === 'All Time') return 1;
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
            return new Date(`1 ${monthA} 2000`).getMonth() - new Date(`1 ${monthB} 2000`).getMonth();
        })];
    }, [insurances, payments, expenses]);

    const { totalIncome, totalExpenses, netResult, sumToBePaidToInsurer, filteredInsurances, filteredPayments, filteredExpenses } = useMemo(() => { // Destructure filteredInsurances here
        const filteredInsurances = (selectedMonth === 'All Time')
            ? insurances
            : insurances.filter(i => getMonthYear(i.policyDate) === selectedMonth);

        const filteredPayments = (selectedMonth === 'All Time')
            ? payments.filter(p => p.insuranceId)
            : payments.filter(p => p.insuranceId && getMonthYear(p.date) === selectedMonth);

        const filteredExpenses = (selectedMonth === 'All Time')
            ? expenses.filter(e => e.insuranceId)
            : expenses.filter(e => e.insuranceId && getMonthYear(e.date) === selectedMonth);

        // Calculate Total Income (from commissions, assuming commissions are the direct income for broker)
        const totalIncome = filteredInsurances.reduce((sum, policy) => sum + (policy.commission || 0), 0);

        // Calculate Total Expenses (only those associated with insurance policies)
        const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        // Profit = Total Income (Commissions) - Total Expenses
        const netResult = totalIncome - totalExpenses;

        // Calculate Total Unpaid to Insurer
        const unpaidToInsurerPolicies = filteredInsurances.filter(policy => policy.paidToInsurer === 'NO');
        const sumToBePaidToInsurer = unpaidToInsurerPolicies.reduce((sum, policy) => sum + ((policy.total || 0) - (policy.commission || 0)), 0);

        return { totalIncome, totalExpenses, netResult, sumToBePaidToInsurer, filteredInsurances, filteredPayments, filteredExpenses };
    }, [selectedMonth, insurances, payments, expenses]);


    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Insurance Financial Reports</h1>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <label htmlFor="month-select" className="text-sm font-medium text-gray-700">Report for:</label>
                    <select
                        id="month-select"
                        name="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                    >
                        {availableMonths.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>

            {/* Insurance Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Income (Commissions)" value={`€${totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<CreditCard className="h-6 w-6 text-white"/>} color="bg-teal-500" />
                <StatCard title="Total Expenses" value={`€${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ArrowLeftRight className="h-6 w-6 text-white"/>} color="bg-rose-500" />
                <StatCard title="Net Result (Profit)" value={`€${netResult.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<DollarSign className="h-6 w-6 text-white"/>} color={netResult >= 0 ? "bg-green-500" : "bg-orange-500"} />
                <StatCard title="Sum to be Paid to Insurer" value={`€${sumToBePaidToInsurer.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<FileText className="h-6 w-6 text-white"/>} color="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Income (Commissions) Details */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-teal-700">Income Details (Commissions)</h2>
                    <div className="h-96 overflow-y-auto mb-4 border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Policy Date</th>
                                    <th className="px-4 py-2">Policy #</th>
                                    <th className="px-4 py-2">Customer</th>
                                    <th className="px-4 py-2 text-right">Commission</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInsurances.length > 0 ? (
                                    filteredInsurances.map(p => (
                                        <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-4 py-2">{p.policyDate}</td>
                                            <td className="px-4 py-2">{p.policyNumber}</td>
                                            <td className="px-4 py-2">{p.customer.name} {p.customer.familyName}</td>
                                            <td className="px-4 py-2 text-right font-medium text-teal-600">€{p.commission.toFixed(2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No income (commissions) found for this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Expense Details (Insurance-related) */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-red-700">Expense Details (Insurance-related)</h2>
                    <div className="h-96 overflow-y-auto mb-4 border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Reason</th>
                                    <th className="px-4 py-2">Associated Policy</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.length > 0 ? (
                                    filteredExpenses.map(e => (
                                        <tr key={e.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-4 py-2">{e.date}</td>
                                            <td className="px-4 py-2">{e.reason}</td>
                                            <td className="px-4 py-2">{e.insuranceId || 'N/A'}</td>
                                            <td className="px-4 py-2 text-right font-medium text-red-600">€{e.amount.toFixed(2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No insurance-related expenses found for this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-center">
                <button className="bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50" disabled>Generate PDF Report (Coming Soon)</button>
            </div>
        </div>
    );
};

// Component for viewing all customers
const Customers = ({ customers, reservations, insurances, onEditCustomer, onViewCustomer }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredCustomers, setFilteredCustomers] = useState(customers);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = customers.filter(customer => {
            return (
                (customer.name && customer.name.toLowerCase().includes(lowercasedFilter)) ||
                (customer.familyName && customer.familyName.toLowerCase().includes(lowercasedFilter)) ||
                (customer.id && customer.id.toLowerCase().includes(lowercasedFilter)) ||
                (customer.phone && customer.phone.includes(lowercasedFilter))
            );
        });
        setFilteredCustomers(filteredData);
    }, [searchTerm, customers]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Customer List</h1>
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <input
                    type="text"
                    placeholder="Search customers by name, ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
                {/* Add Customer button - placeholder */}
                <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md" disabled>Add New Customer</button>
            </div>

            <div className="bg-white p-2 rounded-lg shadow-md overflow-x-auto border border-gray-200">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Customer ID</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Phone</th>
                            <th className="px-6 py-3">Address</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map(customer => (
                                <tr key={customer.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{customer.id}</td>
                                    <td className="px-6 py-4">{customer.name} {customer.familyName}</td>
                                    <td className="px-6 py-4">{customer.phone}</td>
                                    <td className="px-6 py-4">{customer.address}, {customer.city}</td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => onViewCustomer(customer)} className="text-blue-600 hover:text-blue-800 font-medium p-1 rounded-md hover:bg-blue-100 transition-colors" title="View Details">
                                            <Eye size={18} />
                                        </button>
                                        <button onClick={() => onEditCustomer(customer)} className="text-green-600 hover:text-green-800 font-medium p-1 rounded-md hover:bg-green-100 transition-colors" title="Edit Customer" disabled>
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No customers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Customer Detail Modal Component
const CustomerDetailModal = ({ isOpen, onClose, customer, reservations, insurances }) => {
    if (!isOpen || !customer) return null;

    const linkedReservations = reservations.filter(res => res.customerId === customer.id);
    const linkedInsurances = insurances.filter(ins => ins.customer.id === customer.id);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-4xl relative">
                <div className="p-6">
                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Customer Details: {customer.name} {customer.familyName}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-200">&times;</button>
                    </div>

                    <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="border-b pb-4">
                            <h3 className="text-xl font-semibold mb-2 text-gray-700">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-sm">
                                <p><strong>ID:</strong> {customer.id}</p>
                                <p><strong>Full Name:</strong> {customer.name} {customer.fatherName} {customer.familyName}</p>
                                <p><strong>Phone:</strong> {customer.phone}</p>
                                <p><strong>Email:</strong> {customer.email}</p>
                                <p><strong>Address:</strong> {customer.address}, {customer.city}, {customer.postCode}</p>
                            </div>
                        </div>

                        {/* Linked Reservations */}
                        <div className="border-b pb-4">
                            <h3 className="text-xl font-semibold mb-2 text-gray-700">Linked Reservations</h3>
                            {linkedReservations.length === 0 ? (
                                <p className="text-gray-500 text-sm">No reservations found for this customer.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2">Res. #</th>
                                                <th className="px-4 py-2">Tour Name</th>
                                                <th className="px-4 py-2">Dates</th>
                                                <th className="px-4 py-2">Status</th>
                                                <th className="px-4 py-2 text-right">Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {linkedReservations.map(res => (
                                                <tr key={res.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-4 py-2">{res.id}</td>
                                                    <td className="px-4 py-2">{res.tourName}</td>
                                                    <td className="px-4 py-2">{res.checkIn} - {res.checkOut}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            res.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                            res.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            res.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {res.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">€{res.profit?.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Linked Insurances */}
                        <div className="border-b pb-4">
                            <h3 className="text-xl font-semibold mb-2 text-gray-700">Linked Insurance Policies</h3>
                            {linkedInsurances.length === 0 ? (
                                <p className="text-gray-500 text-sm">No insurance policies found for this customer.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2">Policy ID</th>
                                                <th className="px-4 py-2">Type</th>
                                                <th className="px-4 py-2">Policy #</th>
                                                <th className="px-4 py-2">Valid Until</th>
                                                <th className="px-4 py-2">Total</th>
                                                <th className="px-4 py-2">Commission</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {linkedInsurances.map(ins => (
                                                <tr key={ins.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-4 py-2">{ins.id}</td>
                                                    <td className="px-4 py-2">{ins.type}</td>
                                                    <td className="px-4 py-2">{ins.policyNumber}</td>
                                                    <td className="px-4 py-2">{ins.validUntil}</td>
                                                    <td className="px-4 py-2">€{ins.total.toFixed(2)}</td>
                                                    <td className="px-4 py-2">€{ins.commission.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Customer Balance and Payments (Placeholder for now) */}
                        <div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-700">Financial Overview</h3>
                            <p className="text-gray-500 text-sm">Customer balance and payment details will be displayed here in a future phase.</p>
                            <div className="flex flex-wrap gap-3 mt-3">
                                <button className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors shadow-sm disabled:opacity-50" disabled>View All Payments</button>
                                <button className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors shadow-sm disabled:opacity-50" disabled>View All Expenses</button>
                                <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50" disabled>Generate Statement</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// NEW: EditTourModal Component
const EditTourModal = ({ isOpen, onClose, tour, onUpdate }) => {
    const [tourData, setTourData] = useState(tour);
    const [totalDays, setTotalDays] = useState(0);

    useEffect(() => {
        setTourData(tour);
    }, [tour]);

    useEffect(() => {
        if (tourData?.departureDate && tourData?.arrivalDate) {
            const start = new Date(tourData.departureDate);
            const end = new Date(tourData.arrivalDate);
            if (end >= start) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setTotalDays(diffDays);
            } else {
                setTotalDays(0);
            }
        }
    }, [tourData?.departureDate, tourData?.arrivalDate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTourData(prev => ({ ...prev, [name]: (name === 'maxPassengers' || name === 'nights') ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(tourData);
        onClose();
    };

    if (!isOpen || !tourData) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-2xl relative">
                <div className="p-6">
                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Edit Tour: {tour.id}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-200">&times;</button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Tour ID" name="id" value={tourData.id} readOnly disabled />
                            <InputField label="Departure Date" name="departureDate" type="date" value={tourData.departureDate} onChange={handleChange} required />
                            <InputField label="Arrival Date" name="arrivalDate" type="date" value={tourData.arrivalDate} onChange={handleChange} required />
                            <InputField label="Nights" name="nights" type="number" value={tourData.nights} onChange={handleChange} min="0" required />
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Days Including Travel</label>
                                <p className="mt-1 p-2 h-10 flex items-center bg-gray-100 rounded-md border border-gray-300">{totalDays}</p>
                            </div>
                            <InputField label="Transport Company" name="transportCompany" value={tourData.transportCompany} onChange={handleChange} required />
                            <InputField label="Hotel" name="hotel" value={tourData.hotel} onChange={handleChange} required />
                            <InputField label="Max Passengers" name="maxPassengers" type="number" value={tourData.maxPassengers} onChange={handleChange} min="1" required />
                        </div>
                        <div className="flex justify-end mt-6">
                            <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


// Main App component
const App = () => {
    // State for live data from Firebase
    const [reservations, setReservations] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [tours, setTours] = useState([]);
    const [insurances, setInsurances] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchData = (path, setter, sortFn = null) => {
            const dataRef = ref(db, path);
            onValue(dataRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    let dataList = Object.keys(data).map(key => ({ ...data[key], id: key }));
                    if (sortFn) {
                        dataList.sort(sortFn);
                    }
                    setter(dataList);
                } else {
                    setter([]);
                }
                setIsLoading(false);
            });
        };

        fetchData('reservations', setReservations);
        fetchData('payments', setPayments, (a, b) => new Date(b.date) - new Date(a.date));
        fetchData('expenses', setExpenses, (a, b) => new Date(b.date) - new Date(a.date));
        fetchData('tours', setTours);
        fetchData('insurances', setInsurances);
        fetchData('customers', setCustomers);

    }, []);


    // UI state
    const [activePage, setActivePage] = useState('Dashboard');
    // State to hold the tourId for pre-filling payment/expense forms
    const [prefillReservationIdForPayment, setPrefillReservationIdForPayment] = useState('');
    const [prefillReservationIdForExpense, setPrefillReservationIdForExpense] = useState('');

    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // State for editing reservations
    const [editingReservation, setEditingReservation] = useState(null);
    const isEditModalOpen = !!editingReservation;

    // State for editing insurance policies (placeholder)
    const [editingInsurance, setEditingInsurance] = useState(null);
    const isEditInsuranceModalOpen = !!editingInsurance;

    // NEW: State for editing tours
    const [editingTour, setEditingTour] = useState(null);
    const isEditTourModalOpen = !!editingTour;

    // State for viewing/editing customer details
    const [viewingCustomer, setViewingCustomer] = useState(null);
    const isCustomerDetailModalOpen = !!viewingCustomer;

    // State for collapsible menu sections
    const [isTravelManagementOpen, setIsTravelManagementOpen] = useState(true);
    const [isInsuranceManagementOpen, setIsInsuranceManagementOpen] = useState(true);
    const [isCustomerManagementOpen, setIsCustomerManagementOpen] = useState(true);


    // --- CRUD functions for Firebase ---
    const addReservation = async (newReservation) => {
        try {
            let reservationId = newReservation.id;
            if (!reservationId) {
                const lastId = reservations.length > 0 ? Math.max(...reservations.map(res => parseInt(res.id.replace('DYT', '') || 0))) : 100100;
                reservationId = `DYT${lastId + 1}`;
            }

            const finalAmount = parseFloat(newReservation.finalPaymentAmount) || 0;
            const owedToHotel = parseFloat(newReservation.owedToHotel) || 0;
            const expensesForThisReservation = expenses.filter(e => e.reservationId === reservationId).reduce((sum, e) => sum + e.amount, 0);
            const calculatedProfit = finalAmount - owedToHotel - expensesForThisReservation;

            const reservationToAdd = {
                ...newReservation,
                id: reservationId, // Ensure the ID is part of the object
                profit: calculatedProfit,
            };
            
            await set(ref(db, `reservations/${reservationId}`), reservationToAdd);
            console.log("Reservation added to Firebase");
            setActivePage('View Reservations');
        } catch (error) {
            console.error("Error adding reservation: ", error);
        }
    };

    const addTour = async (newTour) => {
        try {
            let tourId = newTour.id;
            if (!tourId) {
                 const lastId = tours.length > 0 ? Math.max(...tours.map(t => parseInt(t.id.replace('DYTAL', '') || 0))) : 0;
                 tourId = `DYTAL${(lastId + 1).toString().padStart(3, '0')}`;
            }
            const tourToAdd = { ...newTour, id: tourId };
            await set(ref(db, `tours/${tourId}`), tourToAdd);
            console.log("Tour added to Firebase");
            setActivePage('View Tours');
        } catch (error) {
            console.error("Error adding tour: ", error);
        }
    };

    const addInsurance = async (newPolicy) => {
       try {
            let policyId = newPolicy.id;
            if (!policyId) {
                 const lastId = insurances.length > 0 ? Math.max(...insurances.map(ins => parseInt(ins.id.replace('INS', '') || 0))) : 0;
                 policyId = `INS${(lastId + 1).toString().padStart(3, '0')}`;
            }
            let policyNum = newPolicy.policyNumber || `PN-${Date.now().toString().slice(-6)}`;

            const policyToAdd = { ...newPolicy, id: policyId, policyNumber: policyNum };
            await set(ref(db, `insurances/${policyId}`), policyToAdd);
            console.log("Insurance added to Firebase");
            setActivePage('View Insurance');
        } catch (error) {
            console.error("Error adding insurance policy: ", error);
        }
    };


    const addPayment = async (newPayment) => {
        try {
            await push(ref(db, 'payments'), newPayment);
            console.log("Payment added to Firebase");
        } catch (error) {
            console.error("Error adding payment: ", error);
        }
    };

    const addExpense = async (newExpense) => {
        try {
            await push(ref(db, 'expenses'), newExpense);
            console.log("Expense added to Firebase");
        } catch (error) {
            console.error("Error adding expense: ", error);
        }
    };

    const handleEditReservation = (reservation) => {
        setEditingReservation(reservation);
    };

    const handleUpdateReservation = async (updatedReservation) => {
        try {
            const updateRef = ref(db, `reservations/${updatedReservation.id}`);
            await update(updateRef, updatedReservation);
            console.log("Reservation updated in Firebase");
        } catch(error) {
            console.error("Error updating reservation: ", error);
        }
    };

    const handleDeleteReservation = async (idToDelete) => {
        if (window.confirm(`Are you sure you want to delete reservation ${idToDelete}?`)) {
            try {
                await remove(ref(db, `reservations/${idToDelete}`));
                console.log("Reservation deleted from Firebase");
            } catch (error) {
                console.error("Error deleting reservation: ", error);
            }
        }
    };

    const handleCloseEditModal = () => {
        setEditingReservation(null);
    };

    // Placeholder for Insurance Edit/Update/Delete (will be fully implemented later if needed)
    const handleEditInsurance = (policy) => {
        // This will require an EditInsuranceModal similar to the one for reservations.
        // For now, it logs to console.
        console.log("Edit Insurance (not implemented):", policy);
    };

    const handleAddPaymentForInsurance = (insuranceId) => {
        setActivePage('Add Payment');
        // Pre-filling logic is handled in the AddPayment component itself now.
        console.log(`Navigating to Add Payment for Insurance ID: ${insuranceId}`);
    };

    const handleAddExpenseForInsurance = (insuranceId) => {
        setActivePage('Add Expense');
        console.log(`Navigating to Add Expense for Insurance ID: ${insuranceId}`);
    };

    // --- NEW: Handlers for Add Payment/Expense from Tour Details ---
    const handleAddPaymentForTour = (tourId) => {
        setPrefillReservationIdForPayment(tourId); // Set the tour ID to pre-fill
        setActivePage('Add Payment'); // Navigate to Add Payment page
    };

    const handleAddExpenseForTour = (tourId) => {
        setPrefillReservationIdForExpense(tourId); // Set the tour ID to pre-fill
        setActivePage('Add Expense'); // Navigate to Add Expense page
    };

    // NEW: Handlers for Tour editing
    const handleEditTour = (tour) => {
        setEditingTour(tour); // Set the tour to be edited
    };

    const handleUpdateTour = async (updatedTour) => {
         try {
            const updateRef = ref(db, `tours/${updatedTour.id}`);
            await update(updateRef, updatedTour);
            console.log("Tour updated in Firebase");
        } catch(error) {
            console.error("Error updating tour: ", error);
        }
    };

    const handleCloseEditTourModal = () => {
        setEditingTour(null);
    };

    // Customer related handlers
    const handleViewCustomer = (customer) => {
        setViewingCustomer(customer);
    };

    const handleCloseCustomerDetailModal = () => {
        setViewingCustomer(null);
    };

    const handleEditCustomer = (customer) => {
        // setEditingCustomer(customer); // Future implementation
        console.log("Edit Customer (placeholder):", customer);
    };


    // Render the active page component based on `activePage` state
    const renderPage = () => {
        if (isLoading) {
            return <div className="p-8 text-center text-gray-700"><h1>Loading data from Firebase...</h1></div>;
        }
        switch (activePage) {
            case 'Dashboard': return <Dashboard reservations={reservations} payments={payments} expenses={expenses} tours={tours} insurances={insurances} />;
            case 'Create Reservation': return <CreateReservation onAddReservation={addReservation} expenses={expenses} />;
            case 'View Reservations': return <ViewReservations reservations={reservations} onEdit={handleEditReservation} onDelete={handleDeleteReservation} />;
            // MODIFIED: Pass prefillReservationId to AddPayment and AddExpense
            case 'Add Payment': return <AddPayment onAddPayment={addPayment} payments={payments} reservations={reservations} insurances={insurances} prefillReservationId={prefillReservationIdForPayment} />;
            case 'Add Expense': return <AddExpense onAddExpense={addExpense} expenses={expenses} reservations={reservations} insurances={insurances} prefillReservationId={prefillReservationIdForExpense} />;
            case 'Financial Reports': return <FinancialReports payments={payments} expenses={expenses} />;
            case 'Create Vouchers': return <CreateVouchers />;
            // Bus Tour components
            case 'Create Tour': return <CreateTour onAddTour={addTour} tours={tours} />;
            // MODIFIED: Pass new handlers to ViewTours
            case 'View Tours': return <ViewTours tours={tours} reservations={reservations} onAddPaymentForTour={handleAddPaymentForTour} onAddExpenseForTour={handleAddExpenseForTour} onEditTour={handleEditTour} />;
            case 'Add Reservation to Tour': return <AddReservationToTour onAddReservation={addReservation} tours={tours} />;
            // Insurance Management components
            case 'Add Insurance': return <AddInsurance onAddInsurance={addInsurance} insurances={insurances} />;
            case 'View Insurance': return <ViewInsurance insurances={insurances} onEdit={handleEditInsurance} onAddPayment={handleAddPaymentForInsurance} onAddExpense={handleAddExpenseForInsurance} />;
            case 'Insurance Financial Reports': return <InsuranceFinancialReports insurances={insurances} payments={payments} expenses={expenses} />;
            // Customer Management components
            case 'View All Customers': return <Customers customers={customers} reservations={reservations} insurances={insurances} onEditCustomer={handleEditCustomer} onViewCustomer={handleViewCustomer} />;

            case 'Travel Management Overview': return <div className="p-8 bg-gray-100 min-h-screen"><h1 className="text-3xl font-bold text-gray-800">Travel Management Overview (Coming Soon)</h1></div>;
            case 'Insurance Management Overview': return <div className="p-8 bg-gray-100 min-h-screen"><h1 className="text-3xl font-bold text-gray-800">Insurance Management Overview (Coming Soon)</h1></div>;
            default: return <Dashboard reservations={reservations} payments={payments} expenses={expenses} tours={tours} insurances={insurances} />;
        }
    };

    // NavItem component for sidebar links
    const NavItem = ({ icon, label }) => (
        <li className={`flex items-center p-3 my-1 cursor-pointer rounded-lg transition-colors ${activePage === label ? 'bg-blue-700 text-amber-400 shadow-lg' : 'text-amber-400 hover:bg-blue-700 hover:text-white'}`}
            onClick={() => { setActivePage(label); setSidebarOpen(false); }}>
            {React.cloneElement(icon, { className: 'h-6 w-6 mr-3' })}
            <span className="font-medium">{label}</span>
        </li>
    );

    // Collapsible Nav Section component
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

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Hamburger menu button for mobile */}
            <button
                className="lg:hidden fixed top-4 left-4 z-30 bg-blue-900 p-2 rounded-md shadow-md text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle Navigation"
            >
                {isSidebarOpen ? '✕' : '☰'}
            </button>

            {/* Sidebar */}
            <aside className={`fixed lg:relative lg:translate-x-0 inset-y-0 left-0 w-64 bg-blue-900 shadow-xl z-20 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
                {/* Logo and Title Section in Sidebar */}
                <div className="p-4 border-b border-blue-700 flex items-center justify-center">
                    {/* Crown SVG Logo */}
                    <Crown className="h-9 w-9 text-amber-400 mr-2" />
                    <h1 className="text-2xl font-extrabold text-amber-400">Ananov BMS</h1>
                </div>
                <nav className="p-4">
                    <ul>
                        {/* Dashboard */}
                        <NavItem icon={<Home />} label="Dashboard" onClick={() => setActivePage('Dashboard')} />

                        {/* Travel Management Section */}
                        <NavSection
                            title="Travel Management"
                            icon={<Briefcase />}
                            isOpen={isTravelManagementOpen}
                            toggleOpen={() => setIsTravelManagementOpen(!isTravelManagementOpen)}
                        >
                            <NavItem icon={<PlusCircle />} label="Create Reservation" />
                            <NavItem icon={<Eye />} label="View Reservations" />
                            <NavItem icon={<DollarSign />} label="Add Payment" />
                            <NavItem icon={<ArrowLeftRight />} label="Add Expense" />
                            <NavItem icon={<TrendingUp />} label="Financial Reports" />
                            <NavItem icon={<FileText />} label="Create Vouchers" />
                            <hr className="my-2 border-blue-700/50" /> {/* Separator */}
                            <h3 className="text-sm font-semibold text-amber-400/80 px-3 py-1">Bus Tours & Holidays</h3>
                            <NavItem icon={<Bus />} label="Create Tour" onClick={() => setActivePage('Create Tour')} />
                            <NavItem icon={<CalendarCheck />} label="View Tours" onClick={() => setActivePage('View Tours')} />
                            <NavItem icon={<UserPlus />} label="Add Reservation to Tour" onClick={() => setActivePage('Add Reservation to Tour')} />
                            {/* Placeholder for new Travel sub-sections */}
                            <NavItem icon={<Briefcase />} label="Travel Management Overview" />
                        </NavSection>

                        {/* Insurance Management Section */}
                        <NavSection
                            title="Insurance Management"
                            icon={<Shield />}
                            isOpen={isInsuranceManagementOpen}
                            toggleOpen={() => setIsInsuranceManagementOpen(!isInsuranceManagementOpen)}
                        >
                            <NavItem icon={<PlusCircle />} label="Add Insurance" onClick={() => setActivePage('Add Insurance')} />
                            <NavItem icon={<Eye />} label="View Insurance" onClick={() => setActivePage('View Insurance')} />
                            <NavItem icon={<TrendingUp />} label="Insurance Financial Reports" onClick={() => setActivePage('Insurance Financial Reports')} />
                            {/* Placeholder for new Insurance sub-sections */}
                            <NavItem icon={<Briefcase />} label="Insurance Management Overview" />
                        </NavSection>

                        {/* Customer Management Section */}
                        <NavSection
                            title="Customer Management"
                            icon={<UserRound />}
                            isOpen={isCustomerManagementOpen}
                            toggleOpen={() => setIsCustomerManagementOpen(!isCustomerManagementOpen)}
                        >
                            <NavItem icon={<Users />} label="View All Customers" onClick={() => setActivePage('View All Customers')} />
                            {/* Placeholder for other customer related items */}
                            {/* <NavItem icon={<PlusCircle />} label="Add New Customer" onClick={() => setActivePage('Add New Customer')} /> */}
                        </NavSection>
                    </ul>
                </nav>
            </aside>

            {/* Main content area */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Fixed Header Bar */}
                <header className="bg-blue-900 p-4 shadow-md border-b border-blue-700 flex items-center justify-between lg:justify-start sticky top-0 z-10">
                    <div className="flex items-center">
                        {/* Crown SVG Logo */}
                        <Crown className="h-8 w-8 text-amber-400 mr-3" />
                        <h1 className="text-2xl font-bold text-amber-400">Ananov Business Management Systems</h1>
                    </div>
                    {/* The mobile menu button is on the far left */}
                </header>

                {/* Content of the active page */}
                {renderPage()}
            </main>

            {/* Modals */}
            <EditReservationModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                reservation={editingReservation}
                onUpdate={handleUpdateReservation}
            />
            {/* Placeholder for Edit Insurance Modal */}
            {/* {isEditInsuranceModalOpen && (
                <EditInsuranceModal
                    isOpen={isEditInsuranceModalOpen}
                    onClose={handleCloseEditInsuranceModal}
                    policy={editingInsurance}
                    onUpdate={handleUpdateInsurance}
                />
            )} */}
            {/* NEW: EditTourModal */}
            <EditTourModal
                isOpen={isEditTourModalOpen}
                onClose={handleCloseEditTourModal}
                tour={editingTour}
                onUpdate={handleUpdateTour}
            />
            <CustomerDetailModal
                isOpen={isCustomerDetailModalOpen}
                onClose={handleCloseCustomerDetailModal}
                customer={viewingCustomer}
                reservations={reservations}
                insurances={insurances}
            />
        </div>
    );
};

export default App;
