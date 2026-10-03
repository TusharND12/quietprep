"use strict";
const $ = (id) => document.getElementById(id);
const state = { question: null, feedback: null, history: [], attempts: [], busy: false, example: false, settings: null };
const EXAMPLE = {
  question: "Tell me about a time you got stuck on a project. How did you move forward?",
  why_this: "Practise explaining your approach, rather than just naming the tools you used.",
  starter: "Start with the obstacle. Then walk through one thing you tried and what you learned.",
};
const EXAMPLE_ANSWER = "In my college project, the search results were loading slowly. I checked the network tab and noticed we fetched the whole list on every keystroke. I added a debounce so the request waited until typing paused. That reduced duplicate requests. I learned to measure the problem before changing the code.";
const EXAMPLE_FEEDBACK = {
  strength: "You connected your observation to a specific change, rather than listing a technology.",
  evidence: "I checked the network tab and noticed we fetched the whole list on every keystroke.",
  improvement: "Explain how you checked that the change helped. You mention fewer requests but not how you verified it.",
  next_try: "Add one honest sentence describing what you checked after the change. Use only what you actually measured.",
  follow_up: "How would you decide whether to use debouncing or caching here?",
};

function settings() {
  return { role: $("role").value.trim(), focus: document.querySelector('input[name="focus"]:checked').value, context: $("context").value.trim() };
}
function error(message = "") {
  $("error").textContent = message;
  $("error").hidden = !message;
}
function busy(active, title = "") {
  state.busy = active;
  $("busy").hidden = !active;
  $("busy-title").textContent = title;
  document.querySelectorAll("form input, form textarea, form button, #new-question, #example-button, #retry, #next, #clear-session").forEach((element) => { element.disabled = active; });
}
async function request(path, data) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 190000);
  try {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), signal: controller.signal });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
    return result;
  } catch (exception) {
    if (exception.name === "AbortError") throw new Error("The model took too long. Your answer is still here; try again.");
    if (exception instanceof TypeError) throw new Error("Cannot reach QuietPrep. Check that the app is still running.");
    throw exception;
  } finally { clearTimeout(timer); }
}
function wordCount() {
  const words = $("answer").value.trim().split(/\s+/).filter(Boolean).length;
  $("word-count").textContent = `${words} ${words === 1 ? "word" : "words"} · take your time`;
}
function showQuestion(question, example = false) {
  state.question = question;
  state.feedback = null;
  state.attempts = [];
  state.example = example;
  $("idle-view").hidden = true;
  $("session-view").hidden = false;
  $("feedback").hidden = true;
  $("example-label").hidden = !example;
  $("question").textContent = question.question;
  $("why-this").textContent = question.why_this;
  $("starter").textContent = question.starter;
  $("answer").value = example ? EXAMPLE_ANSWER : "";
  $("question-counter").textContent = example ? "WALKTHROUGH" : `QUESTION ${String(state.history.length).padStart(2, "0")}`;
  $("attempt-label").textContent = "First attempt";
  $("review-button").textContent = example ? "See example feedback ↗" : "Give me a nudge ↗";
  wordCount();
  $("question").focus();
}
async function newQuestion(event) {
  if (event) event.preventDefault();
  if (state.busy) return;
  if (!$("profile-form").reportValidity()) return;
  error();
  const current = settings();
  const changed = JSON.stringify(current) !== JSON.stringify(state.settings);
  busy(true, "Finding your next question…");
  try {
    const question = await request("/api/question", { ...current, previous: changed ? [] : state.history.slice(-8) });
    if (changed) state.history = [];
    state.settings = current;
    state.history.push(question.question);
    showQuestion(question);
  } catch (exception) { error(exception.message); }
  finally { busy(false); }
}
function showFeedback(feedback) {
  state.feedback = feedback;
  for (const [key, id] of Object.entries({ strength: "strength", evidence: "evidence", improvement: "improvement", next_try: "next-try", follow_up: "follow-up" })) {
    $(id).textContent = feedback[key];
  }
  $("feedback").hidden = false;
  $("feedback").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
async function review(event) {
  event.preventDefault();
  if (state.busy || !state.question) return;
  const answer = $("answer").value.trim();
  if (answer.length < 20) { error("Give yourself a little more room: write at least 20 characters."); return; }
  error();
  busy(true, "Reading your answer with care…");
  try {
    if (state.example) {
      if (answer !== EXAMPLE_ANSWER) throw new Error("This walkthrough uses a fixed example. Choose ‘Let’s practise’ for feedback on your own answer.");
      showFeedback(EXAMPLE_FEEDBACK);
    } else {
      const feedback = await request("/api/review", { ...state.settings, question: state.question.question, answer });
      state.attempts.push({ answer, feedback });
      showFeedback(feedback);
    }
  } catch (exception) { error(exception.message); }
  finally { busy(false); }
}
function retry() {
  if (state.example) { error("Choose ‘Let’s practise’ to try your own answer with live local AI."); return; }
  $("attempt-label").textContent = `Attempt ${state.attempts.length + 1}`;
  $("feedback").hidden = true;
  $("answer").focus();
  $("answer").scrollIntoView({ behavior: "smooth", block: "center" });
}
function download() {
  if (!state.feedback) return;
  const notes = ["# QuietPrep practice notes", "", state.example ? "Fixed walkthrough example — not live AI feedback." : `Role: ${state.settings.role}`, "", `## ${state.question.question}`, ""];
  const attempts = state.example ? [{ answer: EXAMPLE_ANSWER, feedback: EXAMPLE_FEEDBACK }] : state.attempts;
  attempts.forEach((attempt, i) => {
    notes.push(`### Attempt ${i + 1}`, attempt.answer, "", "**Keep this:** " + attempt.feedback.strength,
      "> " + attempt.feedback.evidence, "", "**Try this next:** " + attempt.feedback.improvement,
      attempt.feedback.next_try, "", "**Follow-up:** " + attempt.feedback.follow_up, "");
  });
  notes.push("AI coaching is a practice aid, not a hiring verdict. Verify technical advice.");
  const url = URL.createObjectURL(new Blob([notes.join("\n")], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "quietprep-notes.md"; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function checkModel() {
  try {
    const response = await fetch("/api/status", { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error("Model status unavailable");
    const result = await response.json();
    $("model-status").textContent = result.ready ? "● Local AI ready" : "Local AI needs setup";
    $("model-status").classList.toggle("offline", !result.ready);
    $("check-model").textContent = result.ready ? "Connected — you’re ready to practise ✓" : "Not connected yet — check again ↻";
  } catch {
    $("model-status").textContent = "Connection unavailable";
    $("model-status").classList.add("offline");
    $("check-model").textContent = "Connection unavailable — check again ↻";
  }
}
function clearSession() {
  state.question = null; state.feedback = null; state.history = []; state.attempts = []; state.settings = null; state.example = false;
  $("answer").value = ""; $("context").value = "";
  for (const id of ["question", "why-this", "starter", "strength", "evidence", "improvement", "next-try", "follow-up"]) $(id).textContent = "";
  $("session-view").hidden = true; $("feedback").hidden = true; $("idle-view").hidden = false;
  wordCount(); error(); $("role").focus();
}
$("profile-form").addEventListener("submit", newQuestion);
$("answer-form").addEventListener("submit", review);
$("answer").addEventListener("input", wordCount);
$("new-question").addEventListener("click", newQuestion);
$("next").addEventListener("click", newQuestion);
$("retry").addEventListener("click", retry);
$("download").addEventListener("click", download);
$("clear-session").addEventListener("click", clearSession);
$("example-button").addEventListener("click", () => { error(); showQuestion(EXAMPLE, true); });
$("setup-open").addEventListener("click", () => { $("setup-dialog").showModal(); checkModel(); });
$("setup-close").addEventListener("click", () => $("setup-dialog").close());
$("check-model").addEventListener("click", checkModel);
window.addEventListener("beforeunload", (event) => {
  if (!state.example && $("answer").value.trim()) { event.preventDefault(); event.returnValue = ""; }
});
checkModel();
