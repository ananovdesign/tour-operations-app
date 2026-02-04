case 'addReservation':
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#28A745] to-[#218838] p-6 text-white">
          <h2 className="text-3xl font-bold">
            {selectedReservation ? 'Редактиране на резервация' : 'Нова хотелска резервация'}
          </h2>
          <p className="text-green-100 mt-1">Попълнете данните за настаняване и плащане</p>
        </div>

        <form onSubmit={handleSubmitReservation} className="p-8 space-y-10">
          
          {/* Секция 1: Основна информация */}
          <section>
            <div className="flex items-center space-x-2 mb-6 border-b pb-2">
              <span className="p-2 bg-green-100 text-green-700 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              <h3 className="text-xl font-semibold text-gray-800">Основна информация</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Дата на създаване</label>
                <input
                  type="date"
                  name="creationDate"
                  value={reservationForm.creationDate}
                  onChange={handleReservationFormChange}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Номер на резервация</label>
                <input
                  type="text"
                  name="reservationNumber"
                  value={reservationForm.reservationNumber}
                  onChange={handleReservationFormChange}
                  className="w-full rounded-lg border-gray-300 bg-gray-50 font-mono text-sm"
                  placeholder="Автоматичен номер"
                  disabled={!!selectedReservation}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Тип тур</label>
                <select
                  name="tourType"
                  value={reservationForm.tourType}
                  onChange={handleReservationFormChange}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                >
                  <option value="PARTNER">PARTNER</option>
                  <option value="HOTEL ONLY">HOTEL ONLY</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1">Хотел</label>
                <input
                  type="text"
                  name="hotel"
                  value={reservationForm.hotel}
                  onChange={handleReservationFormChange}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                  placeholder="Име на хотела..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Храна</label>
                <input
                  type="text"
                  name="food"
                  value={reservationForm.food}
                  onChange={handleReservationFormChange}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                  placeholder="All Inclusive, HB..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Тип стая</label>
                <input
                  type="text"
                  name="roomType"
                  value={reservationForm.roomType}
                  onChange={handleReservationFormChange}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                  placeholder="Двойна, Фамилна..."
                />
              </div>
            </div>
          </section>

          {/* Секция 2: Дати и гости */}
          <section className="bg-green-50/50 p-6 rounded-xl border border-green-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Check-In</label>
                <input
                  type="date"
                  name="checkIn"
                  value={reservationForm.checkIn}
                  onChange={handleReservationFormChange}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Check-Out</label>
                <input
                  type="date"
                  name="checkOut"
                  value={reservationForm.checkOut}
                  onChange={handleReservationFormChange}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Нощувки</label>
                <div className="mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg font-bold text-center text-green-700 shadow-inner">
                  {reservationForm.totalNights}
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Възрастни</label>
                  <input type="number" name="adults" value={reservationForm.adults} onChange={handleReservationFormChange} min="1" className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Деца</label>
                  <input type="number" name="children" value={reservationForm.children} onChange={handleReservationFormChange} min="0" className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </div>
          </section>

          {/* Секция 3: Туристи (Динамична) */}
          <section>
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
                <h3 className="text-xl font-semibold text-gray-800">Данни за туристите</h3>
              </div>
              <button
                type="button"
                onClick={addTourist}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Добави турист
              </button>
            </div>

            <div className="space-y-4">
              {reservationForm.tourists.map((tourist, index) => (
                <div key={index} className="group relative border border-gray-200 rounded-xl p-6 bg-white hover:border-green-300 transition-colors shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">
                      Турист #{index + 1}
                    </span>
                    <div className="flex items-center space-x-4">
                      <div className="flex p-1 bg-gray-100 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleTouristModeChange(index, 'new')}
                          className={`px-4 py-1 text-xs font-medium rounded-md transition ${tourist.mode === 'new' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
                        >Нов</button>
                        <button
                          type="button"
                          onClick={() => handleTouristModeChange(index, 'existing')}
                          className={`px-4 py-1 text-xs font-medium rounded-md transition ${tourist.mode === 'existing' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
                        >Съществуващ</button>
                      </div>
                      {reservationForm.tourists.length > 1 && (
                        <button type="button" onClick={() => removeTourist(index)} className="text-red-400 hover:text-red-600 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {tourist.mode === 'existing' ? (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Избери от списъка</label>
                      <select
                        value={tourist.id || ''}
                        onChange={(e) => handleExistingTouristSelect(index, e.target.value)}
                        className="w-full rounded-lg border-gray-300 focus:ring-green-500 shadow-sm"
                        required
                      >
                        <option value="" disabled>-- Търси клиент --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.firstName} {c.familyName} (ID: {c.id})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
                      <input type="text" name="firstName" placeholder="Име" value={tourist.firstName} onChange={(e) => handleTouristChange(index, e)} className="rounded-lg border-gray-200 text-sm" required />
                      <input type="text" name="familyName" placeholder="Фамилия" value={tourist.familyName} onChange={(e) => handleTouristChange(index, e)} className="rounded-lg border-gray-200 text-sm" required />
                      <input type="text" name="id" placeholder="ID / Паспорт" value={tourist.id} onChange={(e) => handleTouristChange(index, e)} className="rounded-lg border-gray-200 text-sm" required />
                      <input type="email" name="email" placeholder="Email" value={tourist.email} onChange={(e) => handleTouristChange(index, e)} className="rounded-lg border-gray-200 text-sm" />
                      <input type="tel" name="phone" placeholder="Телефон" value={tourist.phone} onChange={(e) => handleTouristChange(index, e)} className="rounded-lg border-gray-200 text-sm" />
                      <input type="text" name="realId" placeholder="ЕГН" value={tourist.realId} onChange={(e) => handleTouristChange(index, e)} className="rounded-lg border-gray-200 text-sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Секция 4: Финансова информация */}
          <section className="bg-gray-50 p-8 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="flex items-center space-x-2 mb-6">
              <span className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="text-xl font-semibold text-gray-800">Финанси и Плащане</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Обща сума към клиента</label>
                  <div className="relative">
                    <input type="number" name="finalAmount" value={reservationForm.finalAmount} onChange={handleReservationFormChange} step="0.01" className="w-full pl-8 rounded-lg border-gray-300 text-lg font-bold text-green-600 focus:ring-green-500" required />
                    <span className="absolute left-3 top-2.5 text-gray-400">€</span>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                  <input type="checkbox" name="depositPaid" checked={reservationForm.depositPaid} onChange={handleReservationFormChange} className="h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500" />
                  <label className="ml-3 text-sm font-medium text-gray-700">Платен депозит</label>
                </div>
              </div>

              <div className="space-y-4 border-x px-8 border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Дължимо към хотел/партньор</label>
                  <input type="number" name="owedToHotel" value={reservationForm.owedToHotel} onChange={handleReservationFormChange} step="0.01" className="w-full rounded-lg border-gray-300" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Депозирана сума</label>
                  <input type="number" name="depositAmount" value={reservationForm.depositAmount} onChange={handleReservationFormChange} step="0.01" className="w-full rounded-lg border-gray-300 text-gray-500" />
                </div>
              </div>

              <div className="flex flex-col justify-center items-center bg-white p-6 rounded-xl shadow-inner border border-green-100 text-center">
                <span className="text-xs uppercase text-gray-400 font-bold mb-1 tracking-widest">Прогнозна печалба</span>
                <span className={`text-3xl font-black ${reservationForm.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {reservationForm.profit.toFixed(2)} €
                </span>
                <div className="mt-2 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { resetReservationForm(); setActiveTab('reservations'); }}
              className="text-gray-500 hover:text-gray-800 font-medium transition px-4 py-2"
            >
              Отказ и връщане
            </button>
            <div className="flex space-x-4">
               <select
                  name="status"
                  value={reservationForm.status}
                  onChange={handleReservationFormChange}
                  className="rounded-lg border-gray-300 text-sm font-semibold"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-[#28A745] text-white font-bold rounded-xl hover:bg-[#218838] transform active:scale-95 transition shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Записване...
                  </span>
                ) : (
                  selectedReservation ? 'Обнови резервация' : 'Финализирай резервация'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
export default AddReservation;
