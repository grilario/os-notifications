/** @import { Order } from './public.js'*/
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch, addDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_APIKEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app)

await signInWithEmailAndPassword(auth, process.env.FIREBASE_USER, process.env.FIREBASE_PASSWORD)


/**
 * @param {Array.<Order>} orders  
 */
export async function setPendingOrders(orders) {
  const peddingCollection = collection(db, "pendingOrders")

  // Delete all documents
  const query = await getDocs(peddingCollection);

  const batch = writeBatch(db)
  query.docs.forEach(doc => {
    batch.delete(doc.ref)
  })
  await batch.commit()

  const documents = orders.map(order => addDoc(peddingCollection, {
    ord_id: order.gse_ord_id,
    sec_id: order.gse_sec_id,
    dep_id: order.gse_dep_id,
    date: order.data,
  }))

  await Promise.all(documents)

  await setDoc(doc(db, "lastUpdatedTime", "BSRX4GZ9FT1Gw9ebptpg"), { updatedAt: new Date() })
}

