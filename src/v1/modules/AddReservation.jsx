import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, UserPlus, CreditCard, Trash2, Plus, Hotel, Landmark, Plane, Mail, Phone } from 'lucide-react';

const AddReservation = ({ 
  onBack, 
  lang = 'bg', 
  tours = [], 
  customers = [],
  reservations = [], 
  loading = false,
  handleSubmitReservation 
}) => {

  const translations = {
    bg: {
      back: "Назад",
      resHeader: "Резервация",
      save: "Запази",
      loading: "Зареждане...",
      stayInfo: "Детайли на настаняването",
      hotel: "Хотел",
      tourOperator: "Туроператор / Партньор",
      roomType: "Тип стая",
      food: "Пансион (Храна)",
      destination: "Град / Дестинация",
      checkIn: "Настаняване",
      checkOut: "Напускане",
      nights: "нощувки",
      stay: "Престой",
      tourists: "Туристи",
      tourist: "Турист",
      new: "НОВ",
      client: "КЛИЕНТ",
      selectClient: "-- Избери клиент --",
      firstName: "Име",
      fatherName: "Презиме",
      familyName: "Фамилия",
      egn: "ЕГН",
      email: "Имейл",
      phone: "Телефон",
      finance: "Финансов Баланс",
      salePrice: "Продажна Цена",
      toHotel: "Към хотел",
      transport: "Разход Транспорт",
      profit: "Чиста Печалба",
      association: "Асоциация и Статус",
      linkTour: "Връзка с Тур",
      independent: "-- Самостоятелна резервация --",
      status: "Статус",
      adults: "Възрастни",
      children: "Деца",
      bgn: "лв."
    },
    en: {
      back: "Back",
      resHeader: "Reservation",
      save: "Save",
      loading: "Loading...",
      stayInfo: "Accommodation Details",
      hotel: "Hotel",
      tourOperator: "Tour Operator / Partner",
      roomType: "Room Type",
      food: "Board (Food)",
      destination: "City / Destination",
      checkIn: "Check-in",
      checkOut: "Check-out",
      nights: "nights",
      stay: "Stay",
      tourists: "Tourists",
      tourist: "Tourist",
      new: "NEW",
      client: "CLIENT",
      selectClient: "-- Select client --",
      firstName: "First Name",
      fatherName: "Middle Name",
      familyName: "Family Name",
      egn: "ID/EGN",
      email: "Email",
      phone: "Phone",
      finance: "Financial Balance",
      salePrice: "Sale Price",
      toHotel: "To Hotel",
      transport: "Transport Cost",
      profit: "Net Profit",
      association: "Association & Status",
      linkTour: "Link to Tour",
      independent: "-- Independent Reservation --",
      status: "Status",
      adults: "Adults",
      children: "Children",
      bgn: "BGN"
    }
  };

  const t = translations[lang] || translations.bg;

  const nextResNumber = useMemo(() => {
    if (!reservations || reservations.length === 0) return 'dyt100101';
    const numericParts = reservations
      .map(r => {
        const num = String(r.reservationNumber || '');
        const match = num.match(/dyt(\d+)/i); 
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(n => n !== null && !isNaN(n));

    if (numericParts.length === 0) return 'dyt100101';
    const maxNum = Math.max(...numericParts);
    return `dyt${maxNum < 100101 ? 100101 : maxNum + 1}`;
  }, [reservations]);

  const [reservationForm, setReservationForm] = useState({
    creationDate: new Date().toISOString().split('T')[0],
    reservationNumber: t.loading,
    tourType: 'HOTEL ONLY',
    hotel: '',
    tourOperator: '',
    food: '',
    roomType: '',
    place: '',
    checkIn: '',
    checkOut: '',
    nights: 0,
    adults: 2,
    children: 0,
    tourists: [{
      mode: 'new', firstName: '', fatherName: '', familyName: '', id: '', realId: '', email: '', phone: ''
    }],
    finalAmount: 0,
    owedToHotel: 0,
    approxTransportCost: 0,
    profit: 0,
    status: 'Pending',
    linkedTourId: '',
  });

  useEffect(() => {
    if (nextResNumber) setReservationForm(prev => ({ ...prev, reservationNumber: nextResNumber }));
  }, [nextResNumber]);

  useEffect(() => {
    if (reservationForm.linkedTourId) {
      const selectedTour = tours.find(t => t.tourId === reservationForm.linkedTourId);
      if (selectedTour) {
        setReservationForm(prev => ({
          ...prev,
          hotel: selectedTour.hotel || '',
          place: selectedTour.destination || '',
          tourType: 'BUS TOUR'
        }));
      }
    }
  }, [reservationForm.linkedTourId, tours]);

  useEffect(() => {
    let nights = 0;
    if (reservationForm.checkIn && reservationForm.checkOut) {
      const diff = new Date(reservationForm.checkOut) - new Date(reservationForm.checkIn);
      nights = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    const profit = Number(reservationForm.finalAmount || 0) - Number(reservationForm.owedToHotel || 0) - Number(reservationForm.approxTransportCost || 0);
    setReservationForm(prev => ({ ...prev, profit, nights }));
  }, [reservationForm.finalAmount, reservationForm.owedToHotel, reservationForm.approxTransportCost, reservationForm.checkIn, reservationForm.checkOut]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReservationForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleTouristChange = (index, e) => {
    const { name, value } = e.target;
    const newTourists = [...reservationForm.tourists];
    newTourists[index][name] = value;
    setReservationForm(prev => ({ ...prev, tourists: newTourists }));
  };

  const handleTouristModeChange = (index, mode) => {
    const newTourists = [...reservationForm.tourists];
    newTourists[index] = { mode, firstName: '', fatherName: '', familyName: '', realId: '', email: '', phone: '' };
    setReservationForm(prev => ({ ...prev, tourists: newTourists }));
  };

  const handleExistingTouristSelect = (index, customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const newTourists = [...reservationForm.tourists];
      newTourists[index] = { ...customer, mode: 'existing', id: customerId };
      setReservationForm(prev => ({ ...prev, tourists: newTourists }));
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 font-sans pb-20 text-slate-800 dark:text-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-sm">
          <ArrowLeft size={18} /> {t.back}
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">{t.resHeader} #{reservationForm.reservationNumber}</h1>
        <button onClick={() => handleSubmitReservation(reservationForm)} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl shadow-lg flex items-center gap-2 font-black uppercase text-[10px]">
          <Save size={16} /> {loading ? '...' : t.save}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* accommodation details */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              <Hotel size={18} className="text-blue-500" /> {t.stayInfo}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.hotel}</label>
                <input type="text" name="hotel" placeholder={t.hotel} value={reservationForm.hotel} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.tourOperator}</label>
                <input type="text" name="tourOperator" placeholder={t.tourOperator} value={reservationForm.tourOperator} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.roomType}</label>
                <input type="text" name="roomType" placeholder={t.roomType} value={reservationForm.roomType} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm font-bold border-none" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.food}</label>
                <select name="food" value={reservationForm.food} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm font-bold border-none">
                  <option value="">{t.food}</option>
                  <option value="RO">RO</option><option value="BB">BB</option><option value="HB">HB</option><option value="FB">FB</option><option value="AI">AI</option><option value="UAI">UAI</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.destination}</label>
                <input type="text" name="place" placeholder={t.destination} value={reservationForm.place} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm border-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.adults}</label>
                <input type="number" name="adults" value={reservationForm.adults} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm font-bold border-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.children}</label>
                <input type="number" name="children" value={reservationForm.children} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm font-bold border-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.checkIn}</label>
                <input type="date" name="checkIn" value={reservationForm.checkIn} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm border-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.checkOut}</label>
                <input type="date" name="checkOut" value={reservationForm.checkOut} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm border-none" />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 flex flex-col justify-center items-center border border-blue-100 dark:border-blue-800 md:col-span-2">
                <span className="text-[9px] font-black uppercase text-blue-500">{t.stay}</span>
                <span className="text-sm font-black text-blue-600">{reservationForm.nights} {t.nights}</span>
              </div>
            </div>
          </div>

          {/* Tourists */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              <div className="flex items-center gap-2"><UserPlus size={18} className="text-blue-500" /> {t.tourists}</div>
              <button onClick={() => setReservationForm(p => ({...p, tourists: [...p.tourists, {mode:'new', firstName:'', familyName:'', realId:'', email:'', phone:''}]}))} className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"><Plus size={16} /></button>
            </div>
            <div className="space-y-6">
              {reservationForm.tourists.map((tourist, index) => (
                <div key={index} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">{t.tourist} {index + 1}</span>
                    <div className="flex gap-2">
                      <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-xl">
                        <button onClick={() => handleTouristModeChange(index, 'new')} className={`px-3 py-1 text-[10px] font-bold rounded-lg ${tourist.mode === 'new' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>{t.new}</button>
                        <button onClick={() => handleTouristModeChange(index, 'existing')} className={`px-3 py-1 text-[10px] font-bold rounded-lg ${tourist.mode === 'existing' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>{t.client}</button>
                      </div>
                      {reservationForm.tourists.length > 1 && <button onClick={() => setReservationForm(p => ({...p, tourists: p.tourists.filter((_, i) => i !== index)}))} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>}
                    </div>
                  </div>
                  {tourist.mode === 'existing' ? (
                    <select value={tourist.id || ''} onChange={(e) => handleExistingTouristSelect(index, e.target.value)} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-sm font-bold">
                      <option value="">{t.selectClient} ({customers.length})</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.familyName} ({c.realId})</option>)}
                    </select>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <input type="text" name="firstName" placeholder={t.firstName} value={tourist.firstName} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm font-bold" />
                      <input type="text" name="fatherName" placeholder={t.fatherName} value={tourist.fatherName} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm font-bold" />
                      <input type="text" name="familyName" placeholder={t.familyName} value={tourist.familyName} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm font-bold" />
                      <input type="text" name="realId" placeholder={t.egn} value={tourist.realId} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm text-blue-600 font-bold" />
                      <div className="relative group">
                        <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input type="email" name="email" placeholder={t.email} value={tourist.email} onChange={(e) => handleTouristChange(index, e)} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-2 pl-9 pr-4 text-sm" />
                      </div>
                      <div className="relative group">
                        <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input type="text" name="phone" placeholder={t.phone} value={tourist.phone} onChange={(e) => handleTouristChange(index, e)} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-2 pl-9 pr-4 text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-6 text-emerald-400 font-black uppercase text-[10px] tracking-widest">
              <CreditCard size={18} /> {t.finance}
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-[10px] font-black uppercase">{t.salePrice}</span>
                <input type="number" name="finalAmount" value={reservationForm.finalAmount} onChange={handleFormChange} className="bg-transparent text-right font-black text-xl outline-none w-24 text-emerald-400" />
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-[10px] font-black uppercase">{t.toHotel}</span>
                <input type="number" name="owedToHotel" value={reservationForm.owedToHotel} onChange={handleFormChange} className="bg-transparent text-right font-bold outline-none w-24" />
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-blue-400">
                <div className="flex items-center gap-1 uppercase text-[10px] font-black"><Plane size={12} /> {t.transport}</div>
                <input type="number" name="approxTransportCost" value={reservationForm.approxTransportCost} onChange={handleFormChange} className="bg-transparent text-right font-bold outline-none w-24" />
              </div>
              <div className="bg-emerald-500/10 p-4 rounded-2xl flex justify-between items-center border border-emerald-500/20">
                <span className="text-emerald-400 text-[10px] font-black uppercase">{t.profit}</span>
                <span className="font-black text-emerald-400 text-lg">{reservationForm.profit.toFixed(2)} {t.bgn}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              <Landmark size={18} className="text-blue-500" /> {t.association}
            </div>
            <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.linkTour}</label>
                  <select name="linkedTourId" value={reservationForm.linkedTourId} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm font-bold text-blue-600 border-none outline-none">
                    <option value="">{t.independent}</option>
                    {tours.map(tour => <option key={tour.id} value={tour.tourId}>{tour.tourId} - {tour.hotel}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">{t.status}</label>
                  <select name="status" value={reservationForm.status} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm font-black text-blue-600 uppercase border-none outline-none">
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddReservation;
