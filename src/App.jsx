import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Home, PlusCircle, Eye, DollarSign, TrendingUp, FileText, ArrowLeftRight, Hotel, Users, ChevronsRight, ChevronsLeft, Edit } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';

const getMonthYear = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
};

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
        <div className={`p-3 rounded-full mr-4 ${color}`}>{icon}</div>
        <div><p className="text-sm text-gray-500">{title}</p><p className="text-2xl font-bold">{value}</p></div>
    </div>
);

const Dashboard = ({ reservations, payments, expenses }) => {
    const totalReservations = reservations.length;
    const reservationsByMonth = reservations.reduce((acc, res) => { const month = getMonthYear(res.creationDate); acc[month] = (acc[month] || 0) + 1; return acc; }, {});
    const reservationsByMonthData = Object.keys(reservationsByMonth).map(key => ({ name: key, Reservations: reservationsByMonth[key] }));
    const totalProfit = reservations.filter(r => r.status === 'Confirmed' || r.status === 'Past').reduce((sum, res) => sum + res.profit, 0);
    const profitByMonth = reservations.filter(r => r.status === 'Confirmed' || r.status === 'Past').reduce((acc, res) => { const month = getMonthYear(res.creationDate); acc[month] = (acc[month] || 0) + res.profit; return acc; }, {});
    const profitByMonthData = Object.keys(profitByMonth).map(key => ({ name: key, Profit: profitByMonth[key] }));
    const confirmedAndPastReservations = reservations.filter(r=> r.status === 'Confirmed' || r.status === 'Past');
    const avgProfitPerReservation = confirmedAndPastReservations.length > 0 ? (totalProfit / confirmedAndPastReservations.length).toFixed(2) : 0;
    const totalNights = reservations.reduce((sum, res) => { const checkIn = new Date(res.checkIn); const checkOut = new Date(res.checkOut); if (!checkIn.getTime() || !checkOut.getTime() || checkOut <= checkIn) return sum; const diffTime = Math.abs(checkOut - checkIn); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); return sum + diffDays; }, 0);
    const avgStayPerReservation = totalReservations > 0 ? (totalNights / totalReservations).toFixed(1) : 0;
    const reservationsByStatus = reservations.reduce((acc, res) => { acc[res.status] = (acc[res.status] || 0) + 1; return acc; }, {});
    const statusData = Object.keys(reservationsByStatus).map(key => ({ name: key, value: reservationsByStatus[key] }));
    const STATUS_COLORS = { 'Confirmed': '#4caf50', 'Pending': '#ff9800', 'Cancelled': '#f44336', 'Past': '#607d8b' };
    const operatorBreakdown = reservations.reduce((acc, res) => { acc[res.tourOperator] = (acc[res.tourOperator] || 0) + 1; return acc; }, {});
    const operatorData = Object.keys(operatorBreakdown).map(key => ({ name: key, value: operatorBreakdown[key] }));
    const OPERATOR_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalVatPaid = expenses.reduce((sum, exp) => sum + (exp.amount * (exp.vat / 100)), 0);
    const totalVatCollected = payments.reduce((sum, p) => sum + (p.amount / (1 + p.vat/100)) * (p.vat/100), 0);
    const totalVat = totalVatCollected - totalVatPaid;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Total Reservations" value={totalReservations} icon={<Users className="h-6 w-6 text-white"/>} color="bg-blue-500" />
                <StatCard title="Total Profit" value={`€${totalProfit.toLocaleString()}`} icon={<TrendingUp className="h-6 w-6 text-white"/>} color="bg-green-500" />
                <StatCard title="Avg. Profit / Res." value={`€${avgProfitPerReservation}`} icon={<DollarSign className="h-6 w-6 text-white"/>} color="bg-yellow-500" />
                <StatCard title="Avg. Stay / Res." value={`${avgStayPerReservation} days`} icon={<Hotel className="h-6 w-6 text-white"/>} color="bg-indigo-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                 <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Reservations by Month</h2>
                    <ResponsiveContainer width="100%" height={300}><BarChart data={reservationsByMonthData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Reservations" fill="#3b82f6" /></BarChart></ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Profit by Month</h2>
                    <ResponsiveContainer width="100%" height={300}><LineChart data={profitByMonthData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => `€${value.toLocaleString()}`} /><Legend /><Line type="monotone" dataKey="Profit" stroke="#22c55e" strokeWidth={2} /></LineChart></ResponsiveContainer>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Reservations by Status</h2>
                    <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>{statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Tour Operator Breakdown</h2>
                    <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={operatorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>{operatorData.map((entry, index) => <Cell key={`cell-${index}`} fill={OPERATOR_COLORS[index % OPERATOR_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Total Income" value={`€${totalIncome.toLocaleString()}`} icon={<TrendingUp className="h-6 w-6 text-white"/>} color="bg-sky-500" />
                <StatCard title="Total Expenses" value={`€${totalExpenses.toLocaleString()}`} icon={<ArrowLeftRight className="h-6 w-6 text-white"/>} color="bg-rose-500" />
                <StatCard title="Total VAT" value={`€${totalVat.toFixed(2).toLocaleString()}`} icon={<FileText className="h-6 w-6 text-white"/>} color="bg-amber-500" />
            </div>
        </div>
    );
};

const CreateReservation = ({ onAddReservation }) => {
    const [reservation, setReservation] = useState({ id: '', creationDate: new Date().toISOString().split('T')[0], tourName: '', tourType: 'BUS', checkIn: '', checkOut: '', adults: 1, children: 0, tourists: [{ name: '', fatherName: '', familyName: '', id: '', address: '', city: '', postCode: '', mail: '', phone: '' }], depositPaid: 'NO', depositAmount: 0, finalPaymentPaid: 'NO', finalPaymentAmount: 0, owedToHotel: 0, profit: 0, tourOperator: '', status: 'Pending' });
    const [totalNights, setTotalNights] = useState(0);
    useEffect(() => { if (reservation.checkIn && reservation.checkOut) { const start = new Date(reservation.checkIn); const end = new Date(reservation.checkOut); if (end > start) { const diffTime = Math.abs(end - start); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); setTotalNights(diffDays); } else { setTotalNights(0); } } }, [reservation.checkIn, reservation.checkOut]);
    const handleTouristChange = (index, e) => { const { name, value } = e.target; const updatedTourists = [...reservation.tourists]; updatedTourists[index][name] = value; setReservation(prev => ({...prev, tourists: updatedTourists})); };
    const addTourist = () => { setReservation(prev => ({...prev, tourists: [...prev.tourists, { name: '', fatherName: '', familyName: '', id: '', address: '', city: '', postCode: '', mail: '', phone: '' }]})); };
    const removeTourist = (index) => { const updatedTourists = reservation.tourists.filter((_, i) => i !== index); setReservation(prev => ({...prev, tourists: updatedTourists})); };
    const handleSubmit = (e) => { e.preventDefault(); onAddReservation(reservation); };
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Create Reservation</h1>
            <ReservationForm reservationData={reservation} onReservationDataChange={setReservation} onSubmit={handleSubmit} totalNights={totalNights} onAddTourist={addTourist} onRemoveTourist={removeTourist} onTouristChange={handleTouristChange} buttonText="Create Reservation" />
        </div>
    );
};

const ViewReservations = ({ reservations, onEdit }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredReservations, setFilteredReservations] = useState(reservations);
    useEffect(() => { const lowercasedFilter = searchTerm.toLowerCase(); const filteredData = reservations.filter(item => { return Object.keys(item).some(key => { if(typeof item[key] === 'string') return item[key].toLowerCase().includes(lowercasedFilter); if(key === 'tourists' && Array.isArray(item[key])) return item[key].some(t => t.name.toLowerCase().includes(lowercasedFilter) || t.familyName.toLowerCase().includes(lowercasedFilter)); return false; }); }); setFilteredReservations(filteredData); }, [searchTerm, reservations]);
    const exportToCsv = () => { const headers = ["ID", "Creation Date", "Tour Name", "Check-in", "Check-out", "Status", "Profit"]; const rows = filteredReservations.map(res => [res.id, res.creationDate, res.tourName, res.checkIn, res.checkOut, res.status, res.profit].join(',')); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n'); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "reservations.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link); };
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">View Reservations</h1>
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <input type="text" placeholder="Search reservations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-md" />
                <div><button onClick={exportToCsv} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors mr-2">Export CSV</button><button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400" disabled>Import CSV</button></div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">Res. #</th><th className="px-6 py-3">Tour</th><th className="px-6 py-3">Lead Guest</th><th className="px-6 py-3">Dates</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Profit</th><th className="px-6 py-3">Actions</th></tr></thead>
                    <tbody>
                        {filteredReservations.map(res => (
                            <tr key={res.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{res.id}</td><td className="px-6 py-4">{res.tourName}</td><td className="px-6 py-4">{res.tourists[0]?.name || 'N/A'} {res.tourists[0]?.familyName}</td><td className="px-6 py-4">{res.checkIn} to {res.checkOut}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${res.status === 'Confirmed' ? 'bg-green-100 text-green-800' : res.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : res.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{res.status}</span></td>
                                <td className="px-6 py-4">€{res.profit.toLocaleString()}</td>
                                <td className="px-6 py-4"><button onClick={() => onEdit(res)} className="text-blue-600 hover:text-blue-800 font-medium"><Edit size={18} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AddPayment = ({ onAddPayment, payments, reservations }) => {
    const [payment, setPayment] = useState({ date: new Date().toISOString().split('T')[0], method: 'BANK', amount: '', reason: '', reservationId: '', vat: 24 });
    const handleChange = (e) => { const { name, value } = e.target; setPayment(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = (e) => { e.preventDefault(); onAddPayment({ ...payment, id: Date.now(), amount: parseFloat(payment.amount), vat: parseFloat(payment.vat) }); setPayment({ date: new Date().toISOString().split('T')[0], method: 'BANK', amount: '', reason: '', reservationId: '', vat: 24 }); };
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Add Payment / Income</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><InputField label="Date" name="date" type="date" value={payment.date} onChange={handleChange} required /><SelectField label="Payment Method" name="method" value={payment.method} onChange={handleChange} options={['CASH', 'BANK']} /><InputField label="Amount (€)" name="amount" type="number" value={payment.amount} onChange={handleChange} required step="0.01" min="0"/><div className="lg:col-span-2"><InputField label="Reason / Description" name="reason" value={payment.reason} onChange={handleChange} required /></div><InputField label="VAT (%)" name="vat" type="number" value={payment.vat} onChange={handleChange} required min="0" /><div><label className="block text-sm font-medium text-gray-700">Associate with Reservation (Optional)</label><input list="reservations" name="reservationId" value={payment.reservationId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" /><datalist id="reservations">{reservations.map(r => <option key={r.id} value={r.id}>{r.id} - {r.tourName}</option>)}</datalist></div></div><div className="flex justify-end mt-6"><button type="submit" className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">Add Payment</button></div></form>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Payments</h2>
            <div className="bg-white p-2 rounded-lg shadow-md overflow-x-auto"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Reason</th><th className="px-6 py-3">Method</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Res. ID</th></tr></thead><tbody>{payments.map(p => (<tr key={p.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4">{p.date}</td><td className="px-6 py-4">{p.reason}</td><td className="px-6 py-4">{p.method}</td><td className="px-6 py-4 font-medium text-green-600">€{p.amount.toLocaleString()}</td><td className="px-6 py-4">{p.reservationId || 'N/A'}</td></tr>))}</tbody></table></div>
        </div>
    );
};

const AddExpense = ({ onAddExpense, expenses, reservations }) => {
    const [expense, setExpense] = useState({ date: new Date().toISOString().split('T')[0], method: 'BANK', amount: '', reason: '', reservationId: '', vat: 24 });
    const handleChange = (e) => { const { name, value } = e.target; setExpense(prev => ({...prev, [name]: value})); };
    const handleSubmit = (e) => { e.preventDefault(); onAddExpense({...expense, id: Date.now(), amount: parseFloat(expense.amount), vat: parseFloat(expense.vat) }); setExpense({ date: new Date().toISOString().split('T')[0], method: 'BANK', amount: '', reason: '', reservationId: '', vat: 24 }); };
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Add Expense</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><InputField label="Date" name="date" type="date" value={expense.date} onChange={handleChange} required /><SelectField label="Payment Method" name="method" value={expense.method} onChange={handleChange} options={['CASH', 'BANK']} /><InputField label="Amount (€)" name="amount" type="number" value={expense.amount} onChange={handleChange} required step="0.01" min="0" /><div className="lg:col-span-2"><InputField label="Reason / Description" name="reason" value={expense.reason} onChange={handleChange} required /></div><InputField label="VAT (%)" name="vat" type="number" value={expense.vat} onChange={handleChange} required min="0" /><div><label className="block text-sm font-medium text-gray-700">Associate with Reservation (Optional)</label><input list="reservations-expense" name="reservationId" value={expense.reservationId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" /><datalist id="reservations-expense">{reservations.map(r => <option key={r.id} value={r.id}>{r.id} - {r.tourName}</option>)}</datalist></div></div><div className="flex justify-end mt-6"><button type="submit" className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">Add Expense</button></div></form>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Expenses</h2>
            <div className="bg-white p-2 rounded-lg shadow-md overflow-x-auto"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Reason</th><th className="px-6 py-3">Method</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Res. ID</th></tr></thead><tbody>{expenses.map(e => (<tr key={e.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4">{e.date}</td><td className="px-6 py-4">{e.reason}</td><td className="px-6 py-4">{e.method}</td><td className="px-6 py-4 font-medium text-red-600">€{e.amount.toLocaleString()}</td><td className="px-6 py-4">{e.reservationId || 'N/A'}</td></tr>))}</tbody></table></div>
        </div>
    );
};

const FinancialReports = ({ payments, expenses }) => {
    const [selectedMonth, setSelectedMonth] = useState('All Time');
    const availableMonths = useMemo(() => { const allDates = [...payments.map(p => p.date), ...expenses.map(e => e.date)]; const months = new Set(allDates.map(date => getMonthYear(date))); return ['All Time', ...Array.from(months)]; }, [payments, expenses]);
    const filteredData = useMemo(() => { const filteredPayments = (selectedMonth === 'All Time') ? payments : payments.filter(p => getMonthYear(p.date) === selectedMonth); const filteredExpenses = (selectedMonth === 'All Time') ? expenses : expenses.filter(e => getMonthYear(e.date) === selectedMonth); return { filteredPayments, filteredExpenses }; }, [selectedMonth, payments, expenses]);
    const { totalIncome, totalExpenses, netResult, netVat, incomeByMethod, expenseByMethod } = useMemo(() => { const { filteredPayments, filteredExpenses } = filteredData; const totalIncome = filteredPayments.reduce((sum, p) => sum + p.amount, 0); const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0); const netResult = totalIncome - totalExpenses; const vatCollected = filteredPayments.reduce((sum, p) => sum + (p.amount / (1 + p.vat/100)) * (p.vat/100), 0); const vatPaid = filteredExpenses.reduce((sum, e) => sum + (e.amount * (e.vat/100)), 0); const netVat = vatCollected - vatPaid; const incomeByMethod = filteredPayments.reduce((acc, p) => { acc[p.method] = (acc[p.method] || 0) + p.amount; return acc; }, {}); const expenseByMethod = filteredExpenses.reduce((acc, e) => { acc[e.method] = (acc[e.method] || 0) + e.amount; return acc; }, {}); return { totalIncome, totalExpenses, netResult, netVat, incomeByMethod, expenseByMethod }; }, [filteredData]);
    const incomeMethodData = Object.keys(incomeByMethod).map(key => ({ name: key, value: incomeByMethod[key] }));
    const expenseMethodData = Object.keys(expenseByMethod).map(key => ({ name: key, value: expenseByMethod[key] }));
    const PIE_COLORS = { CASH: '#ffc658', BANK: '#82ca9d' };
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6"><h1 className="text-3xl font-bold text-gray-800">Financial Reports</h1><div className="flex items-center gap-2 mt-4 sm:mt-0"><label htmlFor="month-select" className="text-sm font-medium text-gray-700">Report for:</label><select id="month-select" name="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">{availableMonths.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"><StatCard title="Total Income" value={`€${totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ChevronsRight className="h-6 w-6 text-white"/>} color="bg-green-500" /><StatCard title="Total Expenses" value={`€${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<ChevronsLeft className="h-6 w-6 text-white"/>} color="bg-red-500" /><StatCard title="Net Result" value={`€${netResult.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<DollarSign className="h-6 w-6 text-white"/>} color={netResult >= 0 ? "bg-blue-500" : "bg-orange-500"} /><StatCard title="Net VAT" value={`€${netVat.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<FileText className="h-6 w-6 text-white"/>} color="bg-amber-500" /></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md"><h2 className="text-xl font-bold mb-4 text-green-700">Income Details</h2><div className="h-96 overflow-y-auto mb-4 border rounded-lg"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Reason</th><th className="px-4 py-2">Method</th><th className="px-4 py-2 text-right">Amount</th></tr></thead><tbody>{filteredData.filteredPayments.map(p => (<tr key={p.id} className="bg-white border-b hover:bg-gray-50"><td className="px-4 py-2">{p.date}</td><td className="px-4 py-2">{p.reason}</td><td className="px-4 py-2">{p.method}</td><td className="px-4 py-2 text-right font-medium text-green-600">€{p.amount.toFixed(2)}</td></tr>))}</tbody></table></div><h3 className="text-lg font-semibold mb-2 text-gray-700">Income by Method</h3><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={incomeMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{incomeMethodData.map((entry) => <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[entry.name]} />)}</Pie><Tooltip formatter={(value) => `€${value.toLocaleString()}`} /><Legend /></PieChart></ResponsiveContainer></div>
                <div className="bg-white p-6 rounded-lg shadow-md"><h2 className="text-xl font-bold mb-4 text-red-700">Expense Details</h2><div className="h-96 overflow-y-auto mb-4 border rounded-lg"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Reason</th><th className="px-4 py-2">Method</th><th className="px-4 py-2 text-right">Amount</th></tr></thead><tbody>{filteredData.filteredExpenses.map(e => (<tr key={e.id} className="bg-white border-b hover:bg-gray-50"><td className="px-4 py-2">{e.date}</td><td className="px-4 py-2">{e.reason}</td><td className="px-4 py-2">{e.method}</td><td className="px-4 py-2 text-right font-medium text-red-600">€{e.amount.toFixed(2)}</td></tr>))}</tbody></table></div><h3 className="text-lg font-semibold mb-2 text-gray-700">Expenses by Method</h3><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={expenseMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{expenseMethodData.map((entry) => <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[entry.name]} />)}</Pie><Tooltip formatter={(value) => `€${value.toLocaleString()}`} /><Legend /></PieChart></ResponsiveContainer></div>
            </div>
        </div>
    );
}

const CreateVouchers = () => <div className="p-8"><h1 className="text-3xl font-bold">Create Vouchers (Coming Soon)</h1></div>;

const InputField = ({ label, ...props }) => (
    <div><label className="block text-sm font-medium text-gray-700">{label}</label><input {...props} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" /></div>
);

const SelectField = ({ label, options, ...props }) => (
 <div><label className="block text-sm font-medium text-gray-700">{label}</label><select {...props} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
);


const ReservationForm = ({ reservationData, onReservationDataChange, onSubmit, totalNights, onAddTourist, onRemoveTourist, onTouristChange, buttonText }) => (
    <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div className="border-b pb-6"><h2 className="text-xl font-semibold mb-4 text-gray-700">Reservation Details</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><InputField label="Creation Date" name="creationDate" type="date" value={reservationData.creationDate} onChange={(e) => onReservationDataChange({...reservationData, creationDate: e.target.value})} /><InputField label="Tour Name" name="tourName" value={reservationData.tourName} onChange={(e) => onReservationDataChange({...reservationData, tourName: e.target.value})} /><SelectField label="Tour Type" name="tourType" value={reservationData.tourType} onChange={(e) => onReservationDataChange({...reservationData, tourType: e.target.value})} options={['BUS', 'PARTNER', 'HOTEL ONLY']} /></div></div>
        <div className="border-b pb-6"><h2 className="text-xl font-semibold mb-4 text-gray-700">Dates & Guests</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"><InputField label="Check-in Date" name="checkIn" type="date" value={reservationData.checkIn} onChange={(e) => onReservationDataChange({...reservationData, checkIn: e.target.value})} /><InputField label="Check-out Date" name="checkOut" type="date" value={reservationData.checkOut} onChange={(e) => onReservationDataChange({...reservationData, checkOut: e.target.value})} /><div><label className="block text-sm font-medium text-gray-700">Total Nights</label><p className="mt-1 p-2 h-10 flex items-center bg-gray-100 rounded-md">{totalNights}</p></div><InputField label="Adults" name="adults" type="number" value={reservationData.adults} onChange={(e) => onReservationDataChange({...reservationData, adults: parseInt(e.target.value) || 0})} /><InputField label="Children" name="children" type="number" value={reservationData.children} onChange={(e) => onReservationDataChange({...reservationData, children: parseInt(e.target.value) || 0})} /></div></div>
        <div><h2 className="text-xl font-semibold mb-4 text-gray-700">Tourist Information</h2>{(reservationData.tourists || []).map((tourist, index) => (<div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 relative"><h3 className="font-semibold text-gray-600 mb-2">Tourist {index + 1}</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><InputField label="Name" name="name" value={tourist.name} onChange={(e) => onTouristChange(index, e)} /><InputField label="Father's Name" name="fatherName" value={tourist.fatherName} onChange={(e) => onTouristChange(index, e)} /><InputField label="Family Name" name="familyName" value={tourist.familyName} onChange={(e) => onTouristChange(index, e)} /><InputField label="ID" name="id" value={tourist.id} onChange={(e) => onTouristChange(index, e)} /><InputField label="Address" name="address" value={tourist.address} onChange={(e) => onTouristChange(index, e)} /><InputField label="City" name="city" value={tourist.city} onChange={(e) => onTouristChange(index, e)} /><InputField label="Post Code" name="postCode" value={tourist.postCode} onChange={(e) => onTouristChange(index, e)} /><InputField label="Email" name="mail" type="email" value={tourist.mail} onChange={(e) => onTouristChange(index, e)} /><InputField label="Phone" name="phone" value={tourist.phone} onChange={(e) => onTouristChange(index, e)} /></div><button type="button" onClick={() => onRemoveTourist(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-2xl font-bold">&times;</button></div>))}<button type="button" onClick={onAddTourist} className="mt-2 text-blue-600 hover:text-blue-800 font-semibold">+ Add another tourist</button></div>
        <div className="border-t pt-6"><h2 className="text-xl font-semibold mb-4 text-gray-700">Financials & Status</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><SelectField label="Deposit Paid" name="depositPaid" value={reservationData.depositPaid} onChange={(e) => onReservationDataChange({...reservationData, depositPaid: e.target.value})} options={['YES', 'NO']} /><InputField label="Deposit Amount" name="depositAmount" type="number" value={reservationData.depositAmount} onChange={(e) => onReservationDataChange({...reservationData, depositAmount: parseFloat(e.target.value) || 0})} /><SelectField label="Final Payment Paid" name="finalPaymentPaid" value={reservationData.finalPaymentPaid} onChange={(e) => onReservationDataChange({...reservationData, finalPaymentPaid: e.target.value})} options={['YES', 'NO']} /><InputField label="Final Amount" name="finalPaymentAmount" type="number" value={reservationData.finalPaymentAmount} onChange={(e) => onReservationDataChange({...reservationData, finalPaymentAmount: parseFloat(e.target.value) || 0})} /><InputField label="Owed to Hotel" name="owedToHotel" type="number" value={reservationData.owedToHotel} onChange={(e) => onReservationDataChange({...reservationData, owedToHotel: parseFloat(e.target.value) || 0})} /><InputField label="Profit" name="profit" type="number" value={reservationData.profit} onChange={(e) => onReservationDataChange({...reservationData, profit: parseFloat(e.target.value) || 0})} /><InputField label="Tour Operator" name="tourOperator" value={reservationData.tourOperator} onChange={(e) => onReservationDataChange({...reservationData, tourOperator: e.target.value})} /><SelectField label="Status" name="status" value={reservationData.status} onChange={(e) => onReservationDataChange({...reservationData, status: e.target.value})} options={['Pending', 'Confirmed', 'Cancelled', 'Past']} /></div></div>
        <div className="flex justify-end"><button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">{buttonText}</button></div>
    </form>
);

const EditReservationModal = ({ isOpen, onClose, reservation, onUpdate }) => {
    const [reservationData, setReservationData] = useState(reservation);
    const [totalNights, setTotalNights] = useState(0);
    useEffect(() => { setReservationData(reservation); }, [reservation]);
    useEffect(() => { if (reservationData?.checkIn && reservationData?.checkOut) { const start = new Date(reservationData.checkIn); const end = new Date(reservationData.checkOut); if (end > start) { const diffTime = Math.abs(end - start); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); setTotalNights(diffDays); } else { setTotalNights(0); } } }, [reservationData?.checkIn, reservationData?.checkOut]);
    const handleTouristChange = (index, e) => { const { name, value } = e.target; const updatedTourists = [...(reservationData.tourists || [])]; updatedTourists[index][name] = value; setReservationData(prev => ({...prev, tourists: updatedTourists})); };
    const addTourist = () => { const newTourists = [...(reservationData.tourists || []), { name: '', fatherName: '', familyName: '', id: '', address: '', city: '', postCode: '', mail: '', phone: '' }]; setReservationData(prev => ({...prev, tourists: newTourists})); };
    const removeTourist = (index) => { const updatedTourists = (reservationData.tourists || []).filter((_, i) => i !== index); setReservationData(prev => ({...prev, tourists: updatedTourists})); };
    const handleSubmit = (e) => { e.preventDefault(); onUpdate(reservationData); onClose(); };
    if (!isOpen || !reservationData) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start pt-10 pb-10 overflow-y-auto">
            <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-4xl relative">
                <div className="p-6"><div className="flex justify-between items-center border-b pb-3 mb-4"><h2 className="text-2xl font-bold text-gray-800">Edit Reservation: {reservation.id}</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold">&times;</button></div>
                    <ReservationForm reservationData={reservationData} onReservationDataChange={setReservationData} onSubmit={handleSubmit} totalNights={totalNights} onAddTourist={addTourist} onRemoveTourist={removeTourist} onTouristChange={handleTouristChange} buttonText="Save Changes"/>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [reservations, setReservations] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activePage, setActivePage] = useState('Dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);
    const isEditModalOpen = !!editingReservation;

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const reservationsCol = collection(db, 'reservations');
                const reservationSnapshot = await getDocs(reservationsCol);
                const reservationList = reservationSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setReservations(reservationList);

                const paymentsCol = collection(db, 'payments');
                const paymentSnapshot = await getDocs(paymentsCol);
                const paymentList = paymentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setPayments(paymentList.sort((a,b) => new Date(b.date) - new Date(a.date)));

                const expensesCol = collection(db, 'expenses');
                const expenseSnapshot = await getDocs(expensesCol);
                const expenseList = expenseSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setExpenses(expenseList.sort((a,b) => new Date(b.date) - new Date(a.date)));
            } catch (error) {
                console.error("Failed to fetch data (this is expected until Firebase is configured):", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const addReservation = async (newReservation) => {
        try {
            const { id, ...reservationData } = newReservation;
            const docRef = await addDoc(collection(db, 'reservations'), reservationData);
            setReservations(prev => [{ ...reservationData, id: docRef.id }, ...prev]);
            setActivePage('View Reservations');
        } catch (error) { console.error("Error adding reservation: ", error); }
    };
    const addPayment = async (newPayment) => {
        try {
            const { id, ...paymentData } = newPayment;
            const docRef = await addDoc(collection(db, 'payments'), paymentData);
            setPayments(prev => [{ ...paymentData, id: docRef.id }, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (error) { console.error("Error adding payment: ", error); }
    };
    const addExpense = async (newExpense) => {
        try {
            const { id, ...expenseData } = newExpense;
            const docRef = await addDoc(collection(db, 'expenses'), expenseData);
            setExpenses(prev => [{ ...expenseData, id: docRef.id }, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (error) { console.error("Error adding expense: ", error); }
    };
    const handleEditReservation = (reservation) => { setEditingReservation(reservation); };
    const handleUpdateReservation = async (updatedReservation) => {
        try {
            const { id, ...reservationData } = updatedReservation;
            const reservationDoc = doc(db, 'reservations', id);
            await updateDoc(reservationDoc, reservationData);
            setReservations(prev => prev.map(res => res.id === id ? updatedReservation : res));
        } catch (error) { console.error("Error updating reservation: ", error); }
    };
    const handleCloseEditModal = () => { setEditingReservation(null); };

    const renderPage = () => {
        if (isLoading) {
            return <div className="p-8 text-center"><h1>Loading data...</h1></div>;
        }
        switch (activePage) {
            case 'Dashboard': return <Dashboard reservations={reservations} payments={payments} expenses={expenses} />;
            case 'Create Reservation': return <CreateReservation onAddReservation={addReservation} />;
            case 'View Reservations': return <ViewReservations reservations={reservations} onEdit={handleEditReservation} />;
            case 'Add Payment': return <AddPayment onAddPayment={addPayment} payments={payments} reservations={reservations} />;
            case 'Add Expense': return <AddExpense onAddExpense={addExpense} expenses={expenses} reservations={reservations}/>;
            case 'Financial Reports': return <FinancialReports payments={payments} expenses={expenses} />;
            case 'Create Vouchers': return <CreateVouchers />;
            default: return <Dashboard reservations={reservations} payments={payments} expenses={expenses}/>;
        }
    };
    const NavItem = ({ icon, label }) => (
        <li className={`flex items-center p-3 my-1 cursor-pointer rounded-lg transition-colors ${activePage === label ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-blue-100 hover:text-blue-600'}`}
            onClick={() => { setActivePage(label); setSidebarOpen(false); }}>
            {React.cloneElement(icon, { className: 'h-6 w-6 mr-3' })}
            <span className="font-medium">{label}</span>
        </li>
    );

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <button className="lg:hidden fixed top-4 left-4 z-30 bg-white p-2 rounded-md shadow-md" onClick={() => setSidebarOpen(!isSidebarOpen)}>{isSidebarOpen ? '✕' : '☰'}</button>
            <div className={`fixed lg:relative lg:translate-x-0 inset-y-0 left-0 w-64 bg-white shadow-xl z-20 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b"><h1 className="text-2xl font-bold text-blue-600">DYT Ops</h1></div>
                <nav className="p-4">
                    <ul>
                        <NavItem icon={<Home />} label="Dashboard" />
                        <NavItem icon={<PlusCircle />} label="Create Reservation" />
                        <NavItem icon={<Eye />} label="View Reservations" />
                        <NavItem icon={<DollarSign />} label="Add Payment" />
                        <NavItem icon={<ArrowLeftRight />} label="Add Expense" />
                        <NavItem icon={<TrendingUp />} label="Financial Reports" />
                        <NavItem icon={<FileText />} label="Create Vouchers" />
                    </ul>
                </nav>
            </div>
            <main className="flex-1 overflow-y-auto">
                {renderPage()}
            </main>
            <EditReservationModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                reservation={editingReservation}
                onUpdate={handleUpdateReservation}
            />
        </div>
    );
};

export default App;
