// Compare the learner's actual words. This module never calls a model or scores quality.
export function wordChanges(before, after) {
  const left = before.match(/\S+\s*/g) || [];
  const right = after.match(/\S+\s*/g) || [];
  const table = Array.from(
    { length: left.length + 1 },
    () => new Uint16Array(right.length + 1),
  );
  for (let i = left.length - 1; i >= 0; i--) {
    for (let j = right.length - 1; j >= 0; j--) {
      table[i][j] =
        left[i].trim() === right[j].trim()
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const oldSegments = [],
    newSegments = [];
  let i = 0,
    j = 0,
    added = 0,
    removed = 0;
  while (i < left.length || j < right.length) {
    if (
      i < left.length &&
      j < right.length &&
      left[i].trim() === right[j].trim()
    ) {
      oldSegments.push({ text: left[i++], changed: false });
      newSegments.push({ text: right[j++], changed: false });
    } else if (
      j < right.length &&
      (i === left.length || table[i][j + 1] > table[i + 1][j])
    ) {
      newSegments.push({ text: right[j++], changed: true });
      added++;
    } else {
      oldSegments.push({ text: left[i++], changed: true });
      removed++;
    }
  }
  return { before: oldSegments, after: newSegments, added, removed };
}
