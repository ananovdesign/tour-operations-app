import React, { useState } from 'react';
import ReservationList from './ReservationList';
import AddReservation from './AddReservation';

const Reservations = ({ userId }) => {
    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <div className="relative">
            {/* Списъкът винаги е отдолу */}
            <ReservationList 
                userId={userId} 
                onAddClick={() => setShowAddForm(true)} 
            />

            {/* Модалният прозорец за добавяне се появява отгоре */}
            {showAddForm && (
                <AddReservation 
                    userId={userId} 
                    onClose={() => setShowAddForm(false)} 
                />
            )}
        </div>
    );
};

export default Reservations;
