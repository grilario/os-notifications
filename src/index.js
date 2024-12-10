import { getOrders } from "./orders.js";
import { setPendingOrders } from "./storage.js";

const last7Days = new Date()
last7Days.setDate(last7Days.getDate() - 7)

async function handleOrders() {
  const orders = await getOrders()

  const pendingOrders = orders.filter(order => {
    const isPedding = order.status = "Pendente"
    const isEmptyTec = order.gse_tec_id == ""
    const isFromLastDay = new Date(order.data) > last7Days

    return isPedding && isEmptyTec && isFromLastDay
  })

  for (const order of pendingOrders) {
    console.log("Secretaria:", order.gse_sec_id)
    console.log("Local:", order.gse_dep_id)
    console.log("Dia:", order.data.toDateString())
    console.log("Status:", order.status)
  }

  await setPendingOrders(pendingOrders)
}

await handleOrders()

const tenMinutes = 1_000 * 60 * 10
setInterval(handleOrders, tenMinutes)
