import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// Import Firebase modules
import {
  app,
  auth,
  db,
  appId,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from './firebase';
import { collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';

// Import your logo image
import Logo from './Logo.png'; // Assuming Logo.png is in the same directory as App.jsx
import InvoicePrint from './InvoicePrint.jsx'; // New component for printing
import CustomerContractPrint from './CustomerContractPrint.jsx'; // New component for customer contract generation
import BusTourContractPrint from './BusTourContractPrint.jsx'; // New component for bus tour contract generation

// --- Notification Display Component ---
const NotificationDisplay = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 w-full max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          // Changed bg-*, border-*, text-* for a softer look consistent with the theme
          className={`p-4 rounded-lg shadow-md flex items-center justify-between transition-all duration-300 ease-in-out transform
            ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
              notification.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' :
              notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
              notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-gray-50 border border-gray-200 text-gray-800'
            }`}
        >
          <span className="font-medium">{notification.message}</span>
          {notification.dismissible && (
            <button onClick={() => onDismiss(notification.id)} className="ml-4 text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ show, message, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm relative"> {/* Rounded-xl and shadow-xl for consistency */}
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirm Action</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 shadow-sm" // Rounded-lg, hover:bg-gray-100
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            // Adjusted color to match red in screenshot, rounded-lg, subtle shadow
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 shadow-md"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};


const App = () => {
  // Authentication states
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isEmailPasswordUser, setIsEmailPasswordUser] = useState(false);

  // Application state for navigation and selected items
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [viewingReservation, setViewingReservation] = useState(null); // State for the details modal
  const [expandedReservationId, setExpandedReservationId] = useState(null); // State for expandable payment rows
  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedFinancialTransaction, setSelectedFinancialTransaction] = useState(null);
  // State for currently selected expense invoice for editing
  const [selectedExpenseInvoice, setSelectedExpenseInvoice] = useState(null);
  // State for currently selected product for editing
  const [selectedProduct, setSelectedProduct] = useState(null);
  // New: State for currently selected sales invoice for editing
const [selectedSalesInvoice, setSelectedSalesInvoice] = useState(null);
// NEW STATE FOR CONTRACT GENERATION
  const [reservationToGenerateContract, setReservationToGenerateContract] = useState(null);
  const [tourToGenerateContract, setTourToGenerateContract] = useState(null); // New state for bus tour contract
  // New: Search term states
 // New: Search term states
  const [searchCustomerTerm, setSearchCustomerTerm] = useState('');
  const [searchReservationTerm, setSearchReservationTerm] = useState('');

  // New: Sort configuration for financial reports
// Sort configuration for financial reports
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });

  // New: State to hold the invoice object for printing
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  // Data states - populated from Firestore (user-specific)
  const [reservations, setReservations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tours, setTours] = useState([]);
  const [financialTransactions, setFinancialTransactions] = useState([]);
  // Invoicing data states
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [expenseInvoices, setExpenseInvoices] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const notificationIdCounter = useRef(0); // For unique notification IDs

  // State for Add/Edit Reservation Form
// State for Add/Edit Reservation Form
// State for Add/Edit Reservation Form
  const [reservationForm, setReservationForm] = useState({
    creationDate: '',
    reservationNumber: '',
    tourType: 'HOTEL ONLY',
    hotel: '',
    food: '',
    roomType: '', // New field
    place: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    tourists: [{
      mode: 'new', // 'new' or 'existing'
      firstName: '',
      fatherName: '',
      familyName: '',
      id: '',
      realId: '',
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

  // State for Add/Edit Tour Form
const [tourForm, setTourForm] = useState({
     tourId: '',
     departureDate: '',
     arrivalDate: '',
     nights: 0,
     daysInclTravel: 0,
     transportCompany: '', // Existing
     departureDateTimePlace: '', // NEW: Час и място на тръгване (combined)
     transportDescription: '', // NEW: 2. Транспорт (general description)
     insuranceDetails: '', // NEW: Застраховка
     tourHotels: '', // NEW: Multiple hotels input
     tourRoomSummary: '', // NEW: Room types and count of rooms for the tour
     mealsIncluded: '', // NEW: Брой и вид на храненията, включени в пакетната цена
     hotel: '', // Existing
     maxPassengers: 0, // Existing
   });
  // State for Edit Customer Form (used in a modal)
// State for Edit Customer Form (used in a modal)
  const [customerEditForm, setCustomerEditForm] = useState({
    id: '',
    realId: '', // New field for Real ID
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

  // State for Add Payment/Expense Form
  const [financialTransactionForm, setFinancialTransactionForm] = useState({
    date: '',
    method: 'Bank',
    amount: 0,
    reasonDescription: '',
    vat: 0,
    type: 'income',
    associatedReservationId: '',
    associatedTourId: '',
  });

 // States for Financial Reports filters
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportFilterType, setReportFilterType] = useState('all');
  const [reportFilterMethod, setReportFilterMethod] = useState('all'); // New filter state
  const [reportFilterAssociation, setReportFilterAssociation] = useState('');

  
  // States for Filters on Reservations
  const [filterReservationStatus, setFilterReservationStatus] = useState('All');
  const [filterReservationHotel, setFilterReservationHotel] = useState('');
  const [filterReservationTourType, setFilterReservationTourType] = useState('All');
  const [filterReservationCheckInDate, setFilterReservationCheckInDate] = useState('');
  const [filterReservationCheckOutDate, setFilterReservationCheckOutDate] = useState('');

  // States for Filters on Tours
  const [filterTourHotel, setFilterTourHotel] = useState('');
  const [filterTourTransportCompany, setFilterTourTransportCompany] = useState('');
  const [filterTourDepartureDate, setFilterTourDepartureDate] = useState('');
  const [filterTourArrivalDate, setFilterTourArrivalDate] = useState('');

  // State for Delete Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // Currency Conversion Rate
  const EUR_TO_BGN_RATE = 1.95583;

  // New: State for Expense Invoice Form
  const [expenseInvoiceForm, setExpenseInvoiceForm] = useState({
    companyName: '',
    companyID: '',
    vatID: '',
    invoiceNumber: '',
    invoiceDate: '',
    productsServices: '', // Will be a string for now, can be array of objects later
    paymentMethod: 'Bank',
    dueDate: '',
    totalAmount: 0,
    totalVAT: 0, // This VAT will be negative in dashboard calculations
    notes: ''
  });

  // New: State for Product Form
  const [productForm, setProductForm] = useState({
    productCode: '',
    productName: '',
    price: 0,
    vatRate: 20 // Default VAT rate, can be adjusted
  });

  // New: State for Sales Invoice Form
// New: State for Sales Invoice Form
 const [salesInvoiceForm, setSalesInvoiceForm] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    clientName: '',
    clientMOL: '',
    clientID: '',
    clientVATID: '',
    clientAddress: '',
    clientCity: '',
    clientPostCode: '',
    products: [],
    paymentMethod: 'Cash',
    bankDetails: {
      iban: 'BG87BPBI79301036586601',
      bankName: 'Пощенска банка'
    },
    dueDate: '',
    isCopy: false,
    totalAmount: 0,
    totalVAT: 0,
    grandTotal: 0,
    notes: '',
    // New editable fields
    transactionBasis: 'Услуга',
    transactionDescription: 'ТУРИСТИЧЕСКИ УСЛУГИ',
    transactionPlace: 'България',
    receivedBy: '',
  });


  // --- Notification System Functions ---
  const addNotification = useCallback((message, type = 'info', dismissible = true, autoDismiss = 5000) => {
    const id = notificationIdCounter.current++;
    setNotifications(prev => [...prev, { id, message, type, dismissible }]);

    if (autoDismiss && dismissible) {
      setTimeout(() => {
        removeNotification(id);
      }, autoDismiss);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Override the previous showMessage to use the new notification system
  const showMessage = useCallback((msg, type = 'success') => {
    addNotification(msg, type);
  }, [addNotification]);


  // --- Firebase Authentication Management ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Ensure it's an email/password user, not an anonymous one
        const isCurrentEmailPasswordUser = user.isAnonymous === false && user.providerData.some(provider => provider.providerId === 'password');

        if (!isCurrentEmailPasswordUser) {
          // If it's an anonymous user, sign them out to force proper login
          console.log("Detected non-email/password user. Signing out to force login form.");
          signOut(auth).catch(err => console.error("Error signing out anonymous user:", err));
          setUserId(null);
          setIsEmailPasswordUser(false);
        } else {
          setUserId(user.uid);
          setIsEmailPasswordUser(true);
          console.log("Firebase User Authenticated:", user.uid, "Email/Password:", true);
        }
      } else {
        setUserId(null);
        setIsEmailPasswordUser(false);
        console.log("No Firebase User. Displaying login/register form.");
      }
      setIsAuthReady(true);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, userEmail, userPassword);
      showMessage('Logged in successfully!', 'success');
      setUserEmail('');
      setUserPassword('');
    } catch (err) {
      console.error("Login error:", err);
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, userEmail, userPassword);
      showMessage('Account created and logged in successfully!', 'success');
      setUserEmail('');
      setUserPassword('');
    } catch (err) {
      console.error("Registration error:", err);
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      showMessage('Logged out successfully!', 'info');
      // Clear all state data on logout for security and data integrity
      setReservations([]);
      setCustomers([]);
      setTours([]);
      setFinancialTransactions([]);
      setSalesInvoices([]);
      setExpenseInvoices([]);
      setProducts([]);
      setActiveTab('dashboard'); // Redirect to dashboard or login
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to log out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Firestore Data Listeners (user-specific) ---
  useEffect(() => {
    let unsubscribe;
    if (isAuthReady && userId) {
      setLoading(true);
      const reservationsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
      unsubscribe = onSnapshot(reservationsCollectionRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setReservations(data);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching reservations:", err);
        setError("Failed to load reservations. Please try again.");
        setLoading(false);
      });
    } else if (isAuthReady && !userId) {
      setReservations([]);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthReady, userId]);

  useEffect(() => {
    let unsubscribe;
    if (isAuthReady && userId) {
      setLoading(true);
      const customersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/customers`);
      unsubscribe = onSnapshot(customersCollectionRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setCustomers(data);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching customers:", err);
        setError("Failed to load customers. Please try again.");
        setLoading(false);
      });
    } else if (isAuthReady && !userId) {
      setCustomers([]);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthReady, userId]);

  useEffect(() => {
    let unsubscribe;
    if (isAuthReady && userId) {
      setLoading(true);
      const toursCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tours`);
      unsubscribe = onSnapshot(toursCollectionRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setTours(data);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching tours:", err);
        setError("Failed to load tours. Please try again.");
        setLoading(false);
      });
    } else if (isAuthReady && !userId) {
      setTours([]);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthReady, userId]);

  useEffect(() => {
    let unsubscribe;
    if (isAuthReady && userId) {
      setLoading(true);
      const financialTransactionsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/financialTransactions`);
      unsubscribe = onSnapshot(financialTransactionsCollectionRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setFinancialTransactions(data);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching financial transactions:", err);
        setError("Failed to load financial transactions. Please try again.");
        setLoading(false);
      });
    } else if (isAuthReady && !userId) {
      setFinancialTransactions([]);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthReady, userId]);

  // Firestore listener for Sales Invoices
  useEffect(() => {
    let unsubscribe;
    if (isAuthReady && userId) {
      setLoading(true);
      const salesInvoicesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/invoices_sales`);
      unsubscribe = onSnapshot(salesInvoicesCollectionRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setSalesInvoices(data);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching sales invoices:", err);
        setError("Failed to load sales invoices. Please try again.");
        setLoading(false);
      });
    } else if (isAuthReady && !userId) {
      setSalesInvoices([]);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthReady, userId]);

  // Firestore listener for Expense Invoices
  useEffect(() => {
    let unsubscribe;
    if (isAuthReady && userId) {
      setLoading(true);
      const expenseInvoicesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/invoices_expenses`);
      unsubscribe = onSnapshot(expenseInvoicesCollectionRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setExpenseInvoices(data);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching expense invoices:", err);
        setError("Failed to load expense invoices. Please try again.");
        setLoading(false);
      });
    } else if (isAuthReady && !userId) {
      setExpenseInvoices([]);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthReady, userId]);

  // Firestore listener for Products
  useEffect(() => {
    let unsubscribe;
    if (isAuthReady && userId) {
      setLoading(true);
      const productsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/products`);
      unsubscribe = onSnapshot(productsCollectionRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setProducts(data);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again.");
        setLoading(false);
      });
    } else if (isAuthReady && !userId) {
      setProducts([]);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthReady, userId]);


  // --- Helper Functions ---

  const calculateDaysBetweenDates = (date1, date2) => {
    if (date1 && date2) {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const generateReservationNumber = useCallback(async () => {
    if (!userId) return null;
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/reservations`));
    const querySnapshot = await getDocs(q);
    let highestNum = 100100;
    querySnapshot.forEach((doc) => {
      const res = doc.data();
      if (res.reservationNumber && res.reservationNumber.startsWith('DYT')) {
        const numPart = parseInt(res.reservationNumber.substring(3), 10);
        if (!isNaN(numPart) && numPart > highestNum) {
          highestNum = numPart;
        }
      }
    });
    return `DYT${highestNum + 1}`;
  }, [userId]);

  const generateTourId = useCallback(async () => {
    if (!userId) return null;
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/tours`));
    const querySnapshot = await getDocs(q);
    let highestNum = 0;
    querySnapshot.forEach((doc) => {
      const tour = doc.data();
      if (tour.tourId && tour.tourId.startsWith('DYT')) {
        const numPart = parseInt(tour.tourId.substring(3), 10);
        if (!isNaN(numPart) && numPart > highestNum) {
          highestNum = numPart;
        }
      }
    });
    return `DYT${String(highestNum + 1).padStart(3, '0')}`;
  }, [userId]);

  // Generate Invoice Number for Expenses
  const generateExpenseInvoiceNumber = useCallback(async () => {
    if (!userId) return null;
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/invoices_expenses`));
    const querySnapshot = await getDocs(q);
    let highestNum = 0;
    querySnapshot.forEach((doc) => {
      const inv = doc.data();
      if (inv.invoiceNumber && inv.invoiceNumber.startsWith('DYT')) {
        const numPart = parseInt(inv.invoiceNumber.substring(3), 10);
        if (!isNaN(numPart) && numPart > highestNum) {
          highestNum = numPart;
        }
      }
    });
    return `DYT${String(highestNum + 1).padStart(7, '0')}`; // DYT0000001
  }, [userId]);

  // New: Generate Product Code
  const generateProductCode = useCallback(async () => {
    if (!userId) return null;
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/products`));
    const querySnapshot = await getDocs(q);
    let highestNum = 0;
    querySnapshot.forEach((doc) => {
      const prod = doc.data();
      if (prod.productCode && prod.productCode.startsWith('PROD')) {
        const numPart = parseInt(prod.productCode.substring(4), 10);
        if (!isNaN(numPart) && numPart > highestNum) {
          highestNum = numPart;
        }
      }
    });
    return `PROD${String(highestNum + 1).padStart(4, '0')}`; // PROD0001
  }, [userId]);

  // New: Generate Sales Invoice Number
  const generateSalesInvoiceNumber = useCallback(async () => {
    if (!userId) return null;
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/invoices_sales`));
    const querySnapshot = await getDocs(q);
    let highestNum = 0;
    querySnapshot.forEach((doc) => {
      const inv = doc.data();
      if (inv.invoiceNumber && inv.invoiceNumber.startsWith('DYT')) {
        const numPart = parseInt(inv.invoiceNumber.substring(3), 10);
        if (!isNaN(numPart) && numPart > highestNum) {
          highestNum = numPart;
        }
      }
    });
    return `DYT${String(highestNum + 1).padStart(7, '0')}`; // DYT0000001
  }, [userId]);


  // --- Handlers for Reservation Form ---

  const handleReservationFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setReservationForm(prev => {
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      if (name === 'checkIn' || name === 'checkOut') {
        newState.totalNights = calculateDaysBetweenDates(newState.checkIn, newState.checkOut);
      }
      // Updated profit calculation
      if (['finalAmount', 'owedToHotel', 'approxTransportCost'].includes(name)) {
        const final = parseFloat(newState.finalAmount) || 0;
        const owed = parseFloat(newState.owedToHotel) || 0;
        const transport = parseFloat(newState.approxTransportCost) || 0;
        newState.profit = final - owed - transport;
      }
      return newState;
    });
  }, []);

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

  const handleTouristModeChange = useCallback((index, newMode) => {
    setReservationForm(prev => {
      const newTourists = [...prev.tourists];
      const currentTourist = { ...newTourists[index], mode: newMode };

      // If switching back to 'new', clear the fields to prevent confusion
      if (newMode === 'new') {
        currentTourist.firstName = '';
        currentTourist.fatherName = '';
        currentTourist.familyName = '';
        currentTourist.id = '';
        currentTourist.realId = '';
        currentTourist.address = '';
        currentTourist.city = '';
        currentTourist.postCode = '';
        currentTourist.email = '';
        currentTourist.phone = '';
      }

      newTourists[index] = currentTourist;
      return { ...prev, tourists: newTourists };
    });
  }, []);

  const handleExistingTouristSelect = useCallback((index, selectedCustomerId) => {
    // Find the full customer object from our customers state
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!selectedCustomer) return;

    setReservationForm(prev => {
      const newTourists = [...prev.tourists];
      // Overwrite the specific tourist's data with the selected customer's data
      newTourists[index] = {
        ...selectedCustomer,
        mode: 'existing', // Ensure the mode is set to 'existing'
      };
      return { ...prev, tourists: newTourists };
    });
  }, [customers]); // We need to re-run this if the customers list changes

const addTourist = useCallback(() => {
    setReservationForm(prev => ({
      ...prev,
      tourists: [...prev.tourists, {
        mode: 'new', firstName: '', fatherName: '', familyName: '', id: '', realId: '', address: '',
        city: '', postCode: '', email: '', phone: ''
      }],
    }));
  }, []);

  const removeTourist = useCallback((index) => {
    setReservationForm(prev => ({
      ...prev,
      tourists: prev.tourists.filter((_, i) => i !== index),
    }));
  }, []);

  // --- Customer Management (uses Firestore user-specific collection) ---
const manageCustomerRecords = useCallback(async (tourists) => {
    if (!userId) return;
    const customersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/customers`);

    for (const tourist of tourists) {
      // If the tourist was selected from the existing list, we don't need to update their record from here.
      if (tourist.mode === 'existing') {
        continue;
      }

      if (!tourist.id) {
        console.warn("Skipping customer record management for a tourist without an ID (ID is required for Firestore).");
        continue;
      }

      const q = query(customersCollectionRef, where("id", "==", tourist.id));
      const querySnapshot = await getDocs(q);

const customerData = {
        firstName: tourist.firstName,
        fatherName: tourist.fatherName,
        familyName: tourist.familyName,
        address: tourist.address,
        city: tourist.city,
        postCode: tourist.postCode,
        email: tourist.email,
        phone: tourist.phone,
        id: tourist.id,
        realId: tourist.realId,
      };

      if (!querySnapshot.empty) {
        const docToUpdate = querySnapshot.docs[0].ref;
        await setDoc(docToUpdate, customerData, { merge: true });
        console.log(`Customer ${tourist.id} updated.`);
      } else {
        await addDoc(customersCollectionRef, customerData);
        console.log(`Customer ${tourist.id} added.`);
      }
    }
  }, [userId]);


  // --- Submit Reservation Form (uses Firestore user-specific collection) ---
  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    addNotification(''); // Clear previous messages

    if (!userId) {
      addNotification("User not authenticated. Please log in to save data.", 'error');
      setLoading(false);
      return;
    }

    try {
      let currentReservationNumber = reservationForm.reservationNumber;
      if (!selectedReservation && !currentReservationNumber) {
        currentReservationNumber = await generateReservationNumber();
        setReservationForm(prev => ({ ...prev, reservationNumber: currentReservationNumber }));
      }

      const finalProfit = (parseFloat(reservationForm.finalAmount) || 0) -
                           (parseFloat(reservationForm.owedToHotel) || 0) -
                           (parseFloat(reservationForm.approxTransportCost) || 0);


      const reservationData = {
        ...reservationForm,
        reservationNumber: currentReservationNumber,
        depositPaid: reservationForm.depositPaid, // Ensure boolean is passed correctly
        depositAmount: parseFloat(reservationForm.depositAmount) || 0,
        finalAmount: parseFloat(reservationForm.finalAmount) || 0,
        owedToHotel: parseFloat(reservationForm.owedToHotel) || 0,
        profit: finalProfit, // Use the newly calculated profit
        adults: parseInt(reservationForm.adults) || 0,
        children: parseInt(reservationForm.children) || 0,
        approxTransportCost: parseFloat(reservationForm.approxTransportCost) || 0,
        creationDate: reservationForm.creationDate,
        checkIn: reservationForm.checkIn,
        checkOut: reservationForm.checkOut,
        totalNights: calculateDaysBetweenDates(reservationForm.checkIn, reservationForm.checkOut),
        tourists: reservationForm.tourists ? reservationForm.tourists.map(t => ({ ...t })) : [], // Ensure tourists is an array
      };

      await manageCustomerRecords(reservationForm.tourists);

      const reservationsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);

      if (selectedReservation) {
        const resDocRef = doc(reservationsCollectionRef, selectedReservation.id);
        await setDoc(resDocRef, reservationData, { merge: true });
        addNotification('Reservation updated successfully!', 'success');
      } else {
        await addDoc(reservationsCollectionRef, reservationData);
        addNotification('Reservation added successfully!', 'success');
      }

      resetReservationForm();
      setActiveTab('reservations');
    } catch (err) {
      console.error("Error saving reservation:", err);
      setError(`Failed to save reservation: ${err.message || err.toString()}`);
      addNotification(`Failed to save reservation: ${err.message || err.toString()}`, 'error');
    } finally {
      setLoading(false);
    }
  };

