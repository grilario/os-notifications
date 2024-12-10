import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1024 });

// Navigate the page to a URL.
await page.goto("http://cloud2.aqualis.com.br:2020/webrun/open.do?action=open&sys=GSE");

// Login
const loginFrameHandle = await page.waitForSelector("body > iframe")
const loginFrame = await loginFrameHandle.contentFrame()

await loginFrame.locator("#WFRInput373").fill(process.env.USER);
await loginFrame.locator("#WFRInput374").fill(process.env.PASSWORD);
await loginFrame.locator("#loginbutton > button").click();

await page.waitForNavigation({ waitUntil: "networkidle0" })

// Open order frame
const bodyFrame = await page.waitForSelector("body > iframe").then(frame => frame.contentFrame())
const pageFrame = await bodyFrame.waitForSelector("body > iframe").then(frame => frame.contentFrame())

await page.mouse.move(20, 500)

await pageFrame.locator("#MenuLateralGamma-item-1902981 > span").click()
await pageFrame.locator("#MenuLateralGamma-item-60203 > span").click()

await page.waitForNetworkIdle({ idleTime: 500 })

// Get order list from JSON export URL
const list = await page.evaluate(() =>
  fetch("http://cloud2.aqualis.com.br:2020/webrun/WFRGridExport?sys=GSE&formID=28&type=JSON&formGUID=%7BB6E9B917-FAAD-4549-9F5C-B704FBF69E57%7D_TMAKERGRID")
    .then(r => r.json())
)

await browser.close()

const last7Days = new Date()
last7Days.setDate(last7Days.getDate() - 7)

const penddingOrders = list.data.result.filter(order => {
  const isPedding = order.status = "Pendente"
  const isEmptyTec = order.gse_tec_id == ""
  const isFromLastDay = new Date(order.data) > last7Days

  return isPedding && isEmptyTec && isFromLastDay
})

for (const order of penddingOrders) {
  console.log("")
  console.log("Secretaria:", order.gse_sec_id)
  console.log("Local:", order.gse_dep_id)
  console.log("Dia:", new Date(order.data).toDateString())
  console.log("Status:", order.status)
}

