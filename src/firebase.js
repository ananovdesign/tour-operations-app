import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, onSnapshot, addDoc, deleteDoc, doc, updateDoc, runTransaction, query, where } from 'firebase/firestore';

// TODO: REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to get the next sequential ID for a collection (e.g., 'DYT100106')
// It uses a transaction to prevent race conditions where two users might get the same ID.
const getNextSequenceId = async (counterName, prefix, padStart) => {
    const counterRef = doc(db, 'counters', counterName);
    let nextId;
    try {
        await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists()) {
                // If the counter doesn't exist, start it at 1
                nextId = 1;
                transaction.set(counterRef, { currentNumber: nextId });
            } else {
                nextId = counterDoc.data().currentNumber + 1;
                transaction.update(counterRef, { currentNumber: nextId });
            }
        });
        // Format the ID with prefix and padding (e.g., DYT001)
        return `${prefix}${String(nextId).padStart(padStart, '0')}`;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e; // Rethrow the error to be handled by the caller
    }
};


export {
    db,
    collection,
    getDocs,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
    getNextSequenceId,
};