const resetReservationForm = useCallback(() => {
    setReservationForm({
      creationDate: '', reservationNumber: '', tourType: 'HOTEL ONLY', hotel: '',
      food: '', roomType: '', place: '', checkIn: '', checkOut: '', adults: 1, children: 0,
      tourists: [{
        mode: 'new', firstName: '', fatherName: '', familyName: '', id: '', realId: '', address: '',
        city: '', postCode: '', email: '', phone: ''
      }],
      depositPaid: false, depositAmount: 0, finalAmount: 0, owedToHotel: 0,
      profit: 0, tourOperator: '', status: 'Pending', linkedTourId: '', approxTransportCost: 0,
    });
    setSelectedReservation(null);
  }, []);

  // --- Edit Reservation Logic (uses Firestore user-specific collection) ---
const handleEditReservation = useCallback((reservation) => {
    setReservationForm({
      clientMOL: '', // Default value for old invoices
      ...reservation,
      roomType: reservation.roomType || '', // Add default for new field
      adults: parseInt(reservation.adults) || 0,
      children: parseInt(reservation.children) || 0,
      depositAmount: parseFloat(reservation.depositAmount) || 0,
      finalAmount: parseFloat(reservation.finalAmount) || 0,
      owedToHotel: parseFloat(reservation.owedToHotel) || 0,
      profit: parseFloat(reservation.profit) || 0,
      approxTransportCost: parseFloat(reservation.approxTransportCost) || 0,
      // Ensure old reservations are compatible with the new tourist data structure
      tourists: reservation.tourists ? reservation.tourists.map(t => ({
        mode: 'new', // Default to 'new' mode for existing data
        realId: '',  // Ensure realId exists with a default value
        ...t,        // Spread the existing tourist data, which will overwrite defaults if present
      })) : [],
    });
    setSelectedReservation(reservation);
    setActiveTab('addReservation');
  }, []);
  // --- Delete Reservation Logic (uses Firestore user-specific collection) ---
  const handleDeleteReservation = useCallback((reservationId) => {
    setConfirmMessage("Are you sure you want to delete this reservation?");
    setConfirmAction(() => async () => {
      setLoading(true);
      setError(null);
      addNotification('');
      if (!userId) {
        addNotification("User not authenticated. Please log in to delete data.", 'error');
        setLoading(false);
        return;
      }
      try {
        const reservationDocRef = doc(db, `artifacts/${appId}/users/${userId}/reservations`, reservationId);
        await deleteDoc(reservationDocRef);
        addNotification('Reservation deleted successfully!', 'success');
      } catch (err) {
        console.error("Error deleting reservation:", err);
        setError("Failed to delete reservation. Please try again.");
        addNotification(`Failed to delete reservation: ${err.message || err.toString()}`, 'error');
      } finally {
        setLoading(false);
      }
    });
    setShowConfirmModal(true);
  }, [userId, addNotification]);

  // --- Customer Management (uses Firestore user-specific collection) ---
