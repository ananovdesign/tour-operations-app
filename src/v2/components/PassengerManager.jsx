import React from 'react';

const PassengerManager = ({ passengers, setPassengers }) => {
  const addPassenger = () => {
    setPassengers([...passengers, { name: '', egn: '', idCard: '' }]);
  };

  return (
    <div className="mt-4">
      <h3 className="font-bold text-slate-700 mb-2">Списък на туристите</h3>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2">№</th>
            <th className="border p-2">Трите имена</th>
            <th className="border p-2">ЕГН</th>
            <th className="border p-2">Л.К. №</th>
          </tr>
        </thead>
        <tbody>
          {passengers.map((p, index) => (
            <tr key={index}>
              <td className="border p-2 text-center">{index + 1}</td>
              <td className="border p-2"><input className="w-full" value={p.name} onChange={(e) => {
                const newP = [...passengers];
                newP[index].name = e.target.value;
                setPassengers(newP);
              }} /></td>
              <td className="border p-2"><input className="w-full" value={p.egn} onChange={(e) => {
                const newP = [...passengers];
                newP[index].egn = e.target.value;
                setPassengers(newP);
              }} /></td>
              <td className="border p-2"><input className="w-full" value={p.idCard} onChange={(e) => {
                const newP = [...passengers];
                newP[index].idCard = e.target.value;
                setPassengers(newP);
              }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addPassenger} className="mt-2 text-blue-600 text-sm font-bold">+ Добави турист</button>
    </div>
  );
};

export default PassengerManager;
