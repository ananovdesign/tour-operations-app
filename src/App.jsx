import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot,
  serverTimestamp, Timestamp
} from 'firebase/firestore';

// Define a default Firebase configuration. This will be used if environment variables
// are not properly loaded or are empty. This ensures the app can always try to initialize Firebase.
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY", // <--- IMPORTANT: Replace this with your actual API key
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN", // <--- IMPORTANT: Replace this
  projectId: "YOUR_FIREBASE_PROJECT_ID", // <--- IMPORTANT: Replace this
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET", // <--- IMPORTANT: Replace this
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID", // <--- IMPORTANT: Replace this
  appId: "YOUR_FIREBASE_APP_ID" // <--- IMPORTANT: Replace this
};

// Confirmation Modal Component
// This component provides a custom dialog for user confirmations, replacing native browser alerts.
const ConfirmationModal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};


const App = () => {
  // Firebase App, Auth, and Firestore instances
  const [app, setApp] = useState(null);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // To ensure Firestore ops wait for auth

  // Application state for navigation
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard for this phase
  const [selectedReservation, setSelectedReservation] = useState(null); // For editing a reservation
  const [selectedTour, setSelectedTour] = useState(null); // For viewing/editing a tour

  // Data states
  const [reservations, setReservations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tours, setTours] = useState([]);
  const [financialTransactions, setFinancialTransactions] = []; // New state for payments/expenses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // For success/error messages

  // State for Add/Edit Reservation Form
  const [reservationForm, setReservationForm] = useState({
    creationDate: '',
    reservationNumber: '',
    tourType: 'HOTEL ONLY',
    hotel: '',
    food: '',
    place: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    tourists: [{
      firstName: '',
      fatherName: '',
      familyName: '',
      id: '', // Unique ID for customer
      address: '',
      city: '',
      postCode: '',
      email: '',
      phone: ''
    }],
    depositPaid: false,
    depositAmount: 0,
    finalAmount: 0,
    owedToHotel: 0,
    profit: 0, // Will be calculated
    tourOperator: '',
    status: 'Pending',
    linkedTourId: '',
    approxTransportCost: 0,
  });

  // State for Add/Edit Tour Form (Phase 2)
  const [tourForm, setTourForm] = useState({
    tourId: '', // Auto-generated
    departureDate: '',
    arrivalDate: '',
    nights: 0, // Manual input
    daysInclTravel: 0, // Auto-calculated
    transportCompany: '',
    hotel: '', // Primary hotel for the tour
    maxPassengers: 0,
  });

  // State for Edit Customer Form
  const [customerEditForm, setCustomerEditForm] = useState({
    id: '',
    firstName: '',
    fatherName: '',
    familyName: '',
    address: '',
    city: '',
    postCode: '',
    email: '',
    phone: ''
  });
  const [showCustomerEditModal, setShowCustomerEditModal] = useState(false);

  // State for Add Payment/Expense Form (Phase 3)
  const [financialTransactionForm, setFinancialTransactionForm] = useState({
    date: '',
    method: 'Bank',
    amount: 0,
    reasonDescription: '',
    vat: 0, // Assuming fixed amount for now
    type: 'income', // 'income' or 'expense'
    associatedReservationId: '',
    associatedTourId: '',
  });

  // States for Financial Reports (Phase 5)
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportFilterType, setReportFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [reportFilterAssociation, setReportFilterAssociation] = useState(''); // Res ID or Tour ID

  // State for the custom confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });


  // --- Firebase Initialization and Authentication ---
  useEffect(() => {
    // Only proceed if app is not already initialized
    if (app) return;

    try {
      // Get the app ID from the environment. Use 'default-app-id' as a fallback.
      const appId = typeof __app_id !== 'undefined' && __app_id ? __app_id : 'default-app-id';

      // Construct Firebase config from environment variables.
      // IMPORTANT: Use import.meta.env for Vite projects!
      let firebaseConfig = {};
      if (
        import.meta.env.VITE_FIREBASE_API_KEY &&
        import.meta.env.VITE_FIREBASE_API_KEY !== ''
      ) {
        // If VITE environment variables are present, use them.
        firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };
        console.log("Firebase config from VITE environment variables being used.");
      } else if (typeof __firebase_config !== 'undefined' && __firebase_config) {
        // Fallback to __firebase_config if VITE env vars are not set or empty
        try {
          const parsedConfig = JSON.parse(__firebase_config);
          if (Object.keys(parsedConfig).length > 0) {
            firebaseConfig = parsedConfig;
            console.log("Firebase config from __firebase_config (parsed JSON) being used.");
          } else {
            console.warn("Parsed __firebase_config was empty, falling back to DEFAULT_FIREBASE_CONFIG.");
            firebaseConfig = DEFAULT_FIREBASE_CONFIG;
          }
        } catch (parseError) {
          console.error("Error parsing __firebase_config, falling back to DEFAULT_FIREBASE_CONFIG:", parseError);
          firebaseConfig = DEFAULT_FIREBASE_CONFIG;
        }
      } else {
        // If neither VITE env vars nor __firebase_config are present, use the hardcoded default.
        console.warn("Neither VITE environment variables nor __firebase_config provided. Falling back to DEFAULT_FIREBASE_CONFIG.");
        firebaseConfig = DEFAULT_FIREBASE_CONFIG;
      }

      // Check if the final firebaseConfig is still empty or missing critical keys
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        setError("Firebase configuration is incomplete. Please ensure API Key and Project ID are provided via environment variables or directly in DEFAULT_FIREBASE_CONFIG.");
        setLoading(false);
        return;
      }

      console.log("Final Firebase config to initialize with:", firebaseConfig);
      console.log("App ID being used:", appId);

      const initializedApp = initializeApp(firebaseConfig);
      setApp(initializedApp);
      const authInstance = getAuth(initializedApp);
      setAuth(authInstance);
      const dbInstance = getFirestore(initializedApp);
      setDb(dbInstance);

      // Sign in with custom token if available, otherwise anonymously
      const signIn = async () => {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(authInstance, __initial_auth_token);
            console.log("Signed in with custom token.");
          } else {
            await signInAnonymously(authInstance);
            console.log("Signed in anonymously.");
          }
        } catch (e) {
          console.error("Firebase Auth Error during final sign-in attempt:", e);
          // Provide more specific error messages based on Firebase error codes
          if (e.code === 'auth/invalid-api-key') {
              setError("Authentication failed: Invalid API Key. Please verify your Firebase project's API key in Google Cloud Console and ensure it has no unnecessary restrictions.");
          } else if (e.code === 'auth/unauthorized-domain') {
              setError("Authentication failed: Unauthorized Domain. Add the current domain to your Firebase project's authorized domains (Firebase Console > Authentication > Settings).");
          } else if (e.code === 'auth/operation-not-allowed') {
              setError("Authentication failed: Operation Not Allowed. Ensure Anonymous Authentication is enabled in your Firebase project (Firebase Console > Authentication > Sign-in method).");
          } else {
              setError(`Authentication failed: ${e.message}. Please check Firebase console for details.`);
          }
        } finally {
          setLoading(false); // Stop loading after auth attempt (success or fail)
        }
      };
      signIn();

      // Listen for authentication state changes
      const unsubscribeAuth = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true); // Auth is ready, can now perform Firestore operations
          console.log("User authenticated:", user.uid);
        } else {
          setUserId(null);
          setIsAuthReady(true); // Auth state checked, even if user is null
          console.log("No user authenticated.");
        }
      });

      return () => unsubscribeAuth(); // Cleanup auth listener on component unmount
    } catch (e) {
      console.error("Firebase initialization error:", e);
      setError(`Failed to initialize Firebase: ${e.message}. Double-check your Firebase configuration and network.`);
      setLoading(false);
    }
  }, [app]);

  // --- Firestore Data Listeners (onSnapshot) ---
  // These effects will only run once 'db', 'userId', and 'isAuthReady' are available.

  // Listen for Reservations
  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;

    const reservationsColRef = collection(db, `artifacts/${__app_id}/users/${userId}/reservations`);
    const unsubscribeReservations = onSnapshot(reservationsColRef, (snapshot) => {
      const reservationList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(reservationList);
      // No need to set loading to false here, as it's handled in auth initialization.
    }, (err) => {
      console.error("Error fetching reservations:", err);
      setError("Failed to load reservations. Please try again.");
    });

    return () => unsubscribeReservations(); // Cleanup listener
  }, [db, userId, isAuthReady]);

  // Listen for Customers
  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;

    const customersColRef = collection(db, `artifacts/${__app_id}/users/${userId}/customers`);
    const unsubscribeCustomers = onSnapshot(customersColRef, (snapshot) => {
      const customerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(customerList);
    }, (err) => {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers. Please try again.");
    });

    return () => unsubscribeCustomers(); // Cleanup listener
  }, [db, userId, isAuthReady]);

  // Listen for Tours
  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;

    const toursColRef = collection(db, `artifacts/${__app_id}/users/${userId}/tours`);
    const unsubscribeTours = onSnapshot(toursColRef, (snapshot) => {
      const tourList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTours(tourList);
    }, (err) => {
      console.error("Error fetching tours:", err);
      setError("Failed to load tours. Please try again.");
    });

    return () => unsubscribeTours(); // Cleanup listener
  }, [db, userId, isAuthReady]);

  // Listen for Financial Transactions
  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;

    const financialTransactionsColRef = collection(db, `artifacts/${__app_id}/users/${userId}/financialTransactions`);
    const unsubscribeFinancialTransactions = onSnapshot(financialTransactionsColRef, (snapshot) => {
      const transactionList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFinancialTransactions(transactionList);
    }, (err) => {
      console.error("Error fetching financial transactions:", err);
      setError("Failed to load financial transactions. Please try again.");
    });

    return () => unsubscribeFinancialTransactions(); // Cleanup listener
  }, [db, userId, isAuthReady]);


  // --- Helper Functions ---

  // Displays a temporary message to the user (e.g., success or error notifications).
  const showMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 5000); // Clear message after 5 seconds
  };

  // Calculates the number of days between two given dates.
  const calculateDaysBetweenDates = (date1, date2) => {
    if (date1 && date2) {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffTime = Math.abs(d2 - d1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  // Generates a unique reservation number based on existing reservations in Firestore.
  const generateReservationNumber = async () => {
    if (!db || !userId) return '';
    try {
      const q = query(collection(db, `artifacts/${__app_id}/users/${userId}/reservations`));
      const querySnapshot = await getDocs(q);
      let highestNum = 100100; // Starting point for DYT100101

      // Filter for numbers that start with 'DYT' and parse the numeric part
      const sortedReservations = querySnapshot.docs
        .map(doc => doc.data().reservationNumber)
        .filter(resNum => resNum && typeof resNum === 'string' && resNum.startsWith('DYT'))
        .map(resNum => parseInt(resNum.substring(3), 10))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a); // Sort descending to find the highest

      if (sortedReservations.length > 0) {
        highestNum = sortedReservations[0];
      }

      return `DYT${highestNum + 1}`;
    } catch (err) {
      console.error("Error generating reservation number:", err);
      // Fallback to a timestamp-based number if Firestore query fails
      return `DYT${Date.now().toString().slice(-6)}`;
    }
  };

  // Generates a unique tour ID based on existing tours in Firestore.
  const generateTourId = async () => {
    if (!db || !userId) return '';
    try {
      const q = query(collection(db, `artifacts/${__app_id}/users/${userId}/tours`));
      const querySnapshot = await getDocs(q);
      let highestNum = 0; // Starting point for DYT001

      const sortedTours = querySnapshot.docs
        .map(doc => doc.data().tourId)
        .filter(tId => tId && typeof tId === 'string' && tId.startsWith('DYT'))
        .map(tId => parseInt(tId.substring(3), 10))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a);

      if (sortedTours.length > 0) {
        highestNum = sortedTours[0];
      }
      return `DYT${String(highestNum + 1).padStart(3, '0')}`; // e.g., DYT001, DYT002
    } catch (err) {
      console.error("Error generating tour ID:", err);
      // Fallback to a timestamp-based ID if Firestore query fails
      return `DYT${Date.now().toString().slice(-3)}`;
    }
  };


  // --- Handlers for Reservation Form ---

  // Handles changes to input fields in the reservation form, updating state and recalculating derived values.
  const handleReservationFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setReservationForm(prev => {
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Recalculate total nights if check-in or check-out dates change
      if (name === 'checkIn' || name === 'checkOut') {
        newState.totalNights = calculateDaysBetweenDates(newState.checkIn, newState.checkOut);
      }
      // Recalculate profit if final amount or owed to hotel changes
      if (name === 'finalAmount' || name === 'owedToHotel') {
        newState.profit = (parseFloat(newState.finalAmount) || 0) - (parseFloat(newState.owedToHotel) || 0);
      }
      return newState;
    });
  }, []);

  // Handles changes to individual tourist details within the reservation form.
  const handleTouristChange = useCallback((index, e) => {
    const { name, value } = e.target;
    setReservationForm(prev => {
      const newTourists = [...prev.tourists];
      newTourists[index] = {
        ...newTourists[index],
        [name]: value,
      };
      return { ...prev, tourists: newTourists };
    });
  }, []);

  // Adds a new blank tourist entry to the reservation form.
  const addTourist = useCallback(() => {
    setReservationForm(prev => ({
      ...prev,
      tourists: [...prev.tourists, {
        firstName: '',
        fatherName: '',
        familyName: '',
        id: '',
        address: '',
        city: '',
        postCode: '',
        email: '',
        phone: ''
      }],
    }));
  }, []);

  // Removes a tourist entry from the reservation form by index.
  const removeTourist = useCallback((index) => {
    setReservationForm(prev => ({
      ...prev,
      tourists: prev.tourists.filter((_, i) => i !== index),
    }));
  }, []);

  // --- Customer Management (for Add/Edit Reservation) ---
  // Manages customer records in Firestore. Creates new customer entries if they don't exist
  // or updates existing ones based on the provided tourist ID.
  const manageCustomerRecords = async (tourists) => {
    const customersColRef = collection(db, `artifacts/${__app_id}/users/${userId}/customers`);

    for (const tourist of tourists) {
      // Only process tourists with a valid ID
      if (!tourist.id) {
        console.warn("Skipping customer record management for a tourist without an ID.");
        continue;
      }
      const customerDocRef = doc(customersColRef, tourist.id); // Use tourist.id as document ID

      try {
        const docSnap = await getDoc(customerDocRef);
        const customerData = {
          firstName: tourist.firstName,
          fatherName: tourist.fatherName,
          familyName: tourist.familyName,
          address: tourist.address,
          city: tourist.city,
          postCode: tourist.postCode,
          email: tourist.email,
          phone: tourist.phone,
          id: tourist.id, // Store ID within the document as well
        };

        if (docSnap.exists()) {
          // Update existing customer record
          await updateDoc(customerDocRef, {
            ...customerData,
            updatedAt: serverTimestamp() // Update timestamp
          });
          console.log(`Updated customer: ${tourist.id}`);
        } else {
          // Create new customer record
          await setDoc(customerDocRef, { // Use setDoc to create with a specific ID
            ...customerData,
            createdAt: serverTimestamp() // Creation timestamp
          });
          console.log(`Created new customer: ${tourist.id}`);
        }
      } catch (err) {
        console.error(`Error managing customer ${tourist.id}:`, err);
        throw new Error(`Failed to save/update customer ${tourist.id}.`);
      }
    }
  };


  // --- Submit Reservation Form ---
  // Handles the submission of the reservation form, saving or updating data in Firestore.
  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      setError("Database not ready or user not authenticated. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage('');

    try {
      let currentReservationNumber = reservationForm.reservationNumber;
      // Generate a new reservation number only if it's a new reservation and no number is set
      if (!selectedReservation && !currentReservationNumber) {
        currentReservationNumber = await generateReservationNumber();
        // Update form state if a new number was generated (important for subsequent logic)
        setReservationForm(prev => ({ ...prev, reservationNumber: currentReservationNumber }));
      }

      // Prepare reservation data for Firestore
      const reservationData = {
        ...reservationForm,
        reservationNumber: currentReservationNumber,
        // Convert date strings to Firebase Timestamps
        creationDate: reservationForm.creationDate ? Timestamp.fromDate(new Date(reservationForm.creationDate)) : serverTimestamp(),
        checkIn: reservationForm.checkIn ? Timestamp.fromDate(new Date(reservationForm.checkIn)) : null,
        checkOut: reservationForm.checkOut ? Timestamp.fromDate(new Date(reservationForm.checkOut)) : null,
        totalNights: calculateDaysBetweenDates(reservationForm.checkIn, reservationForm.checkOut),
        depositPaid: reservationForm.depositPaid,
        depositAmount: parseFloat(reservationForm.depositAmount) || 0,
        finalAmount: parseFloat(reservationForm.finalAmount) || 0,
        owedToHotel: parseFloat(reservationForm.owedToHotel) || 0,
        profit: (parseFloat(reservationForm.finalAmount) || 0) - (parseFloat(reservationForm.owedToHotel) || 0),
        adults: parseInt(reservationForm.adults) || 0,
        children: parseInt(reservationForm.children) || 0,
        approxTransportCost: parseFloat(reservationForm.approxTransportCost) || 0,
      };

      // Ensure customer records are updated/created based on tourist details
      await manageCustomerRecords(reservationForm.tourists);

      if (selectedReservation) {
        // Update existing reservation
        const resDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/reservations`, selectedReservation.id);
        await updateDoc(resDocRef, { ...reservationData, updatedAt: serverTimestamp() });
        showMessage('Reservation updated successfully!', 'success');
      } else {
        // Add a new reservation
        await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/reservations`), {
          ...reservationData,
          createdAt: serverTimestamp()
        });
        showMessage('Reservation added successfully!', 'success');
      }

      resetReservationForm(); // Clear form after successful submission
      setActiveTab('reservations'); // Navigate back to the reservations list
    } catch (err) {
      console.error("Error saving reservation:", err);
      setError(`Failed to save reservation: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  // Resets the reservation form to its initial empty state.
  const resetReservationForm = useCallback(() => {
    setReservationForm({
      creationDate: '',
      reservationNumber: '',
      tourType: 'HOTEL ONLY',
      hotel: '',
      food: '',
      place: '',
      checkIn: '',
      checkOut: '',
      adults: 1,
      children: 0,
      tourists: [{
        firstName: '',
        fatherName: '',
        familyName: '',
        id: '',
        address: '',
        city: '',
        postCode: '',
        email: '',
        phone: ''
      }],
      depositPaid: false,
      depositAmount: 0,
      finalAmount: 0,
      owedToHotel: 0,
      profit: 0,
      tourOperator: '',
      status: 'Pending',
      linkedTourId: '',
      approxTransportCost: 0,
    });
    setSelectedReservation(null); // Clear any selected reservation for editing
  }, []);

  // --- Edit Reservation Logic ---
  // Populates the reservation form with data from a selected reservation for editing.
  const handleEditReservation = useCallback((reservation) => {
    // Convert Firebase Timestamps back to ISO date strings for input fields
    const checkInDate = reservation.checkIn?.toDate().toISOString().split('T')[0] || '';
    const checkOutDate = reservation.checkOut?.toDate().toISOString().split('T')[0] || '';
    const creationDate = reservation.creationDate?.toDate().toISOString().split('T')[0] || '';

    setReservationForm({
      ...reservation,
      creationDate: creationDate,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults: parseInt(reservation.adults) || 0,
      children: parseInt(reservation.children) || 0,
      depositAmount: parseFloat(reservation.depositAmount) || 0,
      finalAmount: parseFloat(reservation.finalAmount) || 0,
      owedToHotel: parseFloat(reservation.owedToHotel) || 0,
      profit: parseFloat(reservation.profit) || 0,
      approxTransportCost: parseFloat(reservation.approxTransportCost) || 0,
      // Ensure tourists array is always valid, even if empty or undefined
      tourists: reservation.tourists ? reservation.tourists.map(t => ({ ...t })) : [{
        firstName: '', fatherName: '', familyName: '', id: '', address: '',
        city: '', postCode: '', email: '', phone: ''
      }],
    });
    setSelectedReservation(reservation); // Set the reservation as currently selected for editing
    setActiveTab('addReservation'); // Switch to the add/edit reservation tab
  }, []);

  // --- Delete Reservation Logic ---
  // Prompts the user for confirmation before deleting a reservation from Firestore.
  const handleDeleteReservation = async (reservationId) => {
    // Show custom confirmation modal
    setConfirmModalContent({
      title: 'Delete Reservation',
      message: 'Are you sure you want to delete this reservation? This action cannot be undone.',
      onConfirm: async () => {
        setShowConfirmModal(false); // Close modal
        if (!db || !userId) {
          setError("Database not ready. Cannot delete.");
          return;
        }

        setLoading(true);
        setError(null);
        setMessage('');

        try {
          await deleteDoc(doc(db, `artifacts/${__app_id}/users/${userId}/reservations`, reservationId));
          showMessage('Reservation deleted successfully!', 'success');
        } catch (err) {
          console.error("Error deleting reservation:", err);
          setError("Failed to delete reservation. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => setShowConfirmModal(false) // Just close modal on cancel
    });
    setShowConfirmModal(true); // Display the modal
  };

  // --- Customer Management (for Add/Edit Reservation) ---
  // Sets the selected customer for editing and opens the customer edit modal.
  const handleEditCustomer = (customer) => {
    setCustomerEditForm({ ...customer });
    setShowCustomerEditModal(true);
  };

  // Handles changes to input fields in the customer edit form.
  const handleCustomerEditFormChange = (e) => {
    const { name, value } = e.target;
    setCustomerEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Handles the submission of the customer edit form, updating customer data in Firestore.
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!db || !userId || !customerEditForm.id) {
      setError("Database or customer ID not ready. Cannot update.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage('');

    try {
      const customerDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/customers`, customerEditForm.id);
      await updateDoc(customerDocRef, {
        ...customerEditForm,
        updatedAt: serverTimestamp() // Update timestamp
      });
      showMessage('Customer updated successfully!', 'success');
      setShowCustomerEditModal(false); // Close modal after successful update
    } catch (err) {
      console.error("Error updating customer:", err);
      setError("Failed to update customer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Tour Module Logic (Phase 2) ---

  // Handles changes to input fields in the tour form, updating state and recalculating days.
  const handleTourFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setTourForm(prev => {
      const newState = {
        ...prev,
        [name]: value,
      };
      // Recalculate daysInclTravel if departure or arrival dates change
      if (name === 'departureDate' || name === 'arrivalDate') {
        newState.daysInclTravel = calculateDaysBetweenDates(newState.departureDate, newState.arrivalDate) + 1; // Inclusive of travel days
      }
      return newState;
    });
  }, []);

  // Handles the submission of the tour form, saving or updating tour data in Firestore.
  const handleSubmitTour = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      setError("Database not ready or user not authenticated. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage('');

    try {
      let currentTourId = tourForm.tourId;
      // Generate a new tour ID if it's a new tour and no ID is set
      if (!currentTourId) {
        currentTourId = await generateTourId();
        // Update form state if a new ID was generated
        setTourForm(prev => ({ ...prev, tourId: currentTourId }));
      }

      // Prepare tour data for Firestore
      const tourData = {
        ...tourForm,
        tourId: currentTourId,
        // Convert date strings to Firebase Timestamps
        departureDate: tourForm.departureDate ? Timestamp.fromDate(new Date(tourForm.departureDate)) : null,
        arrivalDate: tourForm.arrivalDate ? Timestamp.fromDate(new Date(tourForm.arrivalDate)) : null,
        nights: parseInt(tourForm.nights) || 0,
        daysInclTravel: calculateDaysBetweenDates(tourForm.departureDate, tourForm.arrivalDate) + 1,
        maxPassengers: parseInt(tourForm.maxPassengers) || 0,
      };

      // Check if updating an existing tour or adding a new one by trying to get the document
      const tourDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/tours`, currentTourId);
      const docSnap = await getDoc(tourDocRef);

      if (docSnap.exists()) {
        // Update existing tour
        await updateDoc(tourDocRef, { ...tourData, updatedAt: serverTimestamp() });
        showMessage('Tour updated successfully!', 'success');
      } else {
        // Add a new tour using setDoc with the custom tourId
        await setDoc(tourDocRef, { ...tourData, createdAt: serverTimestamp() });
        showMessage('Tour added successfully!', 'success');
      }

      resetTourForm(); // Clear form after successful submission
      setActiveTab('tours'); // Navigate back to the tours list
    } catch (err) {
      console.error("Error saving tour:", err);
      setError(`Failed to save tour: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  // Resets the tour form to its initial empty state.
  const resetTourForm = useCallback(() => {
    setTourForm({
      tourId: '',
      departureDate: '',
      arrivalDate: '',
      nights: 0,
      daysInclTravel: 0,
      transportCompany: '',
      hotel: '',
      maxPassengers: 0,
    });
    setSelectedTour(null); // Clear any selected tour for editing
  }, []);

  // Populates the tour form with data from a selected tour for editing.
  const handleEditTour = useCallback((tour) => {
    // Convert Firebase Timestamps back to ISO date strings for input fields
    const departureDate = tour.departureDate?.toDate().toISOString().split('T')[0] || '';
    const arrivalDate = tour.arrivalDate?.toDate().toISOString().split('T')[0] || '';

    setTourForm({
      ...tour,
      departureDate: departureDate,
      arrivalDate: arrivalDate,
      nights: parseInt(tour.nights) || 0,
      daysInclTravel: parseInt(tour.daysInclTravel) || 0,
      maxPassengers: parseInt(tour.maxPassengers) || 0,
    });
    setSelectedTour(tour); // Set the tour as currently selected for editing
    setActiveTab('addTour'); // Switch to the add/edit tour tab
  }, []);

  // Prompts the user for confirmation before deleting a tour from Firestore.
  const handleDeleteTour = async (tourId) => {
    // Show custom confirmation modal
    setConfirmModalContent({
      title: 'Delete Tour',
      message: 'Are you sure you want to delete this tour? This will not un-link existing reservations. This action cannot be undone.',
      onConfirm: async () => {
        setShowConfirmModal(false); // Close modal
        if (!db || !userId) {
          setError("Database not ready. Cannot delete.");
          return;
        }

        setLoading(true);
        setError(null);
        setMessage('');

        try {
          await deleteDoc(doc(db, `artifacts/${__app_id}/users/${userId}/tours`, tourId));
          showMessage('Tour deleted successfully!', 'success');
        } catch (err) {
          console.error("Error deleting tour:", err);
          setError("Failed to delete tour. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => setShowConfirmModal(false) // Just close modal on cancel
    });
    setShowConfirmModal(true); // Display the modal
  };

  // Helper function to get reservations that are linked to a specific tour.
  const getLinkedReservations = useCallback((tourId) => {
    return reservations.filter(res => res.linkedTourId === tourId);
  }, [reservations]);


  // --- Financial Transaction Module Logic (Phase 3) ---

  // Handles changes to input fields in the financial transaction form.
  const handleFinancialTransactionFormChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setFinancialTransactionForm(prev => {
      let newState = { ...prev };

      // Logic to clear the other association field if one is selected
      if (name === 'associatedReservationId' && value !== '') {
        newState.associatedTourId = '';
      } else if (name === 'associatedTourId' && value !== '') {
        newState.associatedReservationId = '';
      }

      newState = {
        ...newState,
        [name]: type === 'number' ? parseFloat(value) || 0 : value, // Parse numbers, keep strings as is
      };

      return newState;
    });
  }, []);

  // Handles the submission of the financial transaction form, adding data to Firestore.
  const handleSubmitFinancialTransaction = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      setError("Database not ready or user not authenticated. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage('');

    try {
      // Prepare transaction data for Firestore
      const transactionData = {
        ...financialTransactionForm,
        date: financialTransactionForm.date ? Timestamp.fromDate(new Date(financialTransactionForm.date)) : serverTimestamp(),
        amount: parseFloat(financialTransactionForm.amount) || 0,
        vat: parseFloat(financialTransactionForm.vat) || 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/financialTransactions`), transactionData);
      showMessage(`${financialTransactionForm.type === 'income' ? 'Payment' : 'Expense'} added successfully!`, 'success');
      resetFinancialTransactionForm(); // Clear form after successful submission
      setActiveTab('payments'); // Navigate back to the payments list
    }
     catch (err) {
      console.error("Error saving financial transaction:", err);
      setError(`Failed to save financial transaction: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  // Resets the financial transaction form to its initial empty state.
  const resetFinancialTransactionForm = useCallback(() => {
    setFinancialTransactionForm({
      date: '',
      method: 'Bank',
      amount: 0,
      reasonDescription: '',
      vat: 0,
      type: 'income', // Default to income
      associatedReservationId: '',
      associatedTourId: '',
    });
  }, []);


  // --- Dashboard Calculations (Phase 4) ---
  // Memoized calculations for dashboard statistics to avoid re-calculating on every render.
  const dashboardStats = useMemo(() => {
    const totalReservations = reservations.length;
    const totalProfit = reservations.reduce((sum, res) => sum + (res.profit || 0), 0);
    const averageProfitPerReservation = totalReservations > 0 ? totalProfit / totalReservations : 0;
    const totalNightsSum = reservations.reduce((sum, res) => sum + (res.totalNights || 0), 0);
    const averageStayPerReservation = totalReservations > 0 ? totalNightsSum / totalReservations : 0;

    const totalIncome = financialTransactions
      .filter(ft => ft.type === 'income')
      .reduce((sum, ft) => sum + (ft.amount || 0), 0);

    const totalExpenses = financialTransactions
      .filter(ft => ft.type === 'expense')
      .reduce((sum, ft) => sum + (ft.amount || 0), 0);

    let totalBookedPassengersAcrossAllTours = 0;
    let totalMaxPassengersAcrossAllTours = 0;

    tours.forEach(tour => {
      const linkedReservations = reservations.filter(res => res.linkedTourId === tour.tourId);
      const bookedPassengersForTour = linkedReservations.reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0);
      totalBookedPassengersAcrossAllTours += bookedPassengersForTour;
      totalMaxPassengersAcrossAllTours += (tour.maxPassengers || 0);
    });

    const overallBusTourFulfillment = totalMaxPassengersAcrossAllTours > 0
      ? (totalBookedPassengersAcrossAllTours / totalMaxPassengersAcrossAllTours) * 100
      : 0;

    return {
      totalReservations,
      totalProfit,
      averageProfitPerReservation,
      averageStayPerReservation,
      totalIncome,
      totalExpenses,
      overallBusTourFulfillment,
      totalBusPassengersBooked: totalBookedPassengersAcrossAllTours,
    };
  }, [reservations, financialTransactions, tours]);


  // --- Financial Reports Logic (Phase 5) ---

  // Handles changes to filter inputs for financial reports.
  const handleReportFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'reportStartDate') setReportStartDate(value);
    else if (name === 'reportEndDate') setReportEndDate(value);
    else if (name === 'reportFilterType') setReportFilterType(value);
    else if (name === 'reportFilterAssociation') setReportFilterAssociation(value);
  }, []);

  // Memoized filtered list of financial transactions based on current filter criteria.
  const filteredFinancialTransactions = useMemo(() => {
    return financialTransactions.filter(ft => {
      const transactionDate = ft.date?.toDate();
      const startDate = reportStartDate ? new Date(reportStartDate) : null;
      const endDate = reportEndDate ? new Date(reportEndDate) : null;

      // Filter by date range
      if (startDate && transactionDate < startDate) return false;
      // Adjust endDate to include the entire selected day
      if (endDate && transactionDate > new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1)) return false;


      // Filter by type (income/expense)
      if (reportFilterType !== 'all' && ft.type !== reportFilterType) return false;

      // Filter by association (reservation/tour ID)
      if (reportFilterAssociation) {
        const lowerCaseFilter = reportFilterAssociation.toLowerCase();
        const matchesReservation = ft.associatedReservationId?.toLowerCase().includes(lowerCaseFilter);
        const matchesTour = ft.associatedTourId?.toLowerCase().includes(lowerCaseFilter);
        if (!matchesReservation && !matchesTour) return false;
      }

      return true;
    }).sort((a, b) => b.date?.toDate() - a.date?.toDate()); // Sort by date descending
  }, [financialTransactions, reportStartDate, reportEndDate, reportFilterType, reportFilterAssociation]);

  // Memoized calculation of total income, expenses, and net profit for the filtered transactions.
  const reportTotals = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    filteredFinancialTransactions.forEach(ft => {
      if (ft.type === 'income') {
        totalIncome += (ft.amount || 0);
      } else if (ft.type === 'expense') {
        totalExpenses += (ft.amount || 0);
      }
    });
    const netProfit = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, netProfit };
  }, [filteredFinancialTransactions]);

  // Resets all financial report filters to their default states.
  const resetFinancialReportsFilters = useCallback(() => {
    setReportStartDate('');
    setReportEndDate('');
    setReportFilterType('all');
    setReportFilterAssociation('');
  }, []);


  // --- UI Rendering Logic ---

  // Renders the main content area based on the active tab.
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full min-h-[200px]">
          <div className="text-orange-500 text-lg">Loading...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Dashboard & Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Reservation Stats Card */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
                <h3 className="font-semibold text-lg text-blue-800 mb-2">Reservation Metrics</h3>
                <p className="text-gray-700">Total Reservations: <span className="font-bold text-blue-900">{dashboardStats.totalReservations}</span></p>
                <p className="text-gray-700">Total Profit: <span className="font-bold text-blue-900">${dashboardStats.totalProfit.toFixed(2)}</span></p>
                <p className="text-gray-700">Avg. Profit/Res: <span className="font-bold text-blue-900">${dashboardStats.averageProfitPerReservation.toFixed(2)}</span></p>
                <p className="text-gray-700">Avg. Stay/Res: <span className="font-bold text-blue-900">{dashboardStats.averageStayPerReservation.toFixed(1)} nights</span></p>
              </div>

              {/* Financial Stats Card */}
              <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
                <h3 className="font-semibold text-lg text-green-800 mb-2">Financial Overview</h3>
                <p className="text-gray-700">Total Income: <span className="font-bold text-green-900">${dashboardStats.totalIncome.toFixed(2)}</span></p>
                <p className="text-gray-700">Total Expenses: <span className="font-bold text-red-900">${dashboardStats.totalExpenses.toFixed(2)}</span></p>
                <p className="text-gray-700">Net Profit/Loss: <span className={`font-bold ${dashboardStats.totalIncome - dashboardStats.totalExpenses >= 0 ? 'text-green-900' : 'text-red-900'}`}>${(dashboardStats.totalIncome - dashboardStats.totalExpenses).toFixed(2)}</span></p>
              </div>

              {/* Bus Tour Stats Card */}
              <div className="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-200">
                <h3 className="font-semibold text-lg text-purple-800 mb-2">Bus Tour Performance</h3>
                <p className="text-gray-700">Total Bus Passengers Booked: <span className="font-bold text-purple-900">{dashboardStats.totalBusPassengersBooked}</span></p>
                <p className="text-gray-700">Overall Fulfillment: <span className="font-bold text-purple-900">{dashboardStats.overallBusTourFulfillment.toFixed(1)}%</span></p>
              </div>
            </div>
          </div>
        );
      case 'reservations':
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Hotel Reservations</h2>
            {reservations.length === 0 ? (
              <p className="text-gray-600">No reservations found. Add a new reservation to get started!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Reservation Number</th>
                      <th className="py-3 px-4 text-left">Hotel</th>
                      <th className="py-3 px-4 text-left">Lead Guest</th>
                      <th className="py-3 px-4 text-left">Tour ID</th>
                      <th className="py-3 px-4 text-left">Deposit Paid</th>
                      <th className="py-3 px-4 text-left">Dates</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Profit</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {reservations.map(res => (
                      <tr key={res.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">{res.reservationNumber}</td>
                        <td className="py-3 px-4">{res.hotel}</td>
                        <td className="py-3 px-4">{res.tourists && res.tourists.length > 0 ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : 'N/A'}</td>
                        <td className="py-3 px-4">{res.linkedTourId || 'N/A'}</td>
                        <td className="py-3 px-4">{res.depositPaid ? 'Yes' : 'No'}</td>
                        <td className="py-3 px-4">
                          {res.checkIn?.toDate().toLocaleDateString()} - {res.checkOut?.toDate().toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            res.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                            res.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            res.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">${res.profit.toFixed(2)}</td>
                        <td className="py-3 px-4 flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditReservation(res)}
                            className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-md transition duration-200"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-5.69 5.69L11.586 7.586 14.414 10.414 11.586 13.242 8.758 10.414l2.828-2.828z" />
                              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm-4 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 14a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM3 18a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteReservation(res.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition duration-200"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm-1 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1zm-1 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'addReservation':
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              {selectedReservation ? 'Edit Hotel Reservation' : 'Add New Hotel Reservation'}
            </h2>
            <form onSubmit={handleSubmitReservation} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Basic Info Fields */}
              <div>
                <label htmlFor="creationDate" className="block text-sm font-medium text-gray-700">Creation Date</label>
                <input
                  type="date"
                  name="creationDate"
                  id="creationDate"
                  value={reservationForm.creationDate}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="reservationNumber" className="block text-sm font-medium text-gray-700">Reservation Number</label>
                <input
                  type="text"
                  name="reservationNumber"
                  id="reservationNumber"
                  value={reservationForm.reservationNumber}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  placeholder="Auto-generated or editable"
                />
              </div>
              <div>
                <label htmlFor="tourType" className="block text-sm font-medium text-gray-700">Tour Type</label>
                <select
                  name="tourType"
                  id="tourType"
                  value={reservationForm.tourType}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                >
                  <option value="PARTNER">PARTNER</option>
                  <option value="HOTEL ONLY">HOTEL ONLY</option>
                </select>
              </div>
              <div>
                <label htmlFor="hotel" className="block text-sm font-medium text-gray-700">Hotel</label>
                <input
                  type="text"
                  name="hotel"
                  id="hotel"
                  value={reservationForm.hotel}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="food" className="block text-sm font-medium text-gray-700">Food</label>
                <input
                  type="text"
                  name="food"
                  id="food"
                  value={reservationForm.food}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="place" className="block text-sm font-medium text-gray-700">Place</label>
                <input
                  type="text"
                  name="place"
                  id="place"
                  value={reservationForm.place}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700">Check-In Date</label>
                <input
                  type="date"
                  name="checkIn"
                  id="checkIn"
                  value={reservationForm.checkIn}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700">Check-Out Date</label>
                <input
                  type="date"
                  name="checkOut"
                  id="checkOut"
                  value={reservationForm.checkOut}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="totalNights" className="block text-sm font-medium text-gray-700">Total Nights</label>
                <input
                  type="number"
                  name="totalNights"
                  id="totalNights"
                  value={reservationForm.totalNights}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="adults" className="block text-sm font-medium text-gray-700">Adults</label>
                <input
                  type="number"
                  name="adults"
                  id="adults"
                  value={reservationForm.adults}
                  onChange={handleReservationFormChange}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="children" className="block text-sm font-medium text-gray-700">Children</label>
                <input
                  type="number"
                  name="children"
                  id="children"
                  value={reservationForm.children}
                  onChange={handleReservationFormChange}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>

              {/* Phase 2: Link to Tour */}
              <div>
                <label htmlFor="linkedTourId" className="block text-sm font-medium text-gray-700">Select Tour (Optional)</label>
                <select
                  name="linkedTourId"
                  id="linkedTourId"
                  value={reservationForm.linkedTourId}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                >
                  <option value="">-- None --</option>
                  {tours.map(tour => (
                    <option key={tour.id} value={tour.tourId}>
                      {tour.tourId} - {tour.hotel} ({tour.departureDate?.toDate().toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="approxTransportCost" className="block text-sm font-medium text-gray-700">Approx. Transport Cost</label>
                <input
                  type="number"
                  name="approxTransportCost"
                  id="approxTransportCost"
                  value={reservationForm.approxTransportCost}
                  onChange={handleReservationFormChange}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>

              {/* Tourist Details Section */}
              <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Tourist Details</h3>
                {reservationForm.tourists.map((tourist, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border border-gray-200 rounded-lg p-4 mb-4 relative">
                    <h4 className="col-span-full text-lg font-medium text-gray-700 mb-2">Tourist {index + 1}</h4>
                    {/* Remove Tourist Button */}
                    {reservationForm.tourists.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTourist(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full text-xs"
                        title="Remove Tourist"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {/* Tourist Input Fields */}
                    <div>
                      <label htmlFor={`firstName-${index}`} className="block text-sm font-medium text-gray-700">First Name</label>
                      <input type="text" name="firstName" id={`firstName-${index}`} value={tourist.firstName} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" required />
                    </div>
                    <div>
                      <label htmlFor={`fatherName-${index}`} className="block text-sm font-medium text-gray-700">Father's Name</label>
                      <input type="text" name="fatherName" id={`fatherName-${index}`} value={tourist.fatherName} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor={`familyName-${index}`} className="block text-sm font-medium text-gray-700">Family Name</label>
                      <input type="text" name="familyName" id={`familyName-${index}`} value={tourist.familyName} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" required />
                    </div>
                    <div>
                      <label htmlFor={`id-${index}`} className="block text-sm font-medium text-gray-700">ID (Unique)</label>
                      <input type="text" name="id" id={`id-${index}`} value={tourist.id} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" placeholder="e.g., Passport/National ID" required />
                    </div>
                    <div>
                      <label htmlFor={`address-${index}`} className="block text-sm font-medium text-gray-700">Address</label>
                      <input type="text" name="address" id={`address-${index}`} value={tourist.address} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor={`city-${index}`} className="block text-sm font-medium text-gray-700">City</label>
                      <input type="text" name="city" id={`city-${index}`} value={tourist.city} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor={`postCode-${index}`} className="block text-sm font-medium text-gray-700">Post Code</label>
                      <input type="text" name="postCode" id={`postCode-${index}`} value={tourist.postCode} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor={`email-${index}`} className="block text-sm font-medium text-gray-700">Email</label>
                      <input type="email" name="email" id={`email-${index}`} value={tourist.email} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor={`phone-${index}`} className="block text-sm font-medium text-gray-700">Phone</label>
                      <input type="tel" name="phone" id={`phone-${index}`} value={tourist.phone} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                  </div>
                ))}
                {/* Add Another Tourist Button */}
                <button
                  type="button"
                  onClick={addTourist}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 shadow-md"
                >
                  Add Another Tourist
                </button>
              </div>

              {/* Financial Info Section */}
              <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Financial Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="depositPaid"
                      id="depositPaid"
                      checked={reservationForm.depositPaid}
                      onChange={handleReservationFormChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="depositPaid" className="ml-2 block text-sm font-medium text-gray-700">Deposit Paid</label>
                  </div>
                  <div>
                    <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700">Deposit Amount</label>
                    <input
                      type="number"
                      name="depositAmount"
                      id="depositAmount"
                      value={reservationForm.depositAmount}
                      onChange={handleReservationFormChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="finalAmount" className="block text-sm font-medium text-gray-700">Final Amount</label>
                    <input
                      type="number"
                      name="finalAmount"
                      id="finalAmount"
                      value={reservationForm.finalAmount}
                      onChange={handleReservationFormChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="owedToHotel" className="block text-sm font-medium text-gray-700">Owed to Hotel</label>
                    <input
                      type="number"
                      name="owedToHotel"
                      id="owedToHotel"
                      value={reservationForm.owedToHotel}
                      onChange={handleReservationFormChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="profit" className="block text-sm font-medium text-gray-700">Profit</label>
                    <input
                      type="number"
                      name="profit"
                      id="profit"
                      value={reservationForm.profit.toFixed(2)}
                      readOnly
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="tourOperator" className="block text-sm font-medium text-gray-700">Tour Operator</label>
                    <input
                      type="text"
                      name="tourOperator"
                      id="tourOperator"
                      value={reservationForm.tourOperator}
                      onChange={handleReservationFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      id="status"
                      value={reservationForm.status}
                      onChange={handleReservationFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Past">Past</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="md:col-span-2 flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    resetReservationForm();
                    setActiveTab('reservations');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition duration-200 shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : selectedReservation ? 'Update Reservation' : 'Add Reservation'}
                </button>
              </div>
            </form>
          </div>
        );

      case 'customers':
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Customers List</h2>
            {customers.length === 0 ? (
              <p className="text-gray-600">No customers found. Customers are automatically added when you create a reservation.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-4 text-left">ID</th>
                      <th className="py-3 px-4 text-left">Email</th>
                      <th className="py-3 px-4 text-left">Phone</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {customers.map(cust => (
                      <tr key={cust.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">{cust.firstName} {cust.fatherName ? cust.fatherName + ' ' : ''}{cust.familyName}</td>
                        <td className="py-3 px-4">{cust.id}</td>
                        <td className="py-3 px-4">{cust.email}</td>
                        <td className="py-3 px-4">{cust.phone}</td>
                        <td className="py-3 px-4 flex justify-center">
                          <button
                            onClick={() => handleEditCustomer(cust)}
                            className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-md transition duration-200"
                            title="Edit Customer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-5.69 5.69L11.586 7.586 14.414 10.414 11.586 13.242 8.758 10.414l2.828-2.828z" />
                              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm-4 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 14a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM3 18a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Customer Edit Modal */}
            {showCustomerEditModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Edit Customer Details</h3>
                  <form onSubmit={handleUpdateCustomer} className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="edit-firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                      <input type="text" name="firstName" id="edit-firstName" value={customerEditForm.firstName} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" required />
                    </div>
                    <div>
                      <label htmlFor="edit-fatherName" className="block text-sm font-medium text-gray-700">Father's Name</label>
                      <input type="text" name="fatherName" id="edit-fatherName" value={customerEditForm.fatherName} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-familyName" className="block text-sm font-medium text-gray-700">Family Name</label>
                      <input type="text" name="familyName" id="edit-familyName" value={customerEditForm.familyName} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" required />
                    </div>
                    <div>
                      <label htmlFor="edit-id" className="block text-sm font-medium text-gray-700">ID</label>
                      <input type="text" name="id" id="edit-id" value={customerEditForm.id} readOnly className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700">Address</label>
                      <input type="text" name="address" id="edit-address" value={customerEditForm.address} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-city" className="block text-sm font-medium text-gray-700">City</label>
                      <input type="text" name="city" id="edit-city" value={customerEditForm.city} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-postCode" className="block text-sm font-medium text-gray-700">Post Code</label>
                      <input type="text" name="postCode" id="edit-postCode" value={customerEditForm.postCode} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input type="email" name="email" id="edit-email" value={customerEditForm.email} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700">Phone</label>
                      <input type="tel" name="phone" id="edit-phone" value={customerEditForm.phone} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2" />
                    </div>
                    {/* Customer Edit Modal Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-4 col-span-full">
                      <button
                        type="button"
                        onClick={() => setShowCustomerEditModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition duration-200"
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : 'Update Customer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'tours':
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Bus Tours</h2>
            {tours.length === 0 ? (
              <p className="text-gray-600">No bus tours found. Add a new tour to get started!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Tour ID</th>
                      <th className="py-3 px-4 text-left">Hotel</th>
                      <th className="py-3 px-4 text-left">Departure Date</th>
                      <th className="py-3 px-4 text-left">Arrival Date</th>
                      <th className="py-3 px-4 text-right">Max Passengers</th>
                      <th className="py-3 px-4 text-right">Booked Passengers</th>
                      <th className="py-3 px-4 text-right">Fulfillment %</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {tours.map(tour => {
                      const linkedReservations = getLinkedReservations(tour.tourId);
                      const bookedPassengers = linkedReservations.reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0);
                      const fulfillment = tour.maxPassengers > 0 ? (bookedPassengers / tour.maxPassengers) * 100 : 0;
                      return (
                        <tr key={tour.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4">{tour.tourId}</td>
                          <td className="py-3 px-4">{tour.hotel}</td>
                          <td className="py-3 px-4">{tour.departureDate?.toDate().toLocaleDateString()}</td>
                          <td className="py-3 px-4">{tour.arrivalDate?.toDate().toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-right">{tour.maxPassengers}</td>
                          <td className="py-3 px-4 text-right">{bookedPassengers}</td>
                          <td className="py-3 px-4 text-right">{fulfillment.toFixed(1)}%</td>
                          <td className="py-3 px-4 flex justify-center space-x-2">
                            <button
                              onClick={() => setSelectedTour(tour)} // View details/linked reservations
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md transition duration-200"
                              title="View Tour Details"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditTour(tour)}
                              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-md transition duration-200"
                              title="Edit Tour"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-5.69 5.69L11.586 7.586 14.414 10.414 11.586 13.242 8.758 10.414l2.828-2.828z" />
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm-4 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 14a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM3 18a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTour(tour.tourId)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition duration-200"
                              title="Delete Tour"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm-1 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1zm-1 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Tour Details Modal */}
            {selectedTour && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative">
                  <h3 className="text-2xl font-semibold mb-4 text-gray-800">Tour Details: {selectedTour.tourId}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 mb-6">
                    <div><strong>Departure:</strong> {selectedTour.departureDate?.toDate().toLocaleDateString()}</div>
                    <div><strong>Arrival:</strong> {selectedTour.arrivalDate?.toDate().toLocaleDateString()}</div>
                    <div><strong>Nights:</strong> {selectedTour.nights}</div>
                    <div><strong>Days (incl. Travel):</strong> {selectedTour.daysInclTravel}</div>
                    <div><strong>Transport Company:</strong> {selectedTour.transportCompany || 'N/A'}</div>
                    <div><strong>Hotel:</strong> {selectedTour.hotel || 'N/A'}</div>
                    <div><strong>Max Passengers:</strong> {selectedTour.maxPassengers}</div>
                    <div><strong>Booked Passengers:</strong> {getLinkedReservations(selectedTour.tourId).reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0)}</div>
                    <div><strong>Fulfillment %:</strong> {((getLinkedReservations(selectedTour.tourId).reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0) / selectedTour.maxPassengers) * 100 || 0).toFixed(1)}%</div>
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-gray-800">Linked Reservations</h4>
                  {getLinkedReservations(selectedTour.tourId).length === 0 ? (
                    <p className="text-gray-600">No reservations linked to this tour.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-60">
                      <table className="min-w-full bg-white rounded-lg overflow-hidden">
                        <thead className="bg-gray-100 text-gray-700">
                          <tr>
                            <th className="py-2 px-3 text-left text-sm">Res. No.</th>
                            <th className="py-2 px-3 text-left text-sm">Lead Guest</th>
                            <th className="py-2 px-3 text-left text-sm">Dates</th>
                            <th className="py-2 px-3 text-right text-sm">Adults/Children</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getLinkedReservations(selectedTour.tourId).map(res => (
                            <tr key={res.id} className="border-b border-gray-100">
                              <td className="py-2 px-3 text-sm">{res.reservationNumber}</td>
                              <td className="py-2 px-3 text-sm">{res.tourists && res.tourists.length > 0 ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : 'N/A'}</td>
                              <td className="py-2 px-3 text-sm">{res.checkIn?.toDate().toLocaleDateString()} - {res.checkOut?.toDate().toLocaleDateString()}</td>
                              <td className="py-2 px-3 text-right text-sm">{res.adults}/{res.children}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setSelectedTour(null)}
                      className="px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition duration-200 shadow-md"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'addTour':
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              {selectedTour ? 'Edit Bus Tour' : 'Create New Bus Tour'}
            </h2>
            <form onSubmit={handleSubmitTour} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Tour Input Fields */}
              <div>
                <label htmlFor="tourId" className="block text-sm font-medium text-gray-700">Tour ID</label>
                <input
                  type="text"
                  name="tourId"
                  id="tourId"
                  value={tourForm.tourId}
                  onChange={handleTourFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  placeholder="Auto-generated or editable"
                />
              </div>
              <div>
                <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700">Departure Date</label>
                <input
                  type="date"
                  name="departureDate"
                  id="departureDate"
                  value={tourForm.departureDate}
                  onChange={handleTourFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="arrivalDate" className="block text-sm font-medium text-gray-700">Arrival Date</label>
                <input
                  type="date"
                  name="arrivalDate"
                  id="arrivalDate"
                  value={tourForm.arrivalDate}
                  onChange={handleTourFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="nights" className="block text-sm font-medium text-gray-700">Nights</label>
                <input
                  type="number"
                  name="nights"
                  id="nights"
                  value={tourForm.nights}
                  onChange={handleTourFormChange}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="daysInclTravel" className="block text-sm font-medium text-gray-700">Days (incl. Travel)</label>
                <input
                  type="number"
                  name="daysInclTravel"
                  id="daysInclTravel"
                  value={tourForm.daysInclTravel}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="transportCompany" className="block text-sm font-medium text-gray-700">Transport Company</label>
                <input
                  type="text"
                  name="transportCompany"
                  id="transportCompany"
                  value={tourForm.transportCompany}
                  onChange={handleTourFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="hotelTour" className="block text-sm font-medium text-gray-700">Hotel (Primary for Tour)</label>
                <input
                  type="text"
                  name="hotel"
                  id="hotelTour"
                  value={tourForm.hotel}
                  onChange={handleTourFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="maxPassengers" className="block text-sm font-medium text-gray-700">Max Passengers</label>
                <input
                  type="number"
                  name="maxPassengers"
                  id="maxPassengers"
                  value={tourForm.maxPassengers}
                  onChange={handleTourFormChange}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  required
                />
              </div>

              {/* Form Action Buttons */}
              <div className="md:col-span-2 flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    resetTourForm();
                    setActiveTab('tours');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition duration-200 shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : selectedTour ? 'Update Tour' : 'Create Tour'}
                </button>
              </div>
            </form>
          </div>
        );

      case 'payments':
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Financial Transactions</h2>
            {financialTransactions.length === 0 ? (
              <p className="text-gray-600">No financial transactions found. Add income or expenses to get started!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Type</th>
                      <th className="py-3 px-4 text-left">Method</th>
                      <th className="py-3 px-4 text-left">Amount</th>
                      <th className="py-3 px-4 text-left">VAT</th>
                      <th className="py-3 px-4 text-left">Description</th>
                      <th className="py-3 px-4 text-left">Linked To</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {financialTransactions.map(ft => (
                      <tr key={ft.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">{ft.date?.toDate().toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            ft.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {ft.type.charAt(0).toUpperCase() + ft.type.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">{ft.method}</td>
                        <td className="py-3 px-4 text-right">${(ft.amount || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">${(ft.vat || 0).toFixed(2)}</td>
                        <td className="py-3 px-4">{ft.reasonDescription}</td>
                        <td className="py-3 px-4">
                          {ft.associatedReservationId ? `Res: ${ft.associatedReservationId}` :
                            ft.associatedTourId ? `Tour: ${ft.associatedTourId}` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'addFinancialTransaction':
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Add Financial Transaction</h2>
            <form onSubmit={handleSubmitFinancialTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Financial Transaction Input Fields */}
              <div>
                <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  name="date"
                  id="transactionDate"
                  value={financialTransactionForm.date}
                  onChange={handleFinancialTransactionFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  name="type"
                  id="transactionType"
                  value={financialTransactionForm.type}
                  onChange={handleFinancialTransactionFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-700">Method</label>
                <select
                  name="method"
                  id="method"
                  value={financialTransactionForm.method}
                  onChange={handleFinancialTransactionFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                >
                  <option value="Bank">Bank</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  value={financialTransactionForm.amount}
                  onChange={handleFinancialTransactionFormChange}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="vat" className="block text-sm font-medium text-gray-700">VAT (Fixed Amount)</label>
                <input
                  type="number"
                  name="vat"
                  id="vat"
                  value={financialTransactionForm.vat}
                  onChange={handleFinancialTransactionFormChange}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="reasonDescription" className="block text-sm font-medium text-gray-700">Reason/Description</label>
                <textarea
                  name="reasonDescription"
                  id="reasonDescription"
                  value={financialTransactionForm.reasonDescription}
                  onChange={handleFinancialTransactionFormChange}
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                ></textarea>
              </div>

              {/* Association fields (Reservation/Tour ID) */}
              <div>
                <label htmlFor="associatedReservationId" className="block text-sm font-medium text-gray-700">Associate with Reservation</label>
                <select
                  name="associatedReservationId"
                  id="associatedReservationId"
                  value={financialTransactionForm.associatedReservationId}
                  onChange={handleFinancialTransactionFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  disabled={financialTransactionForm.associatedTourId !== ''} // Disable if tour is selected
                >
                  <option value="">-- None --</option>
                  {reservations.map(res => (
                    <option key={res.id} value={res.reservationNumber}>
                      {res.reservationNumber} - {res.hotel} ({res.checkIn?.toDate().toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="associatedTourId" className="block text-sm font-medium text-gray-700">Associate with Tour</label>
                <select
                  name="associatedTourId"
                  id="associatedTourId"
                  value={financialTransactionForm.associatedTourId}
                  onChange={handleFinancialTransactionFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  disabled={financialTransactionForm.associatedReservationId !== ''} // Disable if reservation is selected
                >
                  <option value="">-- None --</option>
                  {tours.map(tour => (
                    <option key={tour.id} value={tour.tourId}>
                      {tour.tourId} - {tour.hotel} ({tour.departureDate?.toDate().toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Action Buttons */}
              <div className="md:col-span-2 flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    resetFinancialTransactionForm();
                    setActiveTab('payments');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition duration-200 shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : `Add ${financialTransactionForm.type === 'income' ? 'Payment' : 'Expense'}`}
                </button>
              </div>
            </form>
          </div>
        );

      case 'financialReports':
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Financial Reports</h2>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label htmlFor="reportStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="reportStartDate"
                  id="reportStartDate"
                  value={reportStartDate}
                  onChange={handleReportFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="reportEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="reportEndDate"
                  id="reportEndDate"
                  value={reportEndDate}
                  onChange={handleReportFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="reportFilterType" className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  name="reportFilterType"
                  id="reportFilterType"
                  value={reportFilterType}
                  onChange={handleReportFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                >
                  <option value="all">All</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label htmlFor="reportFilterAssociation" className="block text-sm font-medium text-gray-700">Associated With (ID)</label>
                <input
                  type="text"
                  name="reportFilterAssociation"
                  id="reportFilterAssociation"
                  value={reportFilterAssociation}
                  onChange={handleReportFilterChange}
                  placeholder="Res/Tour ID"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                />
              </div>
              <div className="md:col-span-full flex justify-end">
                <button
                  type="button"
                  onClick={resetFinancialReportsFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 shadow-sm"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200 text-center">
                <h3 className="font-semibold text-lg text-green-800">Total Income</h3>
                <p className="text-2xl font-bold text-green-900">${reportTotals.totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200 text-center">
                <h3 className="font-semibold text-lg text-red-800">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-900">${reportTotals.totalExpenses.toFixed(2)}</p>
              </div>
              <div className={`p-4 rounded-lg shadow-sm text-center ${reportTotals.netProfit >= 0 ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className="font-semibold text-lg text-gray-800">Net Profit/Loss</h3>
                <p className={`text-2xl font-bold ${reportTotals.netProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>${reportTotals.netProfit.toFixed(2)}</p>
              </div>
            </div>

            {/* Transactions Table */}
            {filteredFinancialTransactions.length === 0 ? (
              <p className="text-gray-600">No transactions match the selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Type</th>
                      <th className="py-3 px-4 text-left">Method</th>
                      <th className="py-3 px-4 text-left">Amount</th>
                      <th className="py-3 px-4 text-left">VAT</th>
                      <th className="py-3 px-4 text-left">Description</th>
                      <th className="py-3 px-4 text-left">Linked To</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {filteredFinancialTransactions.map(ft => (
                      <tr key={ft.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">{ft.date?.toDate().toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            ft.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {ft.type.charAt(0).toUpperCase() + ft.type.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">{ft.method}</td>
                        <td className="py-3 px-4 text-right">${(ft.amount || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">${(ft.vat || 0).toFixed(2)}</td>
                        <td className="py-3 px-4">{ft.reasonDescription}</td>
                        <td className="py-3 px-4">
                          {ft.associatedReservationId ? `Res: ${ft.associatedReservationId}` :
                            ft.associatedTourId ? `Tour: ${ft.associatedTourId}` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );


      default:
        return <div>Select a module from the sidebar.</div>;
    }
  };

  return (
    <div className="font-sans antialiased bg-gray-100 min-h-screen text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Custom scrollbar for better aesthetics */}
      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #e0e0e0;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Responsive typography adjustments for smaller screens */
        @media (max-width: 767px) {
          .text-2xl { font-size: 1.5rem; }
          .text-xl { font-size: 1.25rem; }
          .text-lg { font-size: 1.125rem; }
          .text-base { font-size: 1rem; }
          .py-3 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .px-4 { padding-left: 0.75rem; padding-right: 0.75rem; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-blue-900 text-white p-4 rounded-b-lg md:rounded-r-lg md:rounded-b-none shadow-lg">
          <div className="flex items-center justify-center md:justify-start mb-6">
            {/* Lion Logo Placeholder */}
            <span className="text-orange-500 text-4xl mr-3">
              🦁
            </span>
            <h1 className="text-3xl font-bold text-orange-500">Dynamex</h1>
          </div>
          <nav>
            <ul>
              <li className="mb-2">
                <button
                  onClick={() => { setActiveTab('dashboard'); resetReservationForm(); resetTourForm(); resetFinancialTransactionForm(); resetFinancialReportsFilters(); }}
                  className={`flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200
                    ${activeTab === 'dashboard' ? 'bg-orange-500 text-blue-900 shadow-md' : 'hover:bg-blue-800 text-orange-500'}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  Dashboard
                </button>
              </li>
              <li className="mb-2">
                <button
                  onClick={() => { setActiveTab('reservations'); resetReservationForm(); }}
                  className={`flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200
                    ${activeTab === 'reservations' ? 'bg-orange-500 text-blue-900 shadow-md' : 'hover:bg-blue-800 text-orange-500'}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v2m-7 13v-3a2 2 0 012-2h2a2 2 0 012 2v3m-7 0H9m-7 0h4" />
                  </svg>
                  Reservations
                </button>
              </li>
              <li className="mb-2">
                <button
                  onClick={() => { setActiveTab('addReservation'); resetReservationForm(); }}
                  className={`flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200
                    ${activeTab === 'addReservation' ? 'bg-orange-500 text-blue-900 shadow-md' : 'hover:bg-blue-800 text-orange-500'}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Add Reservation
                </button>
              </li>
              <li className="mb-2">
                <button
                  onClick={() => { setActiveTab('customers'); resetReservationForm(); }}
                  className={`flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200
                    ${activeTab === 'customers' ? 'bg-orange-500 text-blue-900 shadow-md' : 'hover:bg-blue-800 text-orange-500'}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2m3-2v2m0-7V11m0 4h.01M17 12h.01M12 12h.01M7 12h.01M6 16h9a2 2 0 002-2V7H6v9z" />
                  </svg>
                  Customers
                </button>
              </li>
              {/* Phase 2 Modules */}
              <li className="mb-2">
                <button
                  onClick={() => setActiveTab('tours')}
                  className={`flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200
                    ${activeTab === 'tours' ? 'bg-orange-500 text-blue-900 shadow-md' : 'hover:bg-blue-800 text-orange-500'}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  Bus Tours
                </button>
              </li>
              <li className="mb-2">
                <button
                  onClick={() => { setActiveTab('addTour'); resetTourForm(); }}
                  className={`flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200
                    ${activeTab === 'addTour' ? 'bg-orange-500 text-blue-900 shadow-md' : 'hover:bg-blue-800 text-orange-500'}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Create Tour
                </button>
              </li>

              {/* Phase 3 Modules */}
              <li className="mb-2">
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200
                    ${activeTab === 'payments' ? 'bg-orange-500 text-blue-900 shadow-md' : 'hover:bg-blue-800 text-orange-500'}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 11h10a1 1 0 011 1v5a1 1 0 01-1 1H7a1 1 0 01-1-1v-5a1 1 0 011-1zM12 5V4m0 20v-1m-4-11H3m18 0h-1" />
                  </svg>
                  Payments
                </button>
              </li>
              <li className="mb-2">
                <button
                  onClick={() => { setActiveTab('addFinancialTransaction'); resetFinancialTransactionForm(); }}
                  className={`flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200
                    ${activeTab === 'addFinancialTransaction' ? 'bg-orange-500 text-blue-900 shadow-md' : 'hover:bg-blue-800 text-orange-500'}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Add Payment/Expense
                </button>
              </li>

              {/* Phase 5 Modules */}
              <li className="mb-2">
                <button
                  onClick={() => { setActiveTab('financialReports'); resetFinancialReportsFilters(); }}
                  className={`flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200
                    ${activeTab === 'financialReports' ? 'bg-orange-500 text-blue-900 shadow-md' : 'hover:bg-blue-800 text-orange-500'}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-4m0 0h3m-3 0H7m-1 0v4m-2-4h2a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2h4m2 10h.01M17 17v-4m0 0h3m-3 0H17m-1 0v4m-2-4h2a2 2 0 012 2v2a2 2 0 01-2 2H14a2 2 0 01-2-2V7a2 2 0 012-2h4m2 10h.01M7 11a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1h2a1 1 0 011 1v2z" />
                  </svg>
                  Financial Reports
                </button>
              </li>
            </ul>
          </nav>
          {/* Display current user ID */}
          {userId && (
            <div className="mt-8 pt-4 border-t border-blue-800 text-sm text-gray-400">
              <p>User ID:</p>
              <p className="break-all font-mono text-xs">{userId}</p>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Error and Message Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          )}
          {message && (
            <div className={`px-4 py-3 rounded-md relative mb-4 ${message.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-blue-100 border border-blue-400 text-blue-700'}`} role="alert">
              <span className="block sm:inline">{message.text}</span>
            </div>
          )}
          {renderContent()}
        </main>
      </div>

      {/* Render the custom confirmation modal */}
      <ConfirmationModal
        show={showConfirmModal}
        title={confirmModalContent.title}
        message={confirmModalContent.message}
        onConfirm={confirmModalContent.onConfirm}
        onCancel={confirmModalContent.onCancel}
      />
    </div>
  );
};

export default App;
