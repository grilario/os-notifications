/** @import { Order } from './public.js'*/
import puppeteer from "puppeteer";
import HtmlTableToJson from "html-table-to-json";
import { parse } from "date-fns";

const oneMinuteMS = 60_000;

/**
 * Launch web browser and scrapper order list
 *
 * @returns {Promise.<Array.<Order>>}
 */
export async function getOrders() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  // Navigate the page to a URL.
  await page.goto(
    "http://cloud2.aqualis.com.br:2020/webrun/open.do?action=open&sys=GSE",
    { timeout: oneMinuteMS },
  );

  // Login
  const loginFrameHandle = await page.waitForSelector("body > iframe", {
    timeout: oneMinuteMS,
  });
  const loginFrame = await loginFrameHandle.contentFrame();

  await loginFrame.locator("#WFRInput373").fill(process.env.WEB_USER);
  await loginFrame.locator("#WFRInput374").fill(process.env.WEB_PASSWORD);
  await loginFrame.locator("#loginbutton > button").click();

  await page.waitForNavigation({
    waitUntil: "networkidle0",
    timeout: oneMinuteMS,
  });

  // Open order frame
  const bodyFrame = await page
    .waitForSelector("body > iframe", { timeout: oneMinuteMS })
    .then((frame) => frame.contentFrame());
  const pageFrame = await bodyFrame
    .waitForSelector("body > iframe", { timeout: oneMinuteMS })
    .then((frame) => frame.contentFrame());

  await page.mouse.move(20, 500);

  await pageFrame.locator("#MenuLateralGamma-item-1902981 > span").click();
  await pageFrame.locator("#MenuLateralGamma-item-60203 > span").click();

  await page.waitForNetworkIdle({ idleTime: 500, timeout: oneMinuteMS });

  // Get order list from JSON export URL
  const htmlList = await page.evaluate(() =>
    fetch(
      "http://cloud2.aqualis.com.br:2020/webrun/WFRGridExport?sys=GSE&formID=28&type=HTML&formGUID=%7BB6E9B917-FAAD-4549-9F5C-B704FBF69E57%7D_TMAKERGRID",
    )
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const decoder = new TextDecoder("ISO-8859-1");
        return decoder.decode(buffer);
      }),
  );

  await browser.close();

  const list = HtmlTableToJson.parse(htmlList);

  console.log(list.results[0].slice(2));

  const orders = list.results[0].slice(2).map((order) => ({
    gse_ord_id: order["Código"],
    gse_sec_id: order["SECRETARIA"],
    gse_dep_id: order["DEPARTAMENTO"],
    gse_tec_id: order["TÉCNICO"],
    data: parse(order["DATA"], "MM/dd/yyyy", new Date()),
    status: order["Status"],
  }));

  return orders;
}
