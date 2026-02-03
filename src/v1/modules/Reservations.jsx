import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  Search, Plus, Eye, Edit3, FileText, Loader2, ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';

const Reservations = () => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    const unsubRes = onSnapshot(resRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a, b) => {
        const getNum = (str) => parseInt(str?.toString().replace(/\D/g, '')) || 0;
        return getNum(b.reservationNumber) - getNum(a.reservationNumber);
      });
      setReservations(sorted);
      setLoading(false);
    });

    const transRef = collection(db, `artifacts/${appId}/users/${userId}/financialTransactions`);
    const unsubTrans = onSnapshot(transRef, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubRes(); unsubTrans(); };
  }, [userId]);

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const leadGuest = res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : "";
      const matchesSearch = leadGuest.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (res.reservationNumber || "").toString().toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter]);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg font-sans">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4 text-left">Hotel Reservations</h2>

      {/* ФИЛТРИ - ИЗЧИСТЕН БЯЛ ДИЗАЙН */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm items-center">
        <div className="relative flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Lead Guest / #</label>
          <input 
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#28A745] focus:border-[#28A745]"
            placeholder="Enter name or reservation number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex items-end h-full mt-5">
           <button className="px-4 py-2 bg-[#28A745] text-white rounded-md hover:bg-opacity-90 shadow-sm font-bold flex items-center gap-2">
            <Plus size={18} /> New Reservation
          </button>
        </div>
      </div>

      {/* ТАБЛИЦА С ВЪЗСТАНОВЕНИ ЦВЕТОВЕ */}
      <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 text-left font-medium">Reservation Number</th>
              <th className="py-3 px-4 text-left font-medium">Hotel</th>
              <th className="py-3 px-4 text-left font-medium">Lead Guest</th>
              <th className="py-3 px-4 text-left font-medium">Dates</th>
              <th className="py-3 px-4 text-left font-medium">Status</th>
              <th className="py-3 px-4 text-left font-medium">Payment Status</th>
              <th className="py-3 px-4 text-right font-medium">Profit</th>
              <th className="py-3 px-4 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReservations.map((res) => {
              const linkedPayments = transactions.filter(t => t.associatedReservationId === res.reservationNumber);
              const isExpanded = expandedId === res.id;

              return (
                <React.Fragment key={res.id}>
                  <tr 
                    onClick={() => setExpandedId(isExpanded ? null : res.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-blue-600">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {res.reservationNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-800">{res.hotel}</td>
                    <td className="py-3 px-4">
                      {res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm italic">{res.checkIn} - {res.checkOut}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        res.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 
                        res.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {/* ВЪЗСТАНОВЯВАНЕ НА ПЕЙМЪНТ СТАТУС ЦВЕТОВЕТЕ ОТ БАЗАТА */}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${res.paymentStatusColor}`}>
                        {res.paymentStatus}
                      </span>
                      {res.remainingAmount > 0 && (
                        <div className="text-[10px] text-gray-500 mt-1 font-bold italic text-red-500">
                          Due: BGN {res.remainingAmount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-right text-gray-900">BGN {res.profit?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button className="bg-blue-500 text-white p-1.5 rounded-full shadow hover:bg-blue-600"><Eye size={14} /></button>
                        <button className="bg-[#28A745] text-white p-1.5 rounded-full shadow hover:bg-[#218838]"><Edit3 size={14} /></button>
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-gray-50 border-l-4 border-[#28A745]">
                      <td colSpan="8" className="p-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <FileText size={16} /> Linked Financial Transactions
                          </h4>
                          {linkedPayments.length > 0 ? (
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="py-2 px-3 text-left">Date</th>
                                  <th className="py-2 px-3 text-left">Method</th>
                                  <th className="py-2 px-3 text-left">Type</th>
                                  <th className="py-2 px-3 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {linkedPayments.map(p => (
                                  <tr key={p.id}>
                                    <td className="py-2 px-3">{p.date}</td>
                                    <td className="py-2 px-3 uppercase">{p.method}</td>
                                    <td className="py-2 px-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${p.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {p.type}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-right font-bold text-gray-900">BGN {p.amount.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No payments found.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reservations;
