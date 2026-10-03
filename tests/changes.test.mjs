import assert from "node:assert/strict";
import { test } from "node:test";
import { wordChanges } from "../public/changes.js";

test("identical wording does not become progress", () => {
  const result = wordChanges(
    "I built a search page.",
    "I built a search page.",
  );
  assert.equal(result.added, 0);
  assert.equal(result.removed, 0);
});
test("a new result is identified without changing the learner's words", () => {
  const before = "I built a search page.";
  const after = "I built a search page. We tested it with three classmates.";
  const result = wordChanges(before, after);
  assert.equal(result.removed, 0);
  assert.equal(result.before.map((part) => part.text).join(""), before);
  assert.equal(result.after.map((part) => part.text).join(""), after);
  assert.equal(
    result.after
      .filter((part) => part.changed)
      .map((part) => part.text)
      .join(""),
    "We tested it with three classmates.",
  );
});
test("removal, repetition and punctuation edits reconstruct both answers", () => {
  for (const [before, after] of [
    ["I I used React.", "I used React."],
    ["I built search. Then tested it.", "I tested search. Then built it."],
    ["I wrote code,\nand tested it.", "I wrote code.\nThen tested it."],
    ["", "A first attempt."],
  ]) {
    const result = wordChanges(before, after);
    assert.equal(result.before.map((part) => part.text).join(""), before);
    assert.equal(result.after.map((part) => part.text).join(""), after);
  }
});
test("HTML-shaped input stays literal text", () => {
  const source = "I used <script>alert(1)</script> in a test.";
  assert.equal(
    wordChanges(source, source)
      .after.map((part) => part.text)
      .join(""),
    source,
  );
});
