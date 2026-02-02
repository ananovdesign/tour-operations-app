import { useState, useEffect } from 'react';
import { db, appId } from '../../firebase'; // Пътят към твоя firebase.js
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export const useReservations = (userId) => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const path = `artifacts/${appId}/users/${userId}/reservations`;
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReservations(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { reservations, loading };
};
