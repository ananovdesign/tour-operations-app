import { useState, useEffect } from 'react';
import { db, appId } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export const useBusTours = (userId) => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const path = `artifacts/${appId}/users/${userId}/tours`;
        const q = query(collection(db, path), orderBy('startDate', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTours(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userId]);

    return { tours, loading };
};
