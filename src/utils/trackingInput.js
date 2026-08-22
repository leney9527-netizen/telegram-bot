function parseTrackingNumbers(text) {
  const tokens = String(text || "")
    .trim()
    .split(/[\s,，;；]+/)
    .filter(Boolean);
  if (tokens.length === 0) {
    return [];
  }
  if (!tokens.every((token) => /^[A-Za-z0-9]+$/.test(token))) {
    return [];
  }
  const seen = new Set();
  const numbers = [];
  for (const token of tokens) {
    if (token.length < 6) {
      continue;
    }
    const key = token.toUpperCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    numbers.push(token);
  }
  return numbers;
}

function isTrackingQuery(text) {
  return parseTrackingNumbers(text).length > 0;
}

module.exports = { parseTrackingNumbers, isTrackingQuery };
