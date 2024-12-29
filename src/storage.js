/** @import { Order } from './public.js'*/
import { readFile } from "node:fs/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

const key = JSON.parse(
  await readFile(new URL("../account-key.json", import.meta.url)),
);

const app = initializeApp({
  credential: cert(key),
});

const messaging = getMessaging(app);
const database = getFirestore(app);

/**
 * @param {Array.<Order>} orders
 */
export async function setPendingOrders(orders) {
  const query = await database.collection("pendingOrders").get();

  // Delete all documents
  {
    const batch = database.batch();
    query.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  // Add new documents
  {
    const collection = database.collection("pendingOrders").doc();
    const batch = database.batch();

    for (const order of orders) {
      batch.create(collection, {
        secretariat: order.gse_sec_id,
        department: order.gse_dep_id,
        date: order.data,
      });
    }

    await batch.commit();
  }

  await database
    .doc("lastUpdatedTime/BSRX4GZ9FT1Gw9ebptpg")
    .set({ updatedAt: new Date() });
}
