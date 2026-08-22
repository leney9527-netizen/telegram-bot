const fs = require("fs");
const path = require("path");
const { logger } = require("../logger");
const { DATA_DIR } = require("./tableFiles");
const { parseFlexibleTable } = require("./tableParser");
const { parseTrackingNumbers } = require("../utils/trackingInput");
const { classifyIntent, FALLBACK_KEYWORD, LOOKUP_KEYS } = require("./intent");

const TABLE_PREFIX = /^key_answer/i;
const TABLE_EXTS = [".xlsx", ".xls", ".csv"];
const EXT_PRIORITY = { ".xlsx": 3, ".xls": 2, ".csv": 1 };

let cache = {
  path: null,
  mtimeMs: 0,
  entries: [],
};

function splitKeywords(raw) {
  return String(raw || "")
    .split(/[、，,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function answerField(row) {
  if (Object.prototype.hasOwnProperty.call(row, "对应的解释")) {
    return row["对应的解释"];
  }
  if (Object.prototype.hasOwnProperty.call(row, "解释")) {
    return row["解释"];
  }
  return "";
}

function findKeyAnswerTableFile() {
  if (!fs.existsSync(DATA_DIR)) {
    return null;
  }
  const files = fs
    .readdirSync(DATA_DIR)
    .map((filename) => {
      const ext = path.extname(filename).toLowerCase();
      if (!TABLE_EXTS.includes(ext) || !TABLE_PREFIX.test(path.basename(filename, ext))) {
        return null;
      }
      const fullPath = path.join(DATA_DIR, filename);
      return {
        filename,
        ext,
        fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const extDiff = (EXT_PRIORITY[b.ext] || 0) - (EXT_PRIORITY[a.ext] || 0);
      if (extDiff !== 0) {
        return extDiff;
      }
      return b.mtimeMs - a.mtimeMs;
    });
  return files[0] || null;
}

function loadEntries() {
  const tableFile = findKeyAnswerTableFile();
  if (!tableFile) {
    throw new Error("未找到 data 目录下的 key_answer 表格");
  }
  if (cache.path === tableFile.fullPath && cache.mtimeMs === tableFile.mtimeMs) {
    return cache.entries;
  }

  const rows = parseFlexibleTable(tableFile.fullPath);
  const entries = rows
    .map((row) => ({
      keywords: splitKeywords(row["关键字"]),
      answer: String(answerField(row) ?? ""),
    }))
    .filter((entry) => entry.keywords.length > 0);

  cache = {
    path: tableFile.fullPath,
    mtimeMs: tableFile.mtimeMs,
    entries,
  };
  logger.info({ file: tableFile.filename, count: entries.length }, "已加载 key_answer 表格");
  return entries;
}

function findAnswerByKeyword(keyword) {
  const entries = loadEntries();
  const target = String(keyword || "").trim();
  if (!target) {
    return null;
  }
  const hit = entries.find((entry) => entry.keywords.includes(target));
  return hit ? hit.answer : null;
}

function answerForIntent(intent) {
  const keys = LOOKUP_KEYS[intent] || [intent];
  for (const key of keys) {
    const answer = findAnswerByKeyword(key);
    if (answer !== null && answer !== "") {
      return answer;
    }
  }
  return null;
}

function answerForUserMessage(text) {
  const intent = classifyIntent(text);
  let answer = answerForIntent(intent);
  if (answer === null || answer === "") {
    answer = answerForIntent(FALLBACK_KEYWORD);
  }
  if (answer === null) {
    logger.warn("key_answer 表格中没有关键字「学习中」，无法返回对应解释");
    return null;
  }
  return answer;
}

function isAlphanumericInput(text) {
  return parseTrackingNumbers(text).length > 0;
}

module.exports = {
  answerForUserMessage,
  answerForChineseInput: answerForUserMessage,
  isAlphanumericInput,
  loadEntries,
};
