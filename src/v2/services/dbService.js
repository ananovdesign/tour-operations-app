import { db } from '../firebase'; // Увери се, че пътят е коректен спрямо src/v2/
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";

const BGN_RATE = 1.95583;

export const dbService = {
  // Универсална функция за запис (вече в Евро)
  saveDocument: async (collectionName, data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        currency: 'EUR', // Вече записваме всичко ново в Евро
        exchangeRate: BGN_RATE,
        createdAt: serverTimestamp(),
        v2: true // Маркер, че това е нов тип документ
      });
      return docRef.id;
    } catch (e) {
      console.error("Грешка при запис в Firestore: ", e);
      throw e;
    }
  },

  // Функция за вземане на документи с интелигентно превалутиране
  getDocuments: async (collectionName) => {
    const q = query(collection(db, collectionName));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Ако е стар документ (преди 2026), го маркираме за визуализация в Лева
      return { 
        id: doc.id, 
        ...data,
        isLegacy: !data.v2 
      };
    });
  }
};
