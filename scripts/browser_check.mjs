// Browser smoke test using Chromium's DevTools protocol; Node 22+, no npm packages.
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const debugPort = process.env.CHROME_DEBUG_PORT || "9225";
const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
const target = pages.find((page) => page.type === "page");
if (!target) throw new Error("Launch headless Chrome with a remote debugging port first.");
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
let id = 0;
const pending = new Map();
const failures = [];
const externalRequests = [];
const record = process.argv.includes("--record");
let recording = false;
let frame = 0;
let recorder;
socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  if (data.method === "Runtime.exceptionThrown") failures.push(data.params.exceptionDetails.text);
  if (data.method === "Log.entryAdded" && data.params.entry.level === "error") failures.push(data.params.entry.text);
  if (data.method === "Network.requestWillBeSent" && /^https?:/.test(data.params.request.url) && new URL(data.params.request.url).hostname !== "127.0.0.1") externalRequests.push(data.params.request.url);
  const job = pending.get(data.id);
  if (job) { pending.delete(data.id); data.error ? job.reject(new Error(data.error.message)) : job.resolve(data.result); }
});
function cdp(method, params = {}) {
  const requestId = ++id;
  return new Promise((resolve, reject) => { pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
}
async function evaluate(expression) {
  const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression, seconds = 30) {
  for (let i = 0; i < seconds * 4; i++) { if (await evaluate(expression)) return; await delay(250); }
  throw new Error(`Timed out: ${expression}`);
}
await mkdir("artifacts", { recursive: true });
await cdp("Runtime.enable"); await cdp("Log.enable"); await cdp("Page.enable"); await cdp("Network.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
await cdp("Page.navigate", { url: "http://127.0.0.1:8767/" });
await until('document.querySelector("#model-status")?.textContent.includes("ready")');
async function screenshot(name) {
  const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  await writeFile(`artifacts/${name}.png`, Buffer.from(shot.data, "base64"));
}
await screenshot("desktop");
await evaluate('document.querySelector("#example-button").click(); document.querySelector("#answer-form").requestSubmit();');
await until('!document.querySelector("#feedback").hidden');
assert.equal(await evaluate('document.querySelector("#example-label").hidden'), false);
assert.match(await evaluate('document.querySelector("#strength").textContent'), /observation/);
await evaluate('document.querySelector("#clear-session").click(); document.querySelector("input[value=project]").checked = true; document.querySelector("#context").value = "I built a React search interface for a college library.";');
if (record) {
  await mkdir(".runtime/frames", { recursive: true });
  recording = true;
  recorder = (async () => {
    while (recording) {
      const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(`.runtime/frames/demo_${String(frame++).padStart(4, "0")}.png`, Buffer.from(shot.data, "base64"));
      await delay(500);
    }
  })();
  await delay(2000);
}
await evaluate('window.scrollTo(0,320); document.querySelector("#profile-form").requestSubmit();');
await until('!document.querySelector("#session-view").hidden && document.querySelector("#busy").hidden', 190);
assert.equal(await evaluate('document.querySelector("#example-label").hidden'), true);
const question = await evaluate('document.querySelector("#question").textContent');
assert.ok(question.length > 20);
const answer = "In my college project, the search results were loading slowly. I checked the network tab and noticed we fetched the whole list on every keystroke. I added a debounce so the request waited until typing paused. That reduced duplicate requests. I learned to measure the problem before changing the code.";
await evaluate(`document.querySelector("#answer").value = ${JSON.stringify(answer)}; document.querySelector("#answer").dispatchEvent(new Event("input")); document.querySelector("#answer-form").requestSubmit();`);
await until('document.querySelector("#busy").hidden', 190);
assert.equal(await evaluate('document.querySelector("#error").hidden'), true, await evaluate('document.querySelector("#error").textContent'));
assert.equal(await evaluate('document.querySelector("#feedback").hidden'), false);
const quote = await evaluate('document.querySelector("#evidence").textContent');
assert.ok(quote && answer.includes(quote));
const feedback = await evaluate('Object.fromEntries(["strength","evidence","improvement","next-try","follow-up"].map(id => [id,document.getElementById(id).textContent]))');
await writeFile("artifacts/browser-live.json", JSON.stringify({ question, answer, feedback }, null, 2));
await screenshot("live-feedback");
if (record) { await evaluate('document.querySelector("#feedback").scrollIntoView({block:"center"})'); await delay(4500); }
await evaluate('document.querySelector("#retry").click()');
assert.equal(await evaluate('document.querySelector("#answer").value'), answer);
assert.match(await evaluate('document.querySelector("#attempt-label").textContent'), /Attempt 2/);
const secondAnswer = answer + " After adding the debounce, I typed the same query and checked the Network tab again. A request was sent after I paused typing, rather than after each keystroke.";
await evaluate(`document.querySelector("#answer").value = ${JSON.stringify(secondAnswer)}; document.querySelector("#answer").dispatchEvent(new Event("input")); document.querySelector("#answer-form").requestSubmit();`);
await until('document.querySelector("#busy").hidden', 190);
assert.equal(await evaluate('document.querySelector("#error").hidden'), true, await evaluate('document.querySelector("#error").textContent'));
assert.equal(await evaluate('document.querySelector("#feedback").hidden'), false);
const secondQuote = await evaluate('document.querySelector("#evidence").textContent');
assert.ok(secondQuote && secondAnswer.includes(secondQuote));
await mkdir(".runtime/downloads", { recursive: true });
await cdp("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: resolve(".runtime/downloads") });
await evaluate('document.querySelector("#download").click()');
let exported;
for (let attempt = 0; attempt < 40; attempt++) {
  try { exported = await readFile(".runtime/downloads/quietprep-notes.md", "utf8"); break; } catch { await delay(250); }
}
assert.ok(exported?.includes("### Attempt 1") && exported.includes("### Attempt 2"));
assert.ok(exported.includes(secondAnswer));
await writeFile("artifacts/sample-notes.md", exported);
if (record) { await evaluate('document.querySelector("#feedback").scrollIntoView({block:"center"})'); await delay(4000); }
if (record) { await delay(2000); recording = false; await recorder; }
await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await evaluate('window.scrollTo(0,0)');
assert.equal(await evaluate('document.documentElement.scrollWidth > window.innerWidth'), false);
await screenshot("mobile");
await evaluate('document.querySelector("#setup-open").click()');
assert.equal(await evaluate('document.querySelector("#setup-dialog").open'), true);
await evaluate('document.querySelector("#setup-close").click(); document.querySelector("#clear-session").click()');
assert.equal(await evaluate('document.querySelector("#answer").value'), "");
assert.equal(await evaluate('document.querySelector("#evidence").textContent'), "");
assert.equal(await evaluate('localStorage.length'), 0);
assert.deepEqual(failures, []);
assert.deepEqual(externalRequests, []);
console.log("PASS: live AI question and two reviews, grounded quotes, example label, retry, both attempts exported, clear, no localStorage, mobile layout, setup dialog, no browser errors or external browser requests.");
if (record) console.log(`Recorded ${frame} frames in .runtime/frames (2 fps).`);
socket.close();
