import { getOrders } from "./orders.js";
import { sendNotification, setPendingOrders } from "./storage.js";

const last7Days = new Date();
last7Days.setDate(last7Days.getDate() - 7);

let ordersCache = [];

async function handleOrders() {
  const orders = await getOrders();

  const pendingOrders = orders.filter((order) => {
    const isPedding = (order.status = "Pendente");
    const isEmptyTec = order.gse_tec_id == "";
    const isFromLastDay = new Date(order.data) > last7Days;

    return isPedding && isEmptyTec && isFromLastDay;
  });

  const newPeddingOrders = pendingOrders.filter(
    (order) => !ordersCache.includes(order.gse_ord_id),
  );

  await setPendingOrders(pendingOrders);

  for (const order of newPeddingOrders) {
    await sendNotification(order);

    console.log("Secretaria:", order.gse_sec_id);
    console.log("Local:", order.gse_dep_id);
    console.log("Dia:", order.data.toDateString());
    console.log("Status:", order.status);
  }

  ordersCache = pendingOrders.map((order) => order.gse_ord_id);
}

const tenMinutes = 1_000 * 60 * 10;

await handleOrders().catch((err) => console.error(err));

setInterval(() => {
  handleOrders().catch((err) => console.error(err));
}, tenMinutes);