const handleEditCustomer = (customer) => {
    // Ensure old customer data is compatible with the new form state
    setCustomerEditForm({
      realId: '', // Default value for the new field
      ...customer,  // Spread existing data, which will overwrite the default if it exists
    });
    setShowCustomerEditModal(true);
  };

  const handleCustomerEditFormChange = (e) => {
    const { name, value } = e.target;
    setCustomerEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!customerEditForm.id) {
      setError("Customer ID not found. Cannot update.");
      addNotification("Customer ID not found. Cannot update.", 'error');
      return;
    }

    setLoading(true);
    setError(null);
    addNotification('');

    if (!userId) {
      addNotification("User not authenticated. Please log in to update data.", 'error');
      setLoading(false);
      return;
    }

    try {
      const customerDocRef = doc(db, `artifacts/${appId}/users/${userId}/customers`, customerEditForm.id);
      await setDoc(customerDocRef, customerEditForm, { merge: true });
      addNotification('Customer updated successfully!', 'success');
      setShowCustomerEditModal(false);
    } catch (err) {
      console.error("Error updating customer:", err);
      setError("Failed to update customer. Please try again.");
      addNotification(`Failed to update customer: ${err.message || err.toString()}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Tour Module Logic (uses Firestore user-specific collection) ---
  const handleTourFormChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setTourForm(prev => {
      const newState = {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      };
      if (name === 'departureDate' || name === 'arrivalDate') {
        newState.daysInclTravel = calculateDaysBetweenDates(newState.departureDate, newState.arrivalDate) + 1;
      }
      return newState;
    });
  }, []);

  const handleSubmitTour = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    addNotification('');

    if (!userId) {
      addNotification("User not authenticated. Please log in to save data.", 'error');
      setLoading(false);
      return;
    }

    try {
      let currentTourId = tourForm.tourId;
      if (!currentTourId) {
        currentTourId = await generateTourId();
        setTourForm(prev => ({ ...prev, tourId: currentTourId }));
      }

      const tourData = {
        ...tourForm,
        tourId: currentTourId,
        nights: parseInt(tourForm.nights) || 0,
        daysInclTravel: calculateDaysBetweenDates(tourForm.departureDate, tourForm.arrivalDate) + 1,
        maxPassengers: parseInt(tourForm.maxPassengers) || 0,
        departureDate: tourForm.departureDate,
        arrivalDate: tourForm.arrivalDate,
      };

      const toursCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tours`);

      if (selectedTour) {
        const tourDocRef = doc(toursCollectionRef, selectedTour.id);
        await setDoc(tourDocRef, tourData, { merge: true });
        addNotification('Tour updated successfully!', 'success');
      } else {
        await addDoc(toursCollectionRef, tourData);
        addNotification('Tour added successfully!', 'success');
      }

      resetTourForm();
      setActiveTab('tours');
    } catch (err) {
      console.error("Error saving tour:", err);
      setError(`Failed to save tour: ${err.message || err.toString()}`);
      addNotification(`Failed to save tour: ${err.message || err.toString()}`, 'error');
    } finally {
      setLoading(false);
    }
  };

 const resetTourForm = useCallback(() => {
     setTourForm({
       tourId: '', departureDate: '', arrivalDate: '', nights: 0, daysInclTravel: 0,
       transportCompany: '',
       departureDateTimePlace: '', // NEW
       transportDescription: '', // NEW
       insuranceDetails: '', // NEW
       tourHotels: '', // NEW
       tourRoomSummary: '', // NEW
       mealsIncluded: '', // NEW
       hotel: '',
       maxPassengers: 0,
     });
     setSelectedTour(null);
   }, []);

 const handleEditTour = useCallback((tour) => {
     setTourForm({
       ...tour,
       nights: parseInt(tour.nights) || 0,
       daysInclTravel: parseInt(tour.daysInclTravel) || 0,
       maxPassengers: parseInt(tour.maxPassengers) || 0,
       departureDateTimePlace: tour.departureDateTimePlace || '', // NEW
       transportDescription: tour.transportDescription || '', // NEW
       insuranceDetails: tour.insuranceDetails || '', // NEW
       tourHotels: tour.tourHotels || '', // NEW
       tourRoomSummary: tour.tourRoomSummary || '', // NEW
       mealsIncluded: tour.mealsIncluded || '', // NEW
     });
     setSelectedTour(tour);
     setActiveTab('addTour');
   }, []);

  const handleDeleteTour = useCallback((tourId) => {
    setConfirmMessage("Are you sure you want to delete this tour? This will not un-link existing reservations.");
    setConfirmAction(() => async () => {
      setLoading(true);
      setError(null);
      addNotification('');
      if (!userId) {
        addNotification("User not authenticated. Please log in to delete data.", 'error');
        setLoading(false);
        return;
      }
      try {
        const toursCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tours`);
        const q = query(toursCollectionRef, where("tourId", "==", tourId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docToDelete = querySnapshot.docs[0].ref;
          await deleteDoc(docToDelete);
          addNotification('Tour deleted successfully!', 'success');
        } else {
          setError("Tour not found or already deleted.");
          addNotification("Tour not found or already deleted.", 'error');
        }
      } catch (err) {
        console.error("Error deleting tour:", err);
        setError("Failed to delete tour. Please try again.");
        addNotification(`Failed to delete tour: ${err.message || err.toString()}`, 'error');
      } finally {
        setLoading(false);
      }
    });
    setShowConfirmModal(true);
  }, [userId, addNotification]);

  const getLinkedReservations = useCallback((tourId) => {
    return reservations.filter(res => res.linkedTourId === tourId);
  }, [reservations]);


  // --- Financial Transaction Module Logic (uses Firestore user-specific collection) ---

  const handleFinancialTransactionFormChange = useCallback((e) => {
    const { name, value, type } = e.target;
    // This version simply updates the field that was changed, without affecting the other.
    setFinancialTransactionForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  }, []);

  const handleSubmitFinancialTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    addNotification('');

    if (!userId) {
      addNotification("User not authenticated. Please log in to save data.", 'error');
      setLoading(false);
      return;
    }

    try {
      const transactionData = {
        ...financialTransactionForm,
        amount: parseFloat(financialTransactionForm.amount) || 0,
        vat: parseFloat(financialTransactionForm.vat) || 0,
        date: financialTransactionForm.date,
      };

      const financialTransactionsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/financialTransactions`);

      if (selectedFinancialTransaction) {
        const ftDocRef = doc(financialTransactionsCollectionRef, selectedFinancialTransaction.id);
        await setDoc(ftDocRef, transactionData, { merge: true });
        addNotification('Transaction updated successfully!', 'success');
      } else {
        await addDoc(financialTransactionsCollectionRef, transactionData);
        addNotification(`${financialTransactionForm.type === 'income' ? 'Payment' : 'Expense'} added successfully!`, 'success');
      }

      resetFinancialTransactionForm();
      setActiveTab('payments');
    } catch (err) {
      console.error("Error saving financial transaction:", err);
      setError(`Failed to save financial transaction: ${err.message || err.toString()}`, 'error');
      addNotification(`Failed to save financial transaction: ${err.message || err.toString()}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetFinancialTransactionForm = useCallback(() => {
    setFinancialTransactionForm({
      date: '', method: 'Bank', amount: 0, reasonDescription: '', vat: 0,
      type: 'income', associatedReservationId: '', associatedTourId: '',
    });
    setSelectedFinancialTransaction(null);
  }, []);

  const handleEditFinancialTransaction = useCallback((transaction) => {
    setFinancialTransactionForm({
      ...transaction,
      amount: parseFloat(transaction.amount) || 0,
      vat: parseFloat(transaction.vat) || 0,
    });
    setSelectedFinancialTransaction(transaction);
    setActiveTab('addFinancialTransaction');
  }, []);

  const handleDeleteFinancialTransaction = useCallback((transactionId) => {
    setConfirmMessage("Are you sure you want to delete this financial transaction?");
    setConfirmAction(() => async () => {
      setLoading(true);
      setError(null);
      addNotification('');
      if (!userId) {
        addNotification("User not authenticated. Please log in to delete data.", 'error');
        setLoading(false);
        return;
      }
      try {
        const ftDocRef = doc(db, `artifacts/${appId}/users/${userId}/financialTransactions`, transactionId);
        await deleteDoc(ftDocRef);
        addNotification('Transaction deleted successfully!', 'success');
      } catch (err) {
        console.error("Error deleting financial transaction:", err);
        setError("Failed to delete financial transaction. Please try again.");
        addNotification(`Failed to delete financial transaction: ${err.message || err.toString()}`, 'error');
      } finally {
        setLoading(false);
      }
    });
    setShowConfirmModal(true);
  }, [userId, addNotification]);


  // --- Dashboard Calculations (Uses Firestore user-specific data) ---
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

    // --- New Balance Calculations ---
    const balances = {
      Bank: { income: 0, expense: 0 },
      Cash: { income: 0, expense: 0 },
      'Cash 2': { income: 0, expense: 0 },
    };

    financialTransactions.forEach(ft => {
      if (balances[ft.method]) {
        balances[ft.method][ft.type] += (ft.amount || 0);
      }
    });

    const bankBalance = balances.Bank.income - balances.Bank.expense;
    const cashBalance = balances.Cash.income - balances.Cash.expense;
    const cash2Balance = balances['Cash 2'].income - balances['Cash 2'].expense;
    // --- End of New Calculations ---

    return {
      totalReservations,
      totalProfit,
      averageProfitPerReservation,
      averageStayPerReservation,
      totalIncome,
      totalExpenses,
      overallBusTourFulfillment,
      totalBusPassengersBooked: totalBookedPassengersAcrossAllTours,
      // Add new balances to the returned object
      bankBalance,
      cashBalance,
      cash2Balance,
    };
  }, [reservations, financialTransactions, tours]);

  // Invoicing Dashboard Calculations
  const invoicingDashboardStats = useMemo(() => {
    const totalSalesInvoices = salesInvoices.length;
    const totalExpenseInvoices = expenseInvoices.length;

    let totalSalesAmount = 0;
    let totalSalesVAT = 0;
    salesInvoices.forEach(inv => {
      totalSalesAmount += (parseFloat(inv.totalAmount) || 0);
      totalSalesVAT += (parseFloat(inv.totalVAT) || 0);
    });

    let totalExpenseAmount = 0;
    let totalExpenseVAT = 0;
    expenseInvoices.forEach(inv => {
      totalExpenseAmount += (parseFloat(inv.totalAmount) || 0);
      totalExpenseVAT += (parseFloat(inv.totalVAT) || 0);
    });

    const netProfitInvoicing = totalSalesAmount - totalExpenseAmount;
    const netVAT = totalSalesVAT - totalExpenseVAT; // Sales VAT - Expense VAT

    // Convert BGN to EUR for display
    const toEUR = (amount) => (amount / EUR_TO_BGN_RATE).toFixed(2);

    return {
      totalSalesInvoices,
      totalExpenseInvoices,
      totalSalesAmount: totalSalesAmount.toFixed(2),
      totalSalesAmountEUR: toEUR(totalSalesAmount),
      totalSalesVAT: totalSalesVAT.toFixed(2),
      totalSalesVATEUR: toEUR(totalSalesVAT),
      totalExpenseAmount: totalExpenseAmount.toFixed(2),
      totalExpenseAmountEUR: toEUR(totalExpenseAmount),
      totalExpenseVAT: totalExpenseVAT.toFixed(2),
      totalExpenseVATEUR: toEUR(totalExpenseVAT),
      netProfitInvoicing: netProfitInvoicing.toFixed(2),
      netProfitInvoicingEUR: toEUR(netProfitInvoicing),
      netVAT: netVAT.toFixed(2),
      netVATEUR: toEUR(netVAT),
    };
  }, [salesInvoices, expenseInvoices]);


  // --- Financial Reports Logic (Uses Firestore user-specific data) ---

 const handleReportFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'reportStartDate') setReportStartDate(value);
    else if (name === 'reportEndDate') setReportEndDate(value);
    else if (name === 'reportFilterType') setReportFilterType(value);
    else if (name === 'reportFilterMethod') setReportFilterMethod(value);
    else if (name === 'reportFilterAssociation') setReportFilterAssociation(value);
  }, []);


  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

const filteredFinancialTransactions = useMemo(() => {
    let sortableTransactions = financialTransactions.filter(ft => {
      // --- Date Filters ---
      const transactionDate = new Date(ft.date);
      const startDate = reportStartDate ? new Date(reportStartDate) : null;
      const endDate = reportEndDate ? new Date(reportEndDate) : null;

      if (startDate && transactionDate < startDate) return false;
      if (endDate && transactionDate > endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        if (transactionDate >= adjustedEndDate) return false;
      }

      // --- Type Filter ---
      if (reportFilterType !== 'all' && ft.type !== reportFilterType) return false;
      
      // --- New Method Filter ---
      if (reportFilterMethod !== 'all' && ft.method !== reportFilterMethod) return false;

      // --- Association Filter ---
      if (reportFilterAssociation) {
        const lowerCaseFilter = reportFilterAssociation.toLowerCase();
        const matchesReservation = ft.associatedReservationId?.toLowerCase().includes(lowerCaseFilter);
        const matchesTour = ft.associatedTourId?.toLowerCase().includes(lowerCaseFilter);
        if (!matchesReservation && !matchesTour) return false;
      }

      return true;
    });

    // --- Dynamic Sorting Logic ---
    if (sortConfig.key !== null) {
      sortableTransactions.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableTransactions;
  }, [financialTransactions, reportStartDate, reportEndDate, reportFilterType, reportFilterMethod, reportFilterAssociation, sortConfig]);

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

 const resetFinancialReportsFilters = useCallback(() => {
    setReportStartDate('');
    setReportEndDate('');
    setReportFilterType('all');
    setReportFilterAssociation('');
  }, []);



  // --- Filtered Reservations Logic ---
  const handleReservationFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'filterReservationStatus') setFilterReservationStatus(value);
    else if (name === 'filterReservationHotel') setFilterReservationHotel(value);
    else if (name === 'filterReservationTourType') setFilterReservationTourType(value);
    else if (name === 'filterReservationCheckInDate') setFilterReservationCheckInDate(value);
    else if (name === 'filterReservationCheckOutDate') setFilterReservationCheckOutDate(value);
  }, []);

  const resetReservationFilters = useCallback(() => {
    setFilterReservationStatus('All');
    setFilterReservationHotel('');
    setFilterReservationTourType('All');
    setFilterReservationCheckInDate('');
    setFilterReservationCheckOutDate('');
  }, []);

const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      // Existing filters
      if (filterReservationStatus !== 'All' && res.status !== filterReservationStatus) return false;
      if (filterReservationHotel && !res.hotel?.toLowerCase().includes(filterReservationHotel.toLowerCase())) return false;
      if (filterReservationTourType !== 'All' && res.tourType !== filterReservationTourType) return false;
      if (filterReservationCheckInDate && new Date(res.checkIn) < new Date(filterReservationCheckInDate)) return false;
      if (filterReservationCheckOutDate && new Date(res.checkOut) > new Date(filterReservationCheckOutDate)) return false;

      // New search filter for lead guest
      if (searchReservationTerm) {
        const leadGuest = res.tourists?.[0];
        if (!leadGuest) return false; // No lead guest to search for
        const fullName = `${leadGuest.firstName || ''} ${leadGuest.familyName || ''}`.toLowerCase();
        if (!fullName.includes(searchReservationTerm.toLowerCase())) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by reservation number descending
      const numA = parseInt(a.reservationNumber?.substring(3) || '0', 10);
      const numB = parseInt(b.reservationNumber?.substring(3) || '0', 10);
      return numB - numA;
    });
  }, [reservations, filterReservationStatus, filterReservationHotel, filterReservationTourType, filterReservationCheckInDate, filterReservationCheckOutDate, searchReservationTerm]);


  // --- Filtered Tours Logic ---
  const handleTourFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'filterTourHotel') setFilterTourHotel(value);
    else if (name === 'filterTourTransportCompany') setFilterTourTransportCompany(value);
    else if (name === 'filterTourDepartureDate') setFilterTourDepartureDate(value);
    else if (name === 'filterTourArrivalDate') setFilterTourArrivalDate(value);
  }, []);

  const resetTourFilters = useCallback(() => {
    setFilterTourHotel('');
    setFilterTourTransportCompany('');
    setFilterTourDepartureDate('');
    setFilterTourArrivalDate('');
  }, []);

const filteredTours = useMemo(() => {
    return tours.filter(tour => {
      if (filterTourHotel && !tour.hotel?.toLowerCase().includes(filterTourHotel.toLowerCase())) return false;
      if (filterTourTransportCompany && !tour.transportCompany?.toLowerCase().includes(filterTourTransportCompany.toLowerCase())) return false;
      if (filterTourDepartureDate && new Date(tour.departureDate) < new Date(filterTourDepartureDate)) return false;
      if (filterTourArrivalDate && new Date(tour.arrivalDate) > new Date(tour.arrivalDate)) return false;
      return true;
    }).sort((a, b) => new Date(b.departureDate) - new Date(a.departureDate));
  }, [tours, filterTourHotel, filterTourTransportCompany, filterTourDepartureDate, filterTourArrivalDate]);


  // New: Filtered Customers Logic with Search
  const filteredCustomers = useMemo(() => {
    let sortedCustomers = [...customers].sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

    if (!searchCustomerTerm) {
      return sortedCustomers;
    }
    return sortedCustomers.filter(cust => {
      const fullName = `${cust.firstName || ''} ${cust.fatherName || ''} ${cust.familyName || ''}`.toLowerCase();
      return fullName.includes(searchCustomerTerm.toLowerCase());
    });
  }, [customers, searchCustomerTerm]);


  // --- New: Notification Generation Logic ---
  useEffect(() => {
    if (!isAuthReady || !userId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter out previous auto-generated notifications before adding new ones
    setNotifications(prev => prev.filter(n => !(n.source === 'auto-res' || n.source === 'auto-tour')));

    reservations.forEach(res => {
      const checkInDate = new Date(res.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 7) {
        addNotification(
          `Reservation ${res.reservationNumber} for ${res.hotel} checks in on ${res.checkIn} (in ${diffDays} days).`,
          'warning',
          true, // dismissible
          null, // autoDismiss, null means indefinite (until manually dismissed)
          'auto-res' // custom source to filter later
        );
      }
    });

    tours.forEach(tour => {
      const departureDate = new Date(tour.departureDate);
      departureDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 30) {
        const linkedReservations = reservations.filter(res => res.linkedTourId === tour.tourId);
        const bookedPassengers = linkedReservations.reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0);
        const fulfillment = tour.maxPassengers > 0 ? (bookedPassengers / tour.maxPassengers) * 100 : 0;

        if (fulfillment < 50 && bookedPassengers > 0) {
          addNotification(
            `Tour ${tour.tourId} to ${tour.hotel} has only ${fulfillment.toFixed(1)}% passengers booked (departing in ${diffDays} days).`,
            'warning',
            true,
            null,
            'auto-tour'
          );
        } else if (fulfillment === 0 && diffDays <= 14) {
           addNotification(
            `Tour ${tour.tourId} to ${tour.hotel} has NO passengers booked (departing in ${diffDays} days).`,
            'error',
            true,
            null,
            'auto-tour'
          );
        }
      }
    });

  }, [reservations, tours, isAuthReady, userId, addNotification]);


  // --- Expense Invoice Functions ---
  const handleExpenseInvoiceFormChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setExpenseInvoiceForm(prev => {
      const newState = {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      };
      return newState;
    });
  }, []);

  const resetExpenseInvoiceForm = useCallback(() => {
    setExpenseInvoiceForm({
      companyName: '', companyID: '', vatID: '', invoiceNumber: '', invoiceDate: '',
      productsServices: '', paymentMethod: 'Bank', dueDate: '', totalAmount: 0, totalVAT: 0, notes: ''
    });
    setSelectedExpenseInvoice(null);
  }, []);

  const handleSubmitExpenseInvoice = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    addNotification('');

    if (!userId) {
      addNotification("User not authenticated. Please log in to save data.", 'error');
      setLoading(false);
      return;
    }

    try {
      // Generate invoice number only if adding a new invoice
      let currentInvoiceNumber = expenseInvoiceForm.invoiceNumber;
      if (!selectedExpenseInvoice && !currentInvoiceNumber) {
        currentInvoiceNumber = await generateExpenseInvoiceNumber();
      }

      const invoiceData = {
        ...expenseInvoiceForm,
        invoiceNumber: currentInvoiceNumber,
        totalAmount: parseFloat(expenseInvoiceForm.totalAmount) || 0,
        totalVAT: parseFloat(expenseInvoiceForm.totalVAT) || 0,
      };

      const expenseInvoicesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/invoices_expenses`);

      if (selectedExpenseInvoice) {
        const invoiceDocRef = doc(expenseInvoicesCollectionRef, selectedExpenseInvoice.id);
        await setDoc(invoiceDocRef, invoiceData, { merge: true });
        addNotification('Expense Invoice updated successfully!', 'success');
      } else {
        await addDoc(expenseInvoicesCollectionRef, invoiceData);
        addNotification('Expense Invoice added successfully!', 'success');
      }

      resetExpenseInvoiceForm();
      setActiveTab('invoicingExpenses');
    } catch (err) {
      console.error("Error saving expense invoice:", err);
      setError(`Failed to save expense invoice: ${err.message || err.toString()}`);
      addNotification(`Failed to save expense invoice: ${err.message || err.toString()}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpenseInvoice = useCallback((invoice) => {
    setExpenseInvoiceForm({
      ...invoice,
      totalAmount: parseFloat(invoice.totalAmount) || 0,
      totalVAT: parseFloat(invoice.totalVAT) || 0,
    });
    setSelectedExpenseInvoice(invoice);
    setActiveTab('addExpenseInvoice'); // Switch to the form view
  }, []);

  const handleDeleteExpenseInvoice = useCallback((invoiceId) => {
    setConfirmMessage("Are you sure you want to delete this expense invoice?");
    setConfirmAction(() => async () => {
      setLoading(true);
      setError(null);
      addNotification('');
      if (!userId) {
        addNotification("User not authenticated. Please log in to delete data.", 'error');
        setLoading(false);
        return;
      }
      try {
        const invoiceDocRef = doc(db, `artifacts/${appId}/users/${userId}/invoices_expenses`, invoiceId);
        await deleteDoc(invoiceDocRef);
        addNotification('Expense Invoice deleted successfully!', 'success');
      } catch (err) {
        console.error("Error deleting expense invoice:", err);
        setError("Failed to delete expense invoice. Please try again.");
        addNotification(`Failed to delete expense invoice: ${err.message || err.toString()}`, 'error');
      } finally {
        setLoading(false);
      }
    });
    setShowConfirmModal(true);
  }, [userId, addNotification]);


  // --- Product Management Functions ---
  const handleProductFormChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  }, []);

  const resetProductForm = useCallback(() => {
    setProductForm({
      productCode: '',
      productName: '',
      price: 0,
      vatRate: 20
    });
    setSelectedProduct(null);
  }, []);

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    addNotification('');

    if (!userId) {
      addNotification("User not authenticated. Please log in to save data.", 'error');
      setLoading(false);
      return;
    }

    try {
      let currentProductCode = productForm.productCode;
      if (!selectedProduct && !currentProductCode) {
        currentProductCode = await generateProductCode();
      }

      const productData = {
        ...productForm,
        productCode: currentProductCode,
        price: parseFloat(productForm.price) || 0,
        vatRate: parseFloat(productForm.vatRate) || 0,
      };

      const productsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/products`);

      if (selectedProduct) {
        const productDocRef = doc(productsCollectionRef, selectedProduct.id);
        await setDoc(productDocRef, productData, { merge: true });
        addNotification('Product updated successfully!', 'success');
      } else {
        await addDoc(productsCollectionRef, productData);
        addNotification('Product added successfully!', 'success');
      }

      resetProductForm();
      setActiveTab('invoicingProducts');
    } catch (err) {
      console.error("Error saving product:", err);
      setError(`Failed to save product: ${err.message || err.toString()}`);
      addNotification(`Failed to save product: ${err.message || err.toString()}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = useCallback((product) => {
    setProductForm({
      ...product,
      price: parseFloat(product.price) || 0,
      vatRate: parseFloat(product.vatRate) || 0,
    });
    setSelectedProduct(product);
    setActiveTab('addProduct'); // New tab for adding/editing products
  }, []);

  const handleDeleteProduct = useCallback((productId) => {
    setConfirmMessage("Are you sure you want to delete this product?");
    setConfirmAction(() => async () => {
      setLoading(true);
      setError(null);
      addNotification('');
      if (!userId) {
        addNotification("User not authenticated. Please log in to delete data.", 'error');
        setLoading(false);
        return;
      }
      try {
        const productDocRef = doc(db, `artifacts/${appId}/users/${userId}/products`, productId);
        await deleteDoc(productDocRef);
        addNotification('Product deleted successfully!', 'success');
      } catch (err) {
        console.error("Error deleting product:", err);
        setError("Failed to delete product. Please try again.");
        addNotification(`Failed to delete product: ${err.message || err.toString()}`, 'error');
      } finally {
        setLoading(false);
      }
    });
    setShowConfirmModal(true);
  }, [userId, addNotification]);


  // --- Sales Invoice Functions ---
  const handleSalesInvoiceFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setSalesInvoiceForm(prev => {
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // No recalculation here, it's done in handleSalesInvoiceProductChange
      return newState;
    });
  }, []);

  const handleSalesInvoiceProductChange = useCallback((index, e) => {
    const { name, value, type } = e.target; // Corrected: 'type' is now destructured
    setSalesInvoiceForm(prev => {
      const newProducts = [...prev.products];
      const product = { ...newProducts[index] }; // Create a copy to avoid direct mutation

      if (name === 'productCode') {
        const selectedProductData = products.find(p => p.productCode === value);
        if (selectedProductData) {
          product.productCode = selectedProductData.productCode;
          product.productName = selectedProductData.productName;
          product.price = selectedProductData.price;
          product.vatRate = selectedProductData.vatRate;
        } else {
          // If product code is cleared or not found, clear other fields
          product.productCode = value;
          product.productName = '';
          product.price = 0;
          product.vatRate = 0;
        }
      } else {
        // Now 'type' is correctly defined
        product[name] = type === 'number' ? parseFloat(value) || 0 : value;
      }

      // Recalculate line total and VAT for the current product
      const quantity = parseFloat(product.quantity) || 0;
      const price = parseFloat(product.price) || 0;
      const vatRate = parseFloat(product.vatRate) || 0;

      product.lineTotal = (quantity * price);
      product.lineVAT = (product.lineTotal * (vatRate / 100));
      product.lineGrandTotal = product.lineTotal + product.lineVAT;

      newProducts[index] = product; // Update the product in the array

      // Recalculate overall totals for the invoice
      let newTotalAmount = 0;
      let newTotalVAT = 0;
      newProducts.forEach(item => {
        newTotalAmount += item.lineTotal || 0;
        newTotalVAT += item.lineVAT || 0;
      });

      return {
        ...prev,
        products: newProducts,
        totalAmount: newTotalAmount,
        totalVAT: newTotalVAT,
        grandTotal: newTotalAmount + newTotalVAT,
      };
    }); // Corrected closing for setSalesInvoiceForm
  }, [products]); // Corrected closing for useCallback, and dependencies


  const addSalesInvoiceProduct = useCallback(() => {
    setSalesInvoiceForm(prev => ({
      ...prev,
      products: [...prev.products, {
        productCode: '', productName: '', quantity: 1, price: 0, vatRate: 20, lineTotal: 0, lineVAT: 0, lineGrandTotal: 0
      }],
    }));
  }, []);

  const removeSalesInvoiceProduct = useCallback((index) => {
    setSalesInvoiceForm(prev => {
      const newProducts = prev.products.filter((_, i) => i !== index);
      let newTotalAmount = 0;
      let newTotalVAT = 0;
      newProducts.forEach(item => {
        newTotalAmount += item.lineTotal || 0;
        newTotalVAT += item.lineVAT || 0;
      });
      return {
        ...prev,
        products: newProducts,
        totalAmount: newTotalAmount,
        totalVAT: newTotalVAT,
        grandTotal: newTotalAmount + newTotalVAT,
      };
    });
  }, []);

 const resetSalesInvoiceForm = useCallback(() => {
    setSalesInvoiceForm({
      invoiceNumber: '',
      invoiceDate: '',
      clientName: '',
      clientMOL: '',
      clientID: '',
      clientVATID: '',
      clientAddress: '',
      clientCity: '',
      clientPostCode: '',
      products: [],
      paymentMethod: 'Cash',
      bankDetails: {
        iban: 'BG87BPBI79301036586601',
        bankName: 'Пощенска банка'
      },
      dueDate: '',
      isCopy: false,
      totalAmount: 0,
      totalVAT: 0,
      grandTotal: 0,
      notes: '',
      // New editable fields
      transactionBasis: 'Услуга',
      transactionDescription: 'ТУРИСТИЧЕСКИ УСЛУГИ',
      transactionPlace: 'България',
      receivedBy: '',
    });
    setSelectedSalesInvoice(null);
  }, []);

  const handleSubmitSalesInvoice = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    addNotification('');

    if (!userId) {
      addNotification("User not authenticated. Please log in to save data.", 'error');
      setLoading(false);
      return;
    }

    try {
      let currentInvoiceNumber = salesInvoiceForm.invoiceNumber;
      if (!selectedSalesInvoice && !currentInvoiceNumber) {
        currentInvoiceNumber = await generateSalesInvoiceNumber();
      }

      const invoiceData = {
        ...salesInvoiceForm,
        invoiceNumber: currentInvoiceNumber,
        totalAmount: parseFloat(salesInvoiceForm.totalAmount) || 0,
        totalVAT: parseFloat(salesInvoiceForm.totalVAT) || 0,
        grandTotal: parseFloat(salesInvoiceForm.grandTotal) || 0,
        products: salesInvoiceForm.products.map(p => ({
          productCode: p.productCode,
          productName: p.productName,
          quantity: parseFloat(p.quantity) || 0,
          price: parseFloat(p.price) || 0,
          vatRate: parseFloat(p.vatRate) || 0,
          lineTotal: parseFloat(p.lineTotal) || 0,
          lineVAT: parseFloat(p.lineVAT) || 0,
          lineGrandTotal: parseFloat(p.lineGrandTotal) || 0,
        })),
        isCopy: salesInvoiceForm.isCopy,
      };

      const salesInvoicesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/invoices_sales`);

      if (selectedSalesInvoice) {
        const invoiceDocRef = doc(salesInvoicesCollectionRef, selectedSalesInvoice.id);
        await setDoc(invoiceDocRef, invoiceData, { merge: true });
        addNotification('Sales Invoice updated successfully!', 'success');
      } else {
        await addDoc(salesInvoicesCollectionRef, invoiceData);
        addNotification('Sales Invoice added successfully!', 'success');
      }

      resetSalesInvoiceForm();
      setActiveTab('invoicingSales');
    } catch (err) {
      console.error("Error saving sales invoice:", err);
      setError(`Failed to save sales invoice: ${err.message || err.toString()}`);
      addNotification(`Failed to save sales invoice: ${err.message || err.toString()}`, 'error');
    } finally {
      setLoading(false);
    }
  };

const handleEditSalesInvoice = useCallback((invoice) => {
    setSalesInvoiceForm({
      // Defaults for old invoices that might not have these fields
      clientMOL: '',
      transactionBasis: 'Услуга',
      transactionDescription: 'ТУРИСТИЧЕСКИ УСЛУГИ',
      transactionPlace: 'България',
      receivedBy: '',
      ...invoice, // Overwrite defaults with saved data if it exists
      totalAmount: parseFloat(invoice.totalAmount) || 0,
      totalVAT: parseFloat(invoice.totalVAT) || 0,
      grandTotal: parseFloat(invoice.grandTotal) || 0,
      products: invoice.products ? invoice.products.map(p => ({
        ...p,
        quantity: parseFloat(p.quantity) || 0,
        price: parseFloat(p.price) || 0,
        vatRate: parseFloat(p.vatRate) || 0,
        lineTotal: parseFloat(p.lineTotal) || 0,
        lineVAT: parseFloat(p.lineVAT) || 0,
        lineGrandTotal: parseFloat(p.lineGrandTotal) || 0,
      })) : [],
    });
    setSelectedSalesInvoice(invoice);
    setActiveTab('addSalesInvoice');
  }, []);

  const handleDeleteSalesInvoice = useCallback((invoiceId) => {
    setConfirmMessage("Are you sure you want to delete this sales invoice?");
    setConfirmAction(() => async () => {
      setLoading(true);
      setError(null);
      addNotification('');
      if (!userId) {
        addNotification("User not authenticated. Please log in to delete data.", 'error');
        setLoading(false);
        return;
      }
      try {
        const invoiceDocRef = doc(db, `artifacts/${appId}/users/${userId}/invoices_sales`, invoiceId);
        await deleteDoc(invoiceDocRef);
        addNotification('Sales Invoice deleted successfully!', 'success');
      } catch (err) {
        console.error("Error deleting sales invoice:", err);
        setError("Failed to delete sales invoice. Please try again.");
        addNotification(`Failed to delete sales invoice: ${err.message || err.toString()}`, 'error');
      } finally {
        setLoading(false);
      }
    });
    setShowConfirmModal(true);
  }, [userId, addNotification]);


  // --- Render UI based on activeTab ---
  const renderContent = () => {
    if (!isAuthReady || loading) {
      return (
        <div className="flex justify-center items-center h-full min-h-[calc(100vh-100px)]">
          <div className="text-gray-600 text-lg animate-pulse">Loading application...</div> {/* Changed text color */}
        </div>
      );
    }

    if (!userId) {
      return (
        <div className="flex justify-center items-center h-full min-h-[calc(100vh-100px)]">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"> {/* Consistent rounded-xl and shadow-lg */}
            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
              {authMode === 'login' ? 'Login to Dynamex' : 'Register for Dynamex'}
            </h2>
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md relative mb-4" role="alert"> {/* Adjusted error colors */}
                <span className="block sm:inline">{authError}</span>
              </div>
            )}
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2" // Focus ring green
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  id="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2" // Focus ring green
                  required
                />
              </div>
              <button
                type="submit"
                // Primary button style matching screenshot's green
                className="w-full px-6 py-3 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md font-semibold text-lg"
                disabled={loading}
              >
                {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Register')}
              </button>
            </form>
            <p className="mt-6 text-center text-gray-600">
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(null); }}
                    className="text-[#28A745] hover:text-[#218838] font-medium" // Link color green
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(null); }}
                    className="text-[#28A745] hover:text-[#218838] font-medium" // Link color green
                  >
                    Login
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md relative mb-4" role="alert"> {/* Adjusted error colors */}
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      );
    }

    switch (activeTab) {
case 'dashboard':
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg"> {/* Consistent card styling */}
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Dashboard & Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Changed to 4 columns on large screens */}
              {/* Reservation Stats */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="font-semibold text-xl text-gray-700 mb-3">Reservation Metrics</h3>
                <p className="text-gray-600 text-lg">Total Reservations: <span className="font-bold text-gray-800">{dashboardStats.totalReservations}</span></p>
                <p className="text-gray-600 text-lg">Total Profit: <span className="font-bold text-[#28A745]">BGN {dashboardStats.totalProfit.toFixed(2)}</span></p>
                <p className="text-gray-600 text-lg">Avg. Profit/Res: <span className="font-bold text-[#28A745]">BGN {dashboardStats.averageProfitPerReservation.toFixed(2)}</span></p>
                <p className="text-gray-600 text-lg">Avg. Stay/Res: <span className="font-bold text-gray-800">{dashboardStats.averageStayPerReservation.toFixed(1)} nights</span></p>
              </div>

              {/* Financial Stats */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="font-semibold text-xl text-gray-700 mb-3">Financial Overview</h3>
                <p className="text-gray-600 text-lg">Total Income: <span className="font-bold text-[#28A745]">BGN {dashboardStats.totalIncome.toFixed(2)}</span></p>
                <p className="text-gray-600 text-lg">Total Expenses: <span className="font-bold text-[#DC3545]">BGN {dashboardStats.totalExpenses.toFixed(2)}</span></p>
                <p className="text-gray-600 text-lg">Net Profit/Loss: <span className={`font-bold ${dashboardStats.totalIncome - dashboardStats.totalExpenses >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>BGN {(dashboardStats.totalIncome - dashboardStats.totalExpenses).toFixed(2)}</span></p>
              </div>

              {/* Bus Tour Stats */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="font-semibold text-xl text-gray-700 mb-3">Bus Tour Performance</h3>
                <p className="text-gray-600 text-lg">Total Bus Passengers Booked: <span className="font-bold text-gray-800">{dashboardStats.totalBusPassengersBooked}</span></p>
                <p className="text-gray-600 text-lg">Overall Fulfillment: <span className="font-bold text-gray-800">{dashboardStats.overallBusTourFulfillment.toFixed(1)}%</span></p>
              </div>
              
              {/* --- New Balance Overview Card --- */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="font-semibold text-xl text-gray-700 mb-3">Balance Overview</h3>
                <p className="text-gray-600 text-lg">Bank Balance: <span className={`font-bold ${dashboardStats.bankBalance >= 0 ? 'text-gray-800' : 'text-[#DC3545]'}`}>BGN {dashboardStats.bankBalance.toFixed(2)}</span></p>
                <p className="text-gray-600 text-lg">Cash Balance: <span className={`font-bold ${dashboardStats.cashBalance >= 0 ? 'text-gray-800' : 'text-[#DC3545]'}`}>BGN {dashboardStats.cashBalance.toFixed(2)}</span></p>
                <p className="text-gray-600 text-lg">Cash 2 Balance: <span className={`font-bold ${dashboardStats.cash2Balance >= 0 ? 'text-gray-800' : 'text-[#DC3545]'}`}>BGN {dashboardStats.cash2Balance.toFixed(2)}</span></p>
              </div>
            </div>
          </div>
        );
case 'reservations':
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Hotel Reservations</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div>
                <label htmlFor="filterReservationStatus" className="block text-sm font-medium text-gray-700">Status</label>
                <select name="filterReservationStatus" id="filterReservationStatus" value={filterReservationStatus} onChange={handleReservationFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2">
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Past">Past</option>
                </select>
              </div>
              <div>
                <label htmlFor="filterReservationHotel" className="block text-sm font-medium text-gray-700">Hotel</label>
                <input type="text" name="filterReservationHotel" id="filterReservationHotel" value={filterReservationHotel} onChange={handleReservationFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" placeholder="Filter by hotel name" />
              </div>
              <div>
                <label htmlFor="filterReservationTourType" className="block text-sm font-medium text-gray-700">Tour Type</label>
                <select name="filterReservationTourType" id="filterReservationTourType" value={filterReservationTourType} onChange={handleReservationFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2">
                  <option value="All">All</option>
                  <option value="PARTNER">PARTNER</option>
                  <option value="HOTEL ONLY">HOTEL ONLY</option>
                </select>
              </div>
               <div>
                <label htmlFor="filterReservationCheckInDate" className="block text-sm font-medium text-gray-700">Check-in After</label>
                <input type="date" name="filterReservationCheckInDate" id="filterReservationCheckInDate" value={filterReservationCheckInDate} onChange={handleReservationFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
              </div>
              <div>
                <label htmlFor="filterReservationCheckOutDate" className="block text-sm font-medium text-gray-700">Check-out Before</label>
                <input type="date" name="filterReservationCheckOutDate" id="filterReservationCheckOutDate" value={filterReservationCheckOutDate} onChange={handleReservationFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
              </div>
              <div className="xl:col-span-2">
                <label htmlFor="searchReservationTerm" className="block text-sm font-medium text-gray-700">Search by Lead Guest</label>
                <input type="text" name="searchReservationTerm" id="searchReservationTerm" value={searchReservationTerm} onChange={e => setSearchReservationTerm(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" placeholder="Enter first or last name..." />
              </div>
              <div className="md:col-span-full xl:col-span-1 flex items-end">
                <button type="button" onClick={resetReservationFilters} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 shadow-sm border border-gray-200">
                  Reset Filters
                </button>
              </div>
            </div>

            {filteredReservations.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No reservations found.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium">Reservation Number</th>
                      <th className="py-3 px-4 text-left font-medium">Hotel</th>
                      <th className="py-3 px-4 text-left font-medium">Lead Guest</th>
                      <th className="py-3 px-4 text-left font-medium">Dates</th>
                      <th className="py-3 px-4 text-left font-medium">Status</th>
                      <th className="py-3 px-4 text-right font-medium">Profit</th>
                      <th className="py-3 px-4 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map(res => {
                      const linkedPayments = financialTransactions.filter(ft => ft.associatedReservationId === res.reservationNumber);
                      return (
                        <React.Fragment key={res.id}>
                          <tr onClick={() => setExpandedReservationId(expandedReservationId === res.id ? null : res.id)} className="cursor-pointer hover:bg-gray-100">
                            <td className="py-3 px-4">{res.reservationNumber}</td>
                            <td className="py-3 px-4">{res.hotel}</td>
                            <td className="py-3 px-4">{res.tourists && res.tourists.length > 0 ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-600">{res.checkIn} - {res.checkOut}</td>
                            <td className="py-3 px-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${res.status === 'Confirmed' ? 'bg-green-100 text-green-800' : res.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : res.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{res.status}</span></td>
                            <td className="py-3 px-4 font-semibold text-right text-gray-800">BGN {res.profit.toFixed(2)}</td>
                           <td className="py-3 px-4 flex justify-center space-x-2">
                              <button onClick={(e) => { e.stopPropagation(); setViewingReservation(res); }} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md transition duration-200" title="View Details">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleEditReservation(res); }} className="bg-[#28A745] hover:bg-[#218838] text-white p-2 rounded-full shadow-md transition duration-200" title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-5.69 5.69L11.586 7.586 14.414 10.414 11.586 13.242 8.758 10.414l2.828-2.828z" /><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm-4 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 14a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM3 18a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                              </button>
                              {/* --- NEW PRINT CONTRACT BUTTON --- */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReservationToGenerateContract(res);
                                  setActiveTab('customerContract'); // This will trigger rendering of CustomerContractPrint
                                }}
                                className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full shadow-md transition duration-200"
                                title="Print Contract"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteReservation(res.id); }} className="bg-[#DC3545] hover:bg-[#C82333] text-white p-2 rounded-full shadow-md transition duration-200" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm-1 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1zm-1 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                              </button>
                            </td>
                          </tr>
                          {expandedReservationId === res.id && (
                            <tr className="bg-gray-50">
                              <td colSpan="7" className="p-4">
                                <h4 className="font-semibold text-gray-700 mb-2">Linked Financial Transactions:</h4>
                                {linkedPayments.length > 0 ? (
                                  <table className="min-w-full bg-white text-sm rounded-lg shadow">
                                    <thead className="bg-gray-200">
                                      <tr>
                                        <th className="py-1 px-2 text-left">Date</th>
                                        <th className="py-1 px-2 text-left">Type</th>
                                        <th className="py-1 px-2 text-left">Method</th>
                                        <th className="py-1 px-2 text-right">Amount</th>
                                        <th className="py-1 px-2 text-left">Linked Tour</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {linkedPayments.map(p => (
                                        <tr key={p.id} className="border-b">
                                          <td className="py-1 px-2">{p.date}</td>
                                          <td className="py-1 px-2"><span className={`px-2 py-0.5 rounded-full text-xs ${p.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.type}</span></td>
                                          <td className="py-1 px-2">{p.method}</td>
                                          <td className="py-1 px-2 text-right font-medium">BGN {p.amount.toFixed(2)}</td>
                                          <td className="py-1 px-2">{p.associatedTourId || 'N/A'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p className="text-sm text-gray-500">No payments found for this reservation.</p>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {viewingReservation && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl relative max-h-[90vh] flex flex-col">
                  <h3 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-3">Reservation Details: <span className="text-blue-600">{viewingReservation.reservationNumber}</span></h3>
                  <div className="overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700 mb-6">
                      <div><strong>Hotel:</strong> <span className="text-gray-600">{viewingReservation.hotel}</span></div>
                      <div><strong>Place:</strong> <span className="text-gray-600">{viewingReservation.place}</span></div>
                      <div><strong>Food:</strong> <span className="text-gray-600">{viewingReservation.food}</span></div>
                      <div><strong>Check-in:</strong> <span className="text-gray-600">{viewingReservation.checkIn}</span></div>
                      <div><strong>Check-out:</strong> <span className="text-gray-600">{viewingReservation.checkOut}</span></div>
                      <div><strong>Nights:</strong> <span className="font-semibold">{viewingReservation.totalNights}</span></div>
                      <div><strong>Status:</strong> <span className={`font-semibold ${viewingReservation.status === 'Confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>{viewingReservation.status}</span></div>
                      <div><strong>Tour Operator:</strong> <span className="text-gray-600">{viewingReservation.tourOperator}</span></div>
                      <div><strong>Linked Tour ID:</strong> <span className="text-gray-600">{viewingReservation.linkedTourId || 'N/A'}</span></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700 mb-6 border-t pt-4">
                      <div className="text-lg"><strong>Final Amount:</strong> <span className="font-bold text-green-600">BGN {viewingReservation.finalAmount.toFixed(2)}</span></div>
                      <div className="text-lg"><strong>Owed to Hotel:</strong> <span className="font-bold text-red-600">BGN {viewingReservation.owedToHotel.toFixed(2)}</span></div>
                      <div className="text-lg"><strong>Profit:</strong> <span className="font-bold text-blue-600">BGN {viewingReservation.profit.toFixed(2)}</span></div>
                    </div>
                    <h4 className="text-xl font-semibold mb-3 text-gray-800 border-t pt-4">Tourists ({viewingReservation.adults} Adults, {viewingReservation.children} Children)</h4>
                    <div className="overflow-x-auto max-h-60 rounded-lg border">
                      <table className="min-w-full bg-white">
                        <thead className="bg-gray-100 text-gray-700 border-b">
                          <tr>
                            <th className="py-2 px-3 text-left text-sm font-medium">Name</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">ID</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Real ID</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Email</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingReservation.tourists.map((t, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-2 px-3 text-sm">{t.firstName} {t.familyName}</td>
                              <td className="py-2 px-3 text-sm">{t.id}</td>
                              <td className="py-2 px-3 text-sm">{t.realId}</td>
                              <td className="py-2 px-3 text-sm">{t.email}</td>
                              <td className="py-2 px-3 text-sm">{t.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6 pt-4 border-t">
                    <button onClick={() => setViewingReservation(null)} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition duration-200 shadow-md">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'addReservation':
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
              {selectedReservation ? 'Edit Hotel Reservation' : 'Add New Hotel Reservation'}
            </h2>
            <form onSubmit={handleSubmitReservation} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Basic Info */}
              <div className="col-span-full text-lg font-semibold text-gray-800">Basic Information</div>
              <div>
                <label htmlFor="creationDate" className="block text-sm font-medium text-gray-700">Creation Date</label>
                <input
                  type="date"
                  name="creationDate"
                  id="creationDate"
                  value={reservationForm.creationDate}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2 bg-gray-100"
                  placeholder="Auto-generated or editable"
                  disabled={!!selectedReservation}
                />
              </div>
              <div>
                <label htmlFor="tourType" className="block text-sm font-medium text-gray-700">Tour Type</label>
                <select
                  name="tourType"
                  id="tourType"
                  value={reservationForm.tourType}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="roomType" className="block text-sm font-medium text-gray-700">Room Type</label>
                <input
                  type="text"
                  name="roomType"
                  id="roomType"
                  value={reservationForm.roomType}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  placeholder="e.g., Double Room, Apartment"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                />
              </div>

              {/* Link to Tour */}
              <div className="col-span-full text-lg font-semibold text-gray-800 pt-4 border-t border-gray-200">Tour Association</div>
              <div>
                <label htmlFor="linkedTourId" className="block text-sm font-medium text-gray-700">Select Tour (Optional)</label>
                <select
                  name="linkedTourId"
                  id="linkedTourId"
                  value={reservationForm.linkedTourId}
                  onChange={handleReservationFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                >
                  <option value="">-- None --</option>
                  {tours.map(tour => (
                    <option key={tour.id} value={tour.tourId}>
                      {tour.tourId} - {tour.hotel} ({tour.departureDate})
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                />
              </div>

{/* Tourist Details */}
                  <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Tourist Details</h3>
                    {reservationForm.tourists.map((tourist, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 relative shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-md font-medium text-gray-700">Tourist {index + 1}</h4>
                            {/* Mode Toggle Buttons */}
                            <div className="flex p-1 bg-gray-200 rounded-lg">
                              <button
                                type="button"
                                onClick={() => handleTouristModeChange(index, 'new')}
                                className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${tourist.mode === 'new' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-600'}`}
                              >
                                New
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTouristModeChange(index, 'existing')}
                                className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${tourist.mode === 'existing' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-600'}`}
                              >
                                Existing
                              </button>
                            </div>
                          </div>
                          {reservationForm.tourists.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTourist(index)}
                              className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full text-xs transition duration-200"
                              title="Remove Tourist"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Conditional Rendering based on mode */}
                        {tourist.mode === 'existing' ? (
                          <div className="col-span-full">
                            <label htmlFor={`existingCustomer-${index}`} className="block text-sm font-medium text-gray-700">Select Existing Customer</label>
                            <select
                              name="existingCustomer"
                              id={`existingCustomer-${index}`}
                              value={tourist.id || ''}
                              onChange={(e) => handleExistingTouristSelect(index, e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                              required
                            >
                              <option value="" disabled>-- Select a customer --</option>
                              {customers.map(c => (
                                <option key={c.id} value={c.id}>
                                  {`${c.firstName} ${c.familyName} (ID: ${c.id})`}
                                </option>
                              ))}
                            </select>
                            {tourist.id && (
                               <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                                  Selected: {tourist.firstName} {tourist.familyName}, ID: {tourist.id}, Real ID: {tourist.realId}
                               </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Input fields for a new tourist */}
                            <div>
                              <label htmlFor={`firstName-${index}`} className="block text-sm font-medium text-gray-700">First Name</label>
                              <input type="text" name="firstName" id={`firstName-${index}`} value={tourist.firstName} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" required />
                            </div>
                            <div>
                              <label htmlFor={`fatherName-${index}`} className="block text-sm font-medium text-gray-700">Father's Name</label>
                              <input type="text" name="fatherName" id={`fatherName-${index}`} value={tourist.fatherName} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                            </div>
                            <div>
                              <label htmlFor={`familyName-${index}`} className="block text-sm font-medium text-gray-700">Family Name</label>
                              <input type="text" name="familyName" id={`familyName-${index}`} value={tourist.familyName} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" required />
                            </div>
                            <div>
                              <label htmlFor={`id-${index}`} className="block text-sm font-medium text-gray-700">ID</label>
                              <input type="text" name="id" id={`id-${index}`} value={tourist.id} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" placeholder="e.g., Passport/National ID" required />
                            </div>
                            <div>
                              <label htmlFor={`realId-${index}`} className="block text-sm font-medium text-gray-700">Real ID</label>
                              <input type="text" name="realId" id={`realId-${index}`} value={tourist.realId} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" placeholder="e.g., ЕГН/ЛНЧ" />
                            </div>
                            <div>
                              <label htmlFor={`address-${index}`} className="block text-sm font-medium text-gray-700">Address</label>
                              <input type="text" name="address" id={`address-${index}`} value={tourist.address} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                            </div>
                            <div>
                              <label htmlFor={`city-${index}`} className="block text-sm font-medium text-gray-700">City</label>
                              <input type="text" name="city" id={`city-${index}`} value={tourist.city} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                            </div>
                            <div>
                              <label htmlFor={`postCode-${index}`} className="block text-sm font-medium text-gray-700">Post Code</label>
                              <input type="text" name="postCode" id={`postCode-${index}`} value={tourist.postCode} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                            </div>
                            <div>
                              <label htmlFor={`email-${index}`} className="block text-sm font-medium text-gray-700">Email</label>
                              <input type="email" name="email" id={`email-${index}`} value={tourist.email} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                            </div>
                            <div>
                              <label htmlFor={`phone-${index}`} className="block text-sm font-medium text-gray-700">Phone</label>
                              <input type="tel" name="phone" id={`phone-${index}`} value={tourist.phone} onChange={(e) => handleTouristChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addTourist}
                      className="mt-4 px-6 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md"
                    >
                      Add Another Tourist
                    </button>
                  </div>

              {/* Financial Info */}
              <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Financial Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="depositPaid"
                      id="depositPaid"
                      checked={reservationForm.depositPaid}
                      onChange={handleReservationFormChange}
                      className="h-5 w-5 text-[#28A745] focus:ring-[#28A745] border-gray-300 rounded" // Checkbox accent green
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2 font-semibold text-gray-800"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      id="status"
                      value={reservationForm.status}
                      onChange={handleReservationFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Past">Past</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    resetReservationForm();
                    setActiveTab('reservations');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md"
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
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b">
              <h2 className="text-3xl font-bold text-gray-800">Customers List</h2>
              {/* New Search Input */}
              <div className="relative mt-4 md:mt-0">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchCustomerTerm}
                  onChange={(e) => setSearchCustomerTerm(e.target.value)}
                  className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No customers found. Customers are automatically added when you create a reservation.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium">Name</th>
                      <th className="py-3 px-4 text-left font-medium">ID</th>
                      <th className="py-3 px-4 text-left font-medium">Email</th>
                      <th className="py-3 px-4 text-left font-medium">Phone</th>
                      <th className="py-3 px-4 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {filteredCustomers.map(cust => (
                      <tr key={cust.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-3 px-4">{cust.firstName} {cust.fatherName ? cust.fatherName + ' ' : ''}{cust.familyName}</td>
                        <td className="py-3 px-4 text-gray-500">{cust.id}</td>
                        <td className="py-3 px-4">{cust.email}</td>
                        <td className="py-3 px-4">{cust.phone}</td>
                        <td className="py-3 px-4 flex justify-center">
                          <button
                            onClick={() => handleEditCustomer(cust)}
                            className="bg-[#28A745] hover:bg-[#218838] text-white p-2 rounded-full shadow-md transition duration-200"
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
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
                  <h3 className="text-2xl font-semibold mb-4 text-gray-800">Edit Customer Details</h3>
                  <form onSubmit={handleUpdateCustomer} className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="edit-firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                      <input type="text" name="firstName" id="edit-firstName" value={customerEditForm.firstName} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" required />
                    </div>
                    <div>
                      <label htmlFor="edit-fatherName" className="block text-sm font-medium text-gray-700">Father's Name</label>
                      <input type="text" name="fatherName" id="edit-fatherName" value={customerEditForm.fatherName} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-familyName" className="block text-sm font-medium text-gray-700">Family Name</label>
                      <input type="text" name="familyName" id="edit-familyName" value={customerEditForm.familyName} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" required />
                    </div>
                    <div>
                      <label htmlFor="edit-id" className="block text-sm font-medium text-gray-700">ID</label>
                      <input type="text" name="id" id="edit-id" value={customerEditForm.id} readOnly className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-realId" className="block text-sm font-medium text-gray-700">Real ID</label>
                      <input type="text" name="realId" id="edit-realId" value={customerEditForm.realId} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" placeholder="e.g., ЕГН/ЛНЧ" />
                    </div>
                    <div>
                      <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700">Address</label>
                      <input type="text" name="address" id="edit-address" value={customerEditForm.address} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-city" className="block text-sm font-medium text-gray-700">City</label>
                      <input type="text" name="city" id="edit-city" value={customerEditForm.city} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-postCode" className="block text-sm font-medium text-gray-700">Post Code</label>
                      <input type="text" name="postCode" id="edit-postCode" value={customerEditForm.postCode} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input type="email" name="email" id="edit-email" value={customerEditForm.email} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700">Phone</label>
                      <input type="tel" name="phone" id="edit-phone" value={customerEditForm.phone} onChange={handleCustomerEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                    </div>
                    <div className="flex justify-end space-x-3 mt-4 col-span-full">
                      <button
                        type="button"
                        onClick={() => setShowCustomerEditModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 shadow-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md"
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
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Bus Tours</h2>

            {/* Filters for Tours */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div>
                <label htmlFor="filterTourHotel" className="block text-sm font-medium text-gray-700">Hotel</label>
                <input
                  type="text"
                  name="filterTourHotel"
                  id="filterTourHotel"
                  value={filterTourHotel}
                  onChange={handleTourFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  placeholder="Filter by hotel name"
                />
              </div>
              <div>
                <label htmlFor="filterTourTransportCompany" className="block text-sm font-medium text-gray-700">Transport Company</label>
                <input
                  type="text"
                  name="filterTourTransportCompany"
                  id="filterTourTransportCompany"
                  value={filterTourTransportCompany}
                  onChange={handleTourFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  placeholder="Filter by company"
                />
              </div>
              <div>
                <label htmlFor="filterTourDepartureDate" className="block text-sm font-medium text-gray-700">Departure After</label>
                <input
                  type="date"
                  name="filterTourDepartureDate"
                  id="filterTourDepartureDate"
                  value={filterTourDepartureDate}
                  onChange={handleTourFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="filterTourArrivalDate" className="block text-sm font-medium text-gray-700">Arrival Before</label>
                <input
                  type="date"
                  name="filterTourArrivalDate"
                  id="filterTourArrivalDate"
                  value={filterTourArrivalDate}
                  onChange={handleTourFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                />
              </div>
              <div className="md:col-span-full flex justify-end">
                <button
                  type="button"
                  onClick={resetTourFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 shadow-sm border border-gray-200"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {filteredTours.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No bus tours found matching your criteria. Add a new tour to get started!</p>
            ) : (
              <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium">Tour ID</th>
                      <th className="py-3 px-4 text-left font-medium">Hotel</th>
                      <th className="py-3 px-4 text-left font-medium">Departure Date</th>
                      <th className="py-3 px-4 text-left font-medium">Arrival Date</th>
                      <th className="py-3 px-4 text-right font-medium">Max Passengers</th>
                      <th className="py-3 px-4 text-right font-medium">Booked Passengers</th>
                      <th className="py-3 px-4 text-right font-medium">Fulfillment %</th>
                      <th className="py-3 px-4 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {filteredTours.map(tour => {
                      const linkedReservations = getLinkedReservations(tour.tourId);
                      const bookedPassengers = linkedReservations.reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0);
                      const fulfillment = tour.maxPassengers > 0 ? (bookedPassengers / tour.maxPassengers) * 100 : 0;
                      return (
                        <tr key={tour.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                          <td className="py-3 px-4 font-mono text-sm text-gray-600">{tour.tourId}</td> {/* Styled tour ID */}
                          <td className="py-3 px-4">{tour.hotel}</td>
                          <td className="py-3 px-4 text-gray-600">{tour.departureDate}</td>
                          <td className="py-3 px-4 text-gray-600">{tour.arrivalDate}</td>
                          <td className="py-3 px-4 text-right">{tour.maxPassengers}</td>
                          <td className="py-3 px-4 text-right">{bookedPassengers}</td>
                          <td className="py-3 px-4 text-right">{fulfillment.toFixed(1)}%</td>
                          <td className="py-3 px-4 flex justify-center space-x-2">
                            <button
                              onClick={() => setSelectedTour(tour)}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md transition duration-200" // Blue button for view
                              title="View Tour Details"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path fillRule="evenodd" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditTour(tour)}
                              className="bg-[#28A745] hover:bg-[#218838] text-white p-2 rounded-full shadow-md transition duration-200"
                              title="Edit Tour"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-5.69 5.69L11.586 7.586 14.414 10.414 11.586 13.242 8.758 10.414l2.828-2.828z" />
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm-4 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 14a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM3 18a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                            {/* --- NEW PRINT TOUR CONTRACT BUTTON --- */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTourToGenerateContract(tour);
                                  setActiveTab('busTourContract'); // This will trigger rendering of BusTourContractPrint
                                }}
                                className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full shadow-md transition duration-200"
                                title="Print Tour Contract"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                              </button>
                            <button
                              onClick={() => handleDeleteTour(tour.tourId)}
                              className="bg-[#DC3545] hover:bg-[#C82333] text-white p-2 rounded-full shadow-md transition duration-200"
                              title="Delete"
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
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl relative">
                  <h3 className="text-2xl font-semibold mb-4 text-gray-800">Tour Details: <span className="text-blue-600">{selectedTour.tourId}</span></h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 mb-6">
                    <div><strong>Departure:</strong> <span className="text-gray-600">{selectedTour.departureDate}</span></div>
                    <div><strong>Arrival:</strong> <span className="text-gray-600">{selectedTour.arrivalDate}</span></div>
                    <div><strong>Nights:</strong> <span className="font-semibold">{selectedTour.nights}</span></div>
                    <div><strong>Days (incl. Travel):</strong> <span className="font-semibold">{selectedTour.daysInclTravel}</span></div>
                    <div><strong>Transport Company:</strong> <span className="text-gray-600">{selectedTour.transportCompany || 'N/A'}</span></div>
                    <div><strong>Hotel:</strong> <span className="font-semibold">{selectedTour.hotel || 'N/A'}</span></div>
                    <div><strong>Max Passengers:</strong> <span className="font-semibold">{selectedTour.maxPassengers}</span></div>
                {/* NEW TOUR DETAIL DISPLAY FIELDS */}
                <div className="md:col-span-2"><strong>Час и място на тръгване:</strong> <span className="text-gray-600">{selectedTour.departureDateTimePlace || 'N/A'}</span></div>
                <div className="md:col-span-2"><strong>Описание на транспорта:</strong> <span className="text-gray-600">{selectedTour.transportDescription || 'N/A'}</span></div>
                <div className="md:col-span-2"><strong>Информация за застраховка:</strong> <span className="text-gray-600">{selectedTour.insuranceDetails || 'N/A'}</span></div>
                <div className="md:col-span-2"><strong>Хотели по тура:</strong> <span className="text-gray-600">{selectedTour.tourHotels || 'N/A'}</span></div>
                <div className="md:col-span-2"><strong>Обобщение стаи по тура:</strong> <span className="text-gray-600">{selectedTour.tourRoomSummary || 'N/A'}</span></div>
                <div className="md:col-span-2"><strong>Включени хранения:</strong> <span className="text-gray-600">{selectedTour.mealsIncluded || 'N/A'}</span></div>
                {/* END OF NEW TOUR DETAIL DISPLAY FIELDS */}
                    <div><strong>Booked Passengers:</strong> <span className="font-semibold">{getLinkedReservations(selectedTour.tourId).reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0)}</span></div>
                    <div><strong>Fulfillment %:</strong> <span className="font-semibold text-[#28A745]">{((getLinkedReservations(selectedTour.tourId).reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0) / selectedTour.maxPassengers) * 100 || 0).toFixed(1)}%</span></div>
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-gray-800">Linked Reservations</h4>
                  {getLinkedReservations(selectedTour.tourId).length === 0 ? (
                    <p className="text-gray-600">No reservations linked to this tour.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-60 rounded-lg border border-gray-100 shadow-sm">
                      <table className="min-w-full bg-white">
                        <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
                          <tr>
                            <th className="py-2 px-3 text-left text-sm font-medium">Res. No.</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Lead Guest</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Dates</th>
                            <th className="py-2 px-3 text-right text-sm font-medium">Adults/Children</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getLinkedReservations(selectedTour.tourId).map(res => (
                            <tr key={res.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                              <td className="py-2 px-3 text-sm text-gray-600">{res.reservationNumber}</td>
                              <td className="py-2 px-3 text-sm">{res.tourists && res.tourists.length > 0 ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : 'N/A'}</td>
                              <td className="py-2 px-3 text-sm text-gray-600">{res.checkIn} - {res.checkOut}</td>
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
                      className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition duration-200 shadow-md" // Dark button
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
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
              {selectedTour ? 'Edit Bus Tour' : 'Create New Bus Tour'}
            </h2>
            <form onSubmit={handleSubmitTour} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label htmlFor="tourId" className="block text-sm font-medium text-gray-700">Tour ID</label>
                <input
                  type="text"
                  name="tourId"
                  id="tourId"
                  value={tourForm.tourId}
                  onChange={handleTourFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2 bg-gray-100"
                  placeholder="Auto-generated or editable"
                  disabled={!!selectedTour}
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
           />
         </div>
         {/* NEW BUS TOUR FIELDS BELOW */}
         <div>
           <label htmlFor="departureDateTimePlace" className="block text-sm font-medium text-gray-700">Час и място на тръгване</label>
           <input
             type="text" // Using text for flexibility (e.g., "06:00, Sofia, Nevsky Sq.")
             name="departureDateTimePlace"
             id="departureDateTimePlace"
             value={tourForm.departureDateTimePlace}
             onChange={handleTourFormChange}
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
             placeholder="Напр. 06:00, гр. София, пл. Ал. Невски"
           />
         </div>
         <div className="md:col-span-2"> {/* Span 2 columns for textarea */}
           <label htmlFor="transportDescription" className="block text-sm font-medium text-gray-700">2. Транспорт</label>
           <textarea
             name="transportDescription"
             id="transportDescription"
             rows="2"
             value={tourForm.transportDescription}
             onChange={handleTourFormChange}
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
             placeholder="Напр. Комфортен туристически автобус"
           ></textarea>
         </div>
         <div className="md:col-span-2"> {/* Span 2 columns for textarea */}
           <label htmlFor="insuranceDetails" className="block text-sm font-medium text-gray-700">Застраховка (описание)</label>
           <textarea
             name="insuranceDetails"
             id="insuranceDetails"
             rows="2"
             value={tourForm.insuranceDetails}
             onChange={handleTourFormChange}
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
             placeholder="Напр. Медицинска застраховка 'Помощ при пътуване'"
           ></textarea>
         </div>
         <div className="md:col-span-2"> {/* Span 2 columns for textarea */}
           <label htmlFor="tourHotels" className="block text-sm font-medium text-gray-700">Хотели (множество)</label>
           <textarea
             name="tourHotels"
             id="tourHotels"
             rows="2"
             value={tourForm.tourHotels}
             onChange={handleTourFormChange}
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
             placeholder="Напр. Хотел 'Планина', Хотел 'Изгрев'"
           ></textarea>
         </div>
         <div className="md:col-span-2"> {/* Span 2 columns for textarea */}
           <label htmlFor="tourRoomSummary" className="block text-sm font-medium text-gray-700">Брой и вид стаи (общо за тура)</label>
           <textarea
             name="tourRoomSummary"
             id="tourRoomSummary"
             rows="2"
             value={tourForm.tourRoomSummary}
             onChange={handleTourFormChange}
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
             placeholder="Напр. 10 двойни стаи, 5 тройни стаи"
           ></textarea>
         </div>
         <div className="md:col-span-2"> {/* Span 2 columns for textarea */}
           <label htmlFor="mealsIncluded" className="block text-sm font-medium text-gray-700">Брой и вид на храненията, включени в пакетната цена</label>
           <textarea
             name="mealsIncluded"
             id="mealsIncluded"
             rows="2"
             value={tourForm.mealsIncluded}
             onChange={handleTourFormChange}
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
             placeholder="Напр. 2 закуски и 2 вечери"
           ></textarea>
         </div>
         {/* END OF NEW BUS TOUR FIELDS */}
              <div>
                <label htmlFor="hotelTour" className="block text-sm font-medium text-gray-700">Hotel (Primary for Tour)</label>
                <input
                  type="text"
                  name="hotel"
                  id="hotelTour"
                  value={tourForm.hotel}
                  onChange={handleTourFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  required
                />
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    resetTourForm();
                    setActiveTab('tours');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md"
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
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Financial Transactions</h2>
            {financialTransactions.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No financial transactions found. Add income or expenses to get started!</p>
            ) : (
              <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium">Date</th>
                      <th className="py-3 px-4 text-left font-medium">Type</th>
                      <th className="py-3 px-4 text-left font-medium">Method</th>
                      <th className="py-3 px-4 text-left font-medium">Amount</th>
                      <th className="py-3 px-4 text-left font-medium">VAT</th>
                      <th className="py-3 px-4 text-left font-medium">Description</th>
                      <th className="py-3 px-4 text-left font-medium">Linked To</th>
                      <th className="py-3 px-4 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {filteredFinancialTransactions.map(ft => (
                      <tr key={ft.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-3 px-4 text-gray-600">{ft.date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ft.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {ft.type.charAt(0).toUpperCase() + ft.type.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">{ft.method}</td>
                        <td className="py-3 px-4 text-right font-semibold">BGN {(ft.amount || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-gray-600">BGN {(ft.vat || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-gray-600">{ft.reasonDescription}</td>
                        <td className="py-3 px-4 text-gray-500">
                          {ft.associatedReservationId ? `Res: ${ft.associatedReservationId}` :
                            ft.associatedTourId ? `Tour: ${ft.associatedTourId}` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditFinancialTransaction(ft)}
                            className="bg-[#28A745] hover:bg-[#218838] text-white p-2 rounded-full shadow-md transition duration-200"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-5.69 5.69L11.586 7.586 14.414 10.414 11.586 13.242 8.758 10.414l2.828-2.828z" />
                              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm-4 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 14a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM3 18a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteFinancialTransaction(ft.id)}
                            className="bg-[#DC3545] hover:bg-[#C82333] text-white p-2 rounded-full shadow-md transition duration-200"
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

    case 'addFinancialTransaction':
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
              {selectedFinancialTransaction ? 'Edit Financial Transaction' : 'Add Financial Transaction'}
            </h2>
            <form onSubmit={handleSubmitFinancialTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  name="date"
                  id="transactionDate"
                  value={financialTransactionForm.date}
                  onChange={handleFinancialTransactionFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  name="method"
                  id="method"
                  value={financialTransactionForm.method}
                  onChange={handleFinancialTransactionFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                >
                  <option value="Bank">Bank</option>
                  <option value="Cash">Cash</option>
                  <option value="Cash 2">Cash 2</option>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  required
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                ></textarea>
              </div>

              {/* Association fields */}
              <div>
                <label htmlFor="associatedReservationId" className="block text-sm font-medium text-gray-700">Associate with Reservation</label>
                <select
                  name="associatedReservationId"
                  id="associatedReservationId"
                  value={financialTransactionForm.associatedReservationId}
                  onChange={handleFinancialTransactionFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                >
                  <option value="">-- None --</option>
                  {reservations.map(res => (
                    <option key={res.id} value={res.reservationNumber}>
                      {res.reservationNumber} - {res.hotel} ({res.checkIn})
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                >
                  <option value="">-- None --</option>
                  {tours.map(tour => (
                    <option key={tour.id} value={tour.tourId}>
                      {tour.tourId} - {tour.hotel} ({tour.departureDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    resetFinancialTransactionForm();
                    setActiveTab('payments');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : selectedFinancialTransaction ? 'Update Transaction' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        );

case 'financialReports':
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Financial Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div>
                <label htmlFor="reportStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" name="reportStartDate" id="reportStartDate" value={reportStartDate} onChange={handleReportFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
              </div>
              <div>
                <label htmlFor="reportEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
                <input type="date" name="reportEndDate" id="reportEndDate" value={reportEndDate} onChange={handleReportFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
              </div>
              <div>
                <label htmlFor="reportFilterType" className="block text-sm font-medium text-gray-700">Type</label>
                <select name="reportFilterType" id="reportFilterType" value={reportFilterType} onChange={handleReportFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2">
                  <option value="all">All</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label htmlFor="reportFilterMethod" className="block text-sm font-medium text-gray-700">Method</label>
                <select name="reportFilterMethod" id="reportFilterMethod" value={reportFilterMethod} onChange={handleReportFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2">
                  <option value="all">All Methods</option>
                  <option value="Bank">Bank</option>
                  <option value="Cash">Cash</option>
                  <option value="Cash 2">Cash 2</option>
                </select>
              </div>
              <div className="xl:col-span-2">
                <label htmlFor="reportFilterAssociation" className="block text-sm font-medium text-gray-700">Associated With (ID)</label>
                <input type="text" name="reportFilterAssociation" id="reportFilterAssociation" value={reportFilterAssociation} onChange={handleReportFilterChange} placeholder="Res/Tour ID" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
              </div>
              <div className="md:col-span-full xl:col-span-1 flex items-end">
                <button type="button" onClick={resetFinancialReportsFilters} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 shadow-sm border border-gray-200">
                  Reset Filters
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 text-center">
                <h3 className="font-semibold text-xl text-gray-700">Total Income</h3>
                <p className="text-2xl font-bold text-[#28A745]">BGN {reportTotals.totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 text-center">
                <h3 className="font-semibold text-xl text-gray-700">Total Expenses</h3>
                <p className="text-2xl font-bold text-[#DC3545]">BGN {reportTotals.totalExpenses.toFixed(2)}</p>
              </div>
              <div className={`p-6 rounded-xl shadow-md border ${reportTotals.netProfit >= 0 ? 'bg-white border-gray-100' : 'bg-red-50 border-red-200'} text-center`}>
                <h3 className="font-semibold text-xl text-gray-700">Net Profit/Loss</h3>
                <p className={`text-2xl font-bold ${reportTotals.netProfit >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>BGN {reportTotals.netProfit.toFixed(2)}</p>
              </div>
            </div>

            {filteredFinancialTransactions.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No transactions match the selected filters.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 text-left"><button onClick={() => requestSort('date')} className="font-medium flex items-center space-x-1 hover:text-gray-900"><span>Date</span><span className="w-4">{sortConfig.key === 'date' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</span></button></th>
                      <th className="py-3 px-4 text-left font-medium">Type</th>
                      <th className="py-3 px-4 text-left"><button onClick={() => requestSort('method')} className="font-medium flex items-center space-x-1 hover:text-gray-900"><span>Method</span><span className="w-4">{sortConfig.key === 'method' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</span></button></th>
                      <th className="py-3 px-4 text-right"><button onClick={() => requestSort('amount')} className="font-medium flex items-center space-x-1 hover:text-gray-900"><span>Amount</span><span className="w-4">{sortConfig.key === 'amount' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</span></button></th>
                      <th className="py-3 px-4 text-left font-medium">Description</th>
                      <th className="py-3 px-4 text-left font-medium">Linked To</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {filteredFinancialTransactions.map(ft => (
                      <tr key={ft.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600">{ft.date}</td>
                        <td className="py-3 px-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${ft.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{ft.type.charAt(0).toUpperCase() + ft.type.slice(1)}</span></td>
                        <td className="py-3 px-4">{ft.method}</td>
                        <td className="py-3 px-4 text-right font-semibold">BGN {(ft.amount || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-gray-600">{ft.reasonDescription}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                           {[ft.associatedReservationId && `Res: ${ft.associatedReservationId}`, ft.associatedTourId && `Tour: ${ft.associatedTourId}`].filter(Boolean).join(', ') || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'invoicingDashboard':
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Invoicing Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Invoices */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="font-semibold text-xl text-gray-700 mb-3">Total Invoices</h3>
                <p className="text-gray-600 text-lg">Sales Invoices: <span className="font-bold text-gray-800">{invoicingDashboardStats.totalSalesInvoices}</span></p>
                <p className="text-gray-600 text-lg">Expense Invoices: <span className="font-bold text-gray-800">{invoicingDashboardStats.totalExpenseInvoices}</span></p>
              </div>

              {/* Total Sales */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="font-semibold text-xl text-gray-700 mb-3">Total Sales (Income)</h3>
                <p className="text-gray-600 text-lg">Amount: <span className="font-bold text-[#28A745]">BGN {invoicingDashboardStats.totalSalesAmount} (EUR {invoicingDashboardStats.totalSalesAmountEUR})</span></p>
                <p className="text-gray-600 text-lg">VAT: <span className="font-bold text-[#28A745]">BGN {invoicingDashboardStats.totalSalesVAT} (EUR {invoicingDashboardStats.totalSalesVATEUR})</span></p>
              </div>

              {/* Total Expenses */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="font-semibold text-xl text-gray-700 mb-3">Total Expenses</h3>
                <p className="text-gray-600 text-lg">Amount: <span className="font-bold text-[#DC3545]">BGN {invoicingDashboardStats.totalExpenseAmount} (EUR {invoicingDashboardStats.totalExpenseAmountEUR})</span></p>
                <p className="text-gray-600 text-lg">VAT: <span className="font-bold text-[#DC3545]">BGN {invoicingDashboardStats.totalExpenseVAT} (EUR {invoicingDashboardStats.totalExpenseVATEUR})</span></p>
              </div>

              {/* Net Profit/Loss */}
              <div className={`p-6 rounded-xl shadow-md border ${invoicingDashboardStats.netProfitInvoicing >= 0 ? 'bg-white border-gray-100' : 'bg-red-50 border-red-200'}`}>
                <h3 className="font-semibold text-xl text-gray-700 mb-3">Net Profit/Loss</h3>
                <p className={`text-2xl font-bold ${invoicingDashboardStats.netProfitInvoicing >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>BGN {invoicingDashboardStats.netProfitInvoicing} (EUR {invoicingDashboardStats.netProfitInvoicingEUR})</p>
              </div>

              {/* Net VAT */}
              <div className={`p-6 rounded-xl shadow-md border ${invoicingDashboardStats.netVAT >= 0 ? 'bg-white border-gray-100' : 'bg-red-50 border-red-200'}`}>
                <h3 className="font-semibold text-xl text-gray-700 mb-3">Net VAT</h3>
                <p className={`text-2xl font-bold ${invoicingDashboardStats.netVAT >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>BGN {invoicingDashboardStats.netVAT} (EUR {invoicingDashboardStats.netVATEUR})</p>
              </div>
            </div>
          </div>
        );

      // Expense Invoices List and Form
      case 'invoicingExpenses':
      case 'addExpenseInvoice': // Combined for add/edit
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
              {activeTab === 'addExpenseInvoice' ? (selectedExpenseInvoice ? 'Edit Expense Invoice' : 'Add New Expense Invoice') : 'Expense Invoices'}
            </h2>

            {activeTab === 'addExpenseInvoice' ? (
              // Expense Invoice Add/Edit Form
              <form onSubmit={handleSubmitExpenseInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="col-span-full text-lg font-semibold text-gray-800">Supplier Details</div>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    id="companyName"
                    value={expenseInvoiceForm.companyName}
                    onChange={handleExpenseInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="companyID" className="block text-sm font-medium text-gray-700">Company ID</label>
                  <input
                    type="text"
                    name="companyID"
                    id="companyID"
                    value={expenseInvoiceForm.companyID}
                    onChange={handleExpenseInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="vatID" className="block text-sm font-medium text-gray-700">VAT ID</label>
                  <input
                    type="text"
                    name="vatID"
                    id="vatID"
                    value={expenseInvoiceForm.vatID}
                    onChange={handleExpenseInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    id="invoiceNumber"
                    value={expenseInvoiceForm.invoiceNumber}
                    onChange={handleExpenseInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700">Invoice Date</label>
                  <input
                    type="date"
                    name="invoiceDate"
                    id="invoiceDate"
                    value={expenseInvoiceForm.invoiceDate}
                    onChange={handleExpenseInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    id="dueDate"
                    value={expenseInvoiceForm.dueDate}
                    onChange={handleExpenseInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  />
                </div>
                <div className="col-span-full">
                  <label htmlFor="productsServices" className="block text-sm font-medium text-gray-700">Products/Services Description</label>
                  <textarea
                    name="productsServices"
                    id="productsServices"
                    value={expenseInvoiceForm.productsServices}
                    onChange={handleExpenseInvoiceFormChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    name="paymentMethod"
                    id="paymentMethod"
                    value={expenseInvoiceForm.paymentMethod}
                    onChange={handleExpenseInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  >
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                    <option value="Cash 2">Cash 2</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">Total Amount (BGN)</label>
                  <input
                    type="number"
                    name="totalAmount"
                    id="totalAmount"
                    value={expenseInvoiceForm.totalAmount}
                    onChange={handleExpenseInvoiceFormChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="totalVAT" className="block text-sm font-medium text-gray-700">Total VAT (BGN)</label>
                  <input
                    type="number"
                    name="totalVAT"
                    id="totalVAT"
                    value={expenseInvoiceForm.totalVAT}
                    onChange={handleExpenseInvoiceFormChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  />
                </div>
                <div className="col-span-full">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    id="notes"
                    value={expenseInvoiceForm.notes}
                    onChange={handleExpenseInvoiceFormChange}
                    rows="2"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  ></textarea>
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3 mt-8">
                  <button
                    type="button"
                    onClick={() => { resetExpenseInvoiceForm(); setActiveTab('invoicingExpenses'); }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : selectedExpenseInvoice ? 'Update Expense Invoice' : 'Add Expense Invoice'}
                  </button>
                </div>
              </form>
            ) : (
              // Expense Invoices List
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => { resetExpenseInvoiceForm(); setActiveTab('addExpenseInvoice'); }}
                    className="px-6 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md"
                  >
                    Add New Expense Invoice
                  </button>
                </div>
                {expenseInvoices.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No expense invoices found. Add a new one to get started!</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="py-3 px-4 text-left font-medium">Invoice No.</th>
                          <th className="py-3 px-4 text-left font-medium">Company Name</th>
                          <th className="py-3 px-4 text-left font-medium">Date</th>
                          <th className="py-3 px-4 text-right font-medium">Amount (BGN)</th>
                          <th className="py-3 px-4 text-right font-medium">VAT (BGN)</th>
                          <th className="py-3 px-4 text-left font-medium">Payment Method</th>
                          <th className="py-3 px-4 text-center font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700">
                        {expenseInvoices.map(inv => (
                          <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                            <td className="py-3 px-4 text-gray-600 font-mono text-sm">{inv.invoiceNumber}</td>
                            <td className="py-3 px-4">{inv.companyName}</td>
                            <td className="py-3 px-4 text-gray-600">{inv.invoiceDate}</td>
                            <td className="py-3 px-4 text-right font-semibold text-[#DC3545]">BGN {parseFloat(inv.totalAmount).toFixed(2)}</td> {/* Expenses in red */}
                            <td className="py-3 px-4 text-right text-gray-600">BGN {parseFloat(inv.totalVAT).toFixed(2)}</td>
                            <td className="py-3 px-4 text-gray-600">{inv.paymentMethod}</td>
                            <td className="py-3 px-4 flex justify-center space-x-2">
                              <button
                                onClick={() => handleEditExpenseInvoice(inv)}
                                className="bg-[#28A745] hover:bg-[#218838] text-white p-2 rounded-full shadow-md transition duration-200"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-5.69 5.69L11.586 7.586 14.414 10.414 11.586 13.242 8.758 10.414l2.828-2.828z" />
                                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm-4 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 14a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM3 18a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteExpenseInvoice(inv.id)}
                                className="bg-[#DC3545] hover:bg-[#C82333] text-white p-2 rounded-full shadow-md transition duration-200"
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
              </>
            )}
          </div>
        );

case 'invoicingSales':
      case 'addSalesInvoice': // Handle both list and add/edit form in one case
        // Create a sorted copy of the sales invoices array for display
        const sortedSalesInvoices = [...salesInvoices].sort((a, b) => {
            const numA = parseInt(a.invoiceNumber?.substring(3) || '0', 10);
            const numB = parseInt(b.invoiceNumber?.substring(3) || '0', 10);
            return numB - numA;
        });

        return (
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
              {activeTab === 'addSalesInvoice' ? (selectedSalesInvoice ? 'Edit Sales Invoice' : 'Add New Sales Invoice') : 'Sales Invoices'}
            </h2>

            {activeTab === 'addSalesInvoice' ? (
              // Sales Invoice Add/Edit Form
              <form onSubmit={handleSubmitSalesInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="col-span-full text-lg font-semibold text-gray-800">Client Details</div>
                <div>
                  <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    id="invoiceNumber"
                    value={salesInvoiceForm.invoiceNumber}
                    onChange={handleSalesInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2 bg-gray-100"
                    placeholder="Auto-generated or editable"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700">Invoice Date</label>
                  <input
                    type="date"
                    name="invoiceDate"
                    id="invoiceDate"
                    value={salesInvoiceForm.invoiceDate}
                    onChange={handleSalesInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    id="clientName"
                    value={salesInvoiceForm.clientName}
                    onChange={handleSalesInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="clientMOL" className="block text-sm font-medium text-gray-700">Client MOL</label>
                  <input
                    type="text"
                    name="clientMOL"
                    id="clientMOL"
                    value={salesInvoiceForm.clientMOL}
                    onChange={handleSalesInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="clientID" className="block text-sm font-medium text-gray-700">Client ID</label>
                  <input
                    type="text"
                    name="clientID"
                    id="clientID"
                    value={salesInvoiceForm.clientID}
                    onChange={handleSalesInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="clientVATID" className="block text-sm font-medium text-gray-700">Client VAT ID</label>
                  <input
                    type="text"
                    name="clientVATID"
                    id="clientVATID"
                    value={salesInvoiceForm.clientVATID}
                    onChange={handleSalesInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700">Client Address</label>
                  <input
                    type="text"
                    name="clientAddress"
                    id="clientAddress"
                    value={salesInvoiceForm.clientAddress}
                    onChange={handleSalesInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="clientCity" className="block text-sm font-medium text-gray-700">Client City</label>
                  <input
                    type="text"
                    name="clientCity"
                    id="clientCity"
                    value={salesInvoiceForm.clientCity}
                    onChange={handleSalesInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="clientPostCode" className="block text-sm font-medium text-gray-700">Client Post Code</label>
                  <input
                    type="text"
                    name="clientPostCode"
                    id="clientPostCode"
                    value={salesInvoiceForm.clientPostCode}
                    onChange={handleSalesInvoiceFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                  />
                </div>

                {/* Products Section */}
                <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Products/Services</h3>
                  {salesInvoiceForm.products.map((product, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border border-gray-200 rounded-lg p-4 mb-4 relative shadow-sm">
                      <h4 className="col-span-full text-md font-medium text-gray-700 mb-2">Item {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeSalesInvoiceProduct(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full text-xs transition duration-200"
                        title="Remove Product"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <div>
                        <label htmlFor={`productCode-${index}`} className="block text-sm font-medium text-gray-700">Product Code</label>
                        <select name="productCode" id={`productCode-${index}`} value={product.productCode} onChange={(e) => handleSalesInvoiceProductChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" required>
                          <option value="">Select Product</option>
                          {products.map(p => (<option key={p.id} value={p.productCode}>{p.productName} ({p.productCode})</option>))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`productName-${index}`} className="block text-sm font-medium text-gray-700">Product Name</label>
                        <input type="text" name="productName" id={`productName-${index}`} value={product.productName} onChange={(e) => handleSalesInvoiceProductChange(index, e)} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2" readOnly />
                      </div>
                      <div>
                        <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input type="number" name="quantity" id={`quantity-${index}`} value={product.quantity} onChange={(e) => handleSalesInvoiceProductChange(index, e)} min="1" step="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" required />
                      </div>
                      <div>
                        <label htmlFor={`price-${index}`} className="block text-sm font-medium text-gray-700">Price (per unit)</label>
                        <input type="number" name="price" id={`price-${index}`} value={product.price} onChange={(e) => handleSalesInvoiceProductChange(index, e)} min="0" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" required />
                      </div>
                      <div>
                        <label htmlFor={`vatRate-${index}`} className="block text-sm font-medium text-gray-700">VAT Rate (%)</label>
                        <input type="number" name="vatRate" id={`vatRate-${index}`} value={product.vatRate} onChange={(e) => handleSalesInvoiceProductChange(index, e)} min="0" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" required />
                      </div>
                      <div>
                        <label htmlFor={`lineTotal-${index}`} className="block text-sm font-medium text-gray-700">Line Total (BGN)</label>
                        <input type="number" name="lineTotal" id={`lineTotal-${index}`} value={(product.lineTotal || 0).toFixed(2)} readOnly className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2" />
                      </div>
                      <div>
                        <label htmlFor={`lineVAT-${index}`} className="block text-sm font-medium text-gray-700">Line VAT (BGN)</label>
                        <input type="number" name="lineVAT" id={`lineVAT-${index}`} value={(product.lineVAT || 0).toFixed(2)} readOnly className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2" />
                      </div>
                      <div>
                        <label htmlFor={`lineGrandTotal-${index}`} className="block text-sm font-medium text-gray-700">Line Grand Total (BGN)</label>
                        <input type="number" name="lineGrandTotal" id={`lineGrandTotal-${index}`} value={(product.lineGrandTotal || 0).toFixed(2)} readOnly className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addSalesInvoiceProduct} className="mt-4 px-6 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md">
                    Add Product
                  </button>
                </div>

                {/* Totals & Other Details */}
   {/* Totals & Other Details */}
                <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Payment & Other Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="paymentMethodSales" className="block text-sm font-medium text-gray-700">Payment Method</label>
                      <select name="paymentMethod" id="paymentMethodSales" value={salesInvoiceForm.paymentMethod} onChange={handleSalesInvoiceFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2">
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                        <option value="Cash 2">Cash 2</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dueDateSales" className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input type="date" name="dueDate" id="dueDateSales" value={salesInvoiceForm.dueDate} onChange={handleSalesInvoiceFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"/>
                    </div>
                    <div>
                      <label htmlFor="transactionBasis" className="block text-sm font-medium text-gray-700">Основание на сделката</label>
                      <input type="text" name="transactionBasis" id="transactionBasis" value={salesInvoiceForm.transactionBasis} onChange={handleSalesInvoiceFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="transactionDescription" className="block text-sm font-medium text-gray-700">Описание на сделката</label>
                      <input type="text" name="transactionDescription" id="transactionDescription" value={salesInvoiceForm.transactionDescription} onChange={handleSalesInvoiceFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor="transactionPlace" className="block text-sm font-medium text-gray-700">Място на сделката</label>
                      <input type="text" name="transactionPlace" id="transactionPlace" value={salesInvoiceForm.transactionPlace} onChange={handleSalesInvoiceFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                    </div>
                     <div>
                      <label htmlFor="receivedBy" className="block text-sm font-medium text-gray-700">Получил (име)</label>
                      <input type="text" name="receivedBy" id="receivedBy" value={salesInvoiceForm.receivedBy} onChange={handleSalesInvoiceFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2" />
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" name="isCopy" id="isCopy" checked={salesInvoiceForm.isCopy} onChange={handleSalesInvoiceFormChange} className="h-5 w-5 text-[#28A745] focus:ring-[#28A745] border-gray-300 rounded" />
                      <label htmlFor="isCopy" className="ml-2 block text-sm font-medium text-gray-700">Is Copy</label>
                    </div>
                    <div>
                      <label htmlFor="grandTotalDisplay" className="block text-sm font-medium text-gray-700">Grand Total (incl. VAT)</label>
                      <input type="text" id="grandTotalDisplay" value={`BGN ${salesInvoiceForm.grandTotal.toFixed(2)}`} readOnly className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2 font-bold text-lg text-[#28A745]" />
                    </div>
                  </div>
                </div>
                <div className="col-span-full">
                  <label htmlFor="notesSales" className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea name="notes" id="notesSales" value={salesInvoiceForm.notes} onChange={handleSalesInvoiceFormChange} rows="2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"></textarea>
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3 mt-8">
                  <button type="button" onClick={() => { resetSalesInvoiceForm(); setActiveTab('invoicingSales'); }} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 shadow-sm">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md" disabled={loading}>
                    {loading ? 'Saving...' : selectedSalesInvoice ? 'Update Sales Invoice' : 'Add Sales Invoice'}
                  </button>
                </div>
              </form>
            ) : (
              // Sales Invoices List
              <>
                <div className="flex justify-end mb-4">
                  <button onClick={async () => { const newNumber = await generateSalesInvoiceNumber(); resetSalesInvoiceForm(); setSalesInvoiceForm(prev => ({...prev, invoiceNumber: newNumber})); setActiveTab('addSalesInvoice'); }} className="px-6 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md">
                    Add New Sales Invoice
                  </button>
                </div>
                {sortedSalesInvoices.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No sales invoices found.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="py-3 px-4 text-left font-medium">Invoice No.</th>
                          <th className="py-3 px-4 text-left font-medium">Date</th>
                          <th className="py-3 px-4 text-left font-medium">Client Name</th>
                          <th className="py-3 px-4 text-right font-medium">Grand Total</th>
                          <th className="py-3 px-4 text-left font-medium">Payment Method</th>
                          <th className="py-3 px-4 text-center font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700">
                        {sortedSalesInvoices.map(inv => (
                          <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                            <td className="py-3 px-4 text-gray-600 font-mono text-sm">{inv.invoiceNumber}</td>
                            <td className="py-3 px-4 text-gray-600">{inv.invoiceDate}</td>
                            <td className="py-3 px-4">{inv.clientName}</td>
                            <td className="py-3 px-4 text-right text-[#28A745] font-bold">BGN {parseFloat(inv.grandTotal).toFixed(2)}</td>
                            <td className="py-3 px-4 text-gray-600">{inv.paymentMethod}</td>
                            <td className="py-3 px-4 flex justify-center space-x-2">
                              <button onClick={() => setInvoiceToPrint(inv)} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md transition duration-200" title="Print">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                              </button>
                              <button onClick={() => handleEditSalesInvoice(inv)} className="bg-[#28A745] hover:bg-[#218838] text-white p-2 rounded-full shadow-md transition duration-200" title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-5.69 5.69L11.586 7.586 14.414 10.414 11.586 13.242 8.758 10.414l2.828-2.828z" /><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm-4 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 14a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM3 18a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                              </button>
                              <button onClick={() => handleDeleteSalesInvoice(inv.id)} className="bg-[#DC3545] hover:bg-[#C82333] text-white p-2 rounded-full shadow-md transition duration-200" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm-1 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1zm-1 3a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        );
        
      case 'invoicingProducts':
      case 'addProduct': // Combined for add/edit
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
              {activeTab === 'addProduct' ? (selectedProduct ? 'Edit Product' : 'Add New Product') : 'Product Management'}
            </h2>

            {activeTab === 'addProduct' ? (
              // Product Add/Edit Form
              <form onSubmit={handleSubmitProduct} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="productCode" className="block text-sm font-medium text-gray-700">Product Code</label>
                  <input
                    type="text"
                    name="productCode"
                    id="productCode"
                    value={productForm.productCode}
                    onChange={handleProductFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2 bg-gray-100"
                    placeholder="Auto-generated or editable"
                    disabled={!!selectedProduct}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    type="text"
                    name="productName"
                    id="productName"
                    value={productForm.productName}
                    onChange={handleProductFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (BGN)</label>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    value={productForm.price}
                    onChange={handleProductFormChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700">VAT Rate (%)</label>
                  <input
                    type="number"
                    name="vatRate"
                    id="vatRate"
                    value={productForm.vatRate}
                    onChange={handleProductFormChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28A745] focus:ring-[#28A745] px-3 py-2"
                    required
                  />
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3 mt-8">
                  <button
                    type="button"
                    onClick={() => { resetProductForm(); setActiveTab('invoicingProducts'); }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : selectedProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            ) : (
              // Product List
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => { resetProductForm(); setActiveTab('addProduct'); }}
                    className="px-6 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#218838] transition duration-200 shadow-md"
                  >
                    Add New Product
                  </button>
                </div>
                {products.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No products found. Add a new product to get started!</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="py-3 px-4 text-left font-medium">Code</th>
                          <th className="py-3 px-4 text-left font-medium">Name</th>
                          <th className="py-3 px-4 text-right font-medium">Price (BGN)</th>
                          <th className="py-3 px-4 text-right font-medium">VAT Rate (%)</th>
                          <th className="py-3 px-4 text-center font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700">
                        {products.map(prod => (
                          <tr key={prod.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                            <td className="py-3 px-4 text-gray-600 font-mono text-sm">{prod.productCode}</td>
                            <td className="py-3 px-4">{prod.productName}</td>
                            <td className="py-3 px-4 text-right font-semibold">BGN {parseFloat(prod.price).toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-gray-600">{parseFloat(prod.vatRate).toFixed(2)}%</td>
                            <td className="py-3 px-4 flex justify-center space-x-2">
                              <button
                                onClick={() => handleEditProduct(prod)}
                                className="bg-[#28A745] hover:bg-[#218838] text-white p-2 rounded-full shadow-md transition duration-200"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-5.69 5.69L11.586 7.586 14.414 10.414 11.586 13.242 8.758 10.414l2.828-2.828z" />
                                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm-4 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 14a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM3 18a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="bg-[#DC3545] hover:bg-[#C82333] text-white p-2 rounded-full shadow-md transition duration-200"
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
              </>
            )}
          </div>
        );
case 'transportContract':
        return (
          <div className="p-0 bg-white rounded-xl shadow-lg h-full">
            <iframe
              src="/transportcontract.html" // This loads the contract.html from your 'public' folder
              title="Transport Contract Generator"
              className="w-full h-full border-0 rounded-xl"
              style={{ minHeight: '80vh' }} // Ensures the frame has a good height
            />
          </div>
        );
case 'makeOffer':
        return (
          <div className="p-0 bg-white rounded-xl shadow-lg h-full">
            <iframe
              src="/offer.html" // Loads offer.html from the 'public' folder
              title="Offer Generator"
              className="w-full h-full border-0 rounded-xl"
              style={{ minHeight: '80vh' }}
            />
          </div>
        );
     case 'confirmation':
        return (
          <div className="p-0 bg-white rounded-xl shadow-lg h-full">
            <iframe
              src="/confirmation.html" // Loads confirmation.html from the 'public' folder
              title="Confirmation Generator"
              className="w-full h-full border-0 rounded-xl"
              style={{ minHeight: '80vh' }}
            />
          </div>
        );
case 'customerContract':
    if (reservationToGenerateContract) {
      // If a reservation was specifically selected from the list for printing
      // Render the dynamic CustomerContractPrint component
      return (
        <CustomerContractPrint
          reservationData={reservationToGenerateContract}
          onPrintFinish={() => {
            setReservationToGenerateContract(null); // Clear the selected reservation
            setActiveTab('reservations'); // Go back to the reservations list
          }}
        />
      );
    } else {
      // If user clicked 'Customer Contract' from sidebar directly (no reservation selected)
      // Render the original static ccontract.html in an iframe
      return (
        <div className="p-0 bg-white rounded-xl shadow-lg h-full relative">
          <iframe
            src="/ccontract.html"
            title="Static Customer Contract Generator"
            className="w-full h-full border-0 rounded-xl"
            style={{ minHeight: '80vh' }}
          />
          {/* Optional: Add a button to go back to dashboard/reservations from here if desired */}
          <div className="absolute top-4 right-4 z-10">
            <button
                onClick={() => setActiveTab('dashboard')} // Or 'reservations'
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition duration-200 shadow-md flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Назад към Начало
            </button>
          </div>
        </div>
      );
    }
        case 'busTourContract': // NEW CASE FOR BUS TOUR CONTRACT
    if (tourToGenerateContract) {
      return (
        <BusTourContractPrint
          tourData={tourToGenerateContract}
          onPrintFinish={() => {
            setTourToGenerateContract(null); // Clear the selected tour
            setActiveTab('tours'); // Go back to the tours list
          }}
        />
      );
    } else {
      // If user clicked 'Bus Tour Contract' from sidebar directly (no tour selected)
      return (
        <div className="p-0 bg-white rounded-xl shadow-lg h-full relative">
          <iframe
            src="/bustourcontract.html" // Assuming you might have a static fallback or template
            title="Static Bus Tour Contract Generator"
            className="w-full h-full border-0 rounded-xl"
            style={{ minHeight: '80vh' }}
          />
          <div className="absolute top-4 right-4 z-10">
            <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition duration-200 shadow-md flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return (
        <CustomerContractPrint
            reservationData={reservationToGenerateContract}
            onPrintFinish={() => {
                setReservationToGenerateContract(null); // Clear the selected reservation
                setActiveTab('reservations'); // Go back to the reservations list
            }}
        />
    );
      case 'createInvoice':
        return (
          <div className="p-0 bg-white rounded-xl shadow-lg h-full">
            <iframe
              src="/createinvoice.html" // Loads createinvoice.html from the 'public' folder
              title="Invoice Generator"
              className="w-full h-full border-0 rounded-xl"
              style={{ minHeight: '80vh' }}
            />
          </div>
        );
      default:
        return <div>Select a module from the sidebar.</div>;
    }
  };

  const handlePrintFinish = () => {
    setInvoiceToPrint(null);
  };

  // If an invoice has been selected for printing, render only the print component.
  if (invoiceToPrint) {
    return <InvoicePrint invoiceData={invoiceToPrint} onPrintFinish={handlePrintFinish} />;
  }



  if (invoiceToPrint) {
    return <InvoicePrint invoiceData={invoiceToPrint} onPrintFinish={handlePrintFinish} />;
  }

  return (
    <div className="font-sans antialiased bg-gray-100 min-h-screen text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-white text-gray-800 p-4 rounded-b-xl md:rounded-r-xl md:rounded-b-none shadow-lg border-r border-gray-100">
          <div className="flex items-center justify-center md:justify-start mb-6">
            <img src={Logo} alt="Dynamex Logo" className="h-40 w-auto mr-3" />
            <span className="font-semibold text-xl text-gray-900"></span>
          </div>
          <nav>
            <ul>
              {userId && (
                <>
                  <li className="mb-2">
                    <button onClick={() => { setActiveTab('dashboard'); }} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'dashboard' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                      Dashboard
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => { setActiveTab('reservations'); resetReservationForm(); }} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'reservations' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v2m-7 13v-3a2 2 0 012-2h2a2 2 0 012 2v3m-7 0H9m-7 0h4" /></svg>
                      Reservations
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => { setActiveTab('addReservation'); resetReservationForm(); }} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'addReservation' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Add Reservation
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => { setActiveTab('customers'); resetReservationForm(); }} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'customers' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2m3-2v2m0-7V11m0 4h.01M17 12h.01M12 12h.01M7 12h.01M6 16h9a2 2 0 002-2V7H6v9z" /></svg>
                      Customers
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => setActiveTab('tours')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'tours' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                      Bus Tours
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => { setActiveTab('addTour'); resetTourForm(); }} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'addTour' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Create Tour
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => setActiveTab('payments')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'payments' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 11h10a1 1 0 011 1v5a1 1 0 01-1 1H7a1 1 0 01-1-1v-5a1 1 0 011-1zM12 5V4m0 20v-1m-4-11H3m18 0h-1" /></svg>
                      Payments
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => { setActiveTab('addFinancialTransaction'); resetFinancialTransactionForm(); }} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'addFinancialTransaction' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Add Payment/Expense
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => { setActiveTab('financialReports'); resetFinancialReportsFilters(); }} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'financialReports' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-4m0 0h3m-3 0H7m-1 0v4m-2-4h2a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2h4m2 10h.01M17 17v-4m0 0h3m-3 0H17m-1 0v4m-2-4h2a2 2 0 012 2v2a2 2 0 01-2 2H14a2 2 0 01-2-2V7a2 2 0 012-2h4m2 10h.01M7 11a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1h2a1 1 0 011 1v2z" /></svg>
                      Financial Reports
                    </button>
                  </li>
                  <li className="mb-2 mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-bold mb-3 text-gray-500 uppercase tracking-wider">Invoicing</h3>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => setActiveTab('invoicingDashboard')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'invoicingDashboard' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                      Invoicing Dashboard
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => setActiveTab('invoicingSales')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'invoicingSales' || activeTab === 'addSalesInvoice' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 11h10a1 1 0 011 1v5a1 1 0 01-1 1H7a1 1 0 01-1-1v-5a1 1 0 011-1zM12 5V4m0 20v-1m-4-11H3m18 0h-1" /></svg>
                      Sales Invoices
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => setActiveTab('invoicingExpenses')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'invoicingExpenses' || activeTab === 'addExpenseInvoice' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 11h10a1 1 0 011 1v5a1 1 0 01-1 1H7a1 1 0 01-1-1v-5a1 1 0 011-1zM12 5V4m0 20v-1m-4-11H3m18 0h-1" /></svg>
                      Expense Invoices
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => setActiveTab('invoicingProducts')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'invoicingProducts' || activeTab === 'addProduct' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h.01M7 11h.01M7 15h.01M7 19h.01M17 7h.01M17 3h.01M17 11h.01M17 15h.01M17 19h.01M3 7h.01M3 3h.01M3 11h.01M3 15h.01M3 19h.01M21 7h.01M21 3h.01M21 11h.01M21 15h.01M21 19h.01M12 7h.01M12 3h.01M12 11h.01M12 15h.01M12 19h.01" /></svg>
                      Product Management
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => setActiveTab('transportContract')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'transportContract' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                      Transport Contract
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => setActiveTab('makeOffer')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'makeOffer' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" /></svg>
                      Make Offer
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => setActiveTab('confirmation')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'confirmation' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Confirmation
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => setActiveTab('customerContract')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'customerContract' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>
                      Customer Contract
                    </button>
                  </li>
                  <li className="mb-2">
                    <button onClick={() => setActiveTab('createInvoice')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base ${activeTab === 'createInvoice' ? 'bg-gray-100 text-[#28A745] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                         <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" /><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      Create Invoice
                    </button>
                  </li>
                  {isEmailPasswordUser && (
                    <li className="mb-2 mt-auto pt-6 border-t border-gray-200">
                      <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-base hover:bg-red-50 text-[#DC3545]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                      </button>
                    </li>
                  )}
                </>
              )}
            </ul>
          </nav>
          {userId && (
            <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500">
              <p>Logged in as:</p>
              <p className="break-all font-mono text-xs">{auth.currentUser?.email || 'Anonymous'}</p>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-100">
          <NotificationDisplay notifications={notifications} onDismiss={removeNotification} />
          {renderContent()}
        </main>
      </div>

      <ConfirmationModal
        show={showConfirmModal}
        message={confirmMessage}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
          }
          setShowConfirmModal(false);
          setConfirmAction(null);
          setConfirmMessage('');
        }}
        onCancel={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
          setConfirmMessage('');
        }}
      />
    </div>
  );
};

export default App;
