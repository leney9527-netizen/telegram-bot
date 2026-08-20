const fs = require("fs");
const path = require("path");
const {
  TABLE_NAME_TOKEN,
  TABLE_EXTENSIONS,
} = require("../constants/shipmentFields");

const DATA_DIR = path.resolve(__dirname, "..", "..", "data");

const FILE_PATTERNS = [
  new RegExp(`^(\\d{4}-\\d{2}-\\d{2})${TABLE_NAME_TOKEN}\\.(csv|xls|xlsx)$`, "i"),
  new RegExp(`^(\\d{4}-\\d{2}-\\d{2})[-_]${TABLE_NAME_TOKEN}\\.(csv|xls|xlsx)$`, "i"),
  new RegExp(`^(\\d{8})${TABLE_NAME_TOKEN}\\.(csv|xls|xlsx)$`, "i"),
];

const EXT_PRIORITY = { ".xlsx": 3, ".xls": 2, ".csv": 1 };

function normalizeDateToken(token) {
  if (/^\d{8}$/.test(token)) {
    return `${token.slice(0, 4)}-${token.slice(4, 6)}-${token.slice(6, 8)}`;
  }
  return token;
}

function parseTableFilename(filename) {
  for (const pattern of FILE_PATTERNS) {
    const match = filename.match(pattern);
    if (match) {
      return {
        date: normalizeDateToken(match[1]),
        ext: `.${match[2].toLowerCase()}`,
        filename,
      };
    }
  }
  return null;
}

function listTableFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    return [];
  }
  return fs
    .readdirSync(DATA_DIR)
    .map((filename) => {
      const parsed = parseTableFilename(filename);
      if (!parsed) {
        return null;
      }
      const fullPath = path.join(DATA_DIR, filename);
      const stat = fs.statSync(fullPath);
      return {
        ...parsed,
        fullPath,
        mtimeMs: stat.mtimeMs,
      };
    })
    .filter(Boolean)
    .filter((file) => TABLE_EXTENSIONS.includes(file.ext));
}

function pickPreferred(files) {
  return [...files].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    const extDiff = (EXT_PRIORITY[b.ext] || 0) - (EXT_PRIORITY[a.ext] || 0);
    if (extDiff !== 0) {
      return extDiff;
    }
    return b.mtimeMs - a.mtimeMs;
  })[0] || null;
}

function findLatestTableFile() {
  return pickPreferred(listTableFiles());
}

function findTableFileByDate(dateString) {
  const files = listTableFiles().filter((file) => file.date === dateString);
  return pickPreferred(files);
}

module.exports = {
  DATA_DIR,
  parseTableFilename,
  listTableFiles,
  findLatestTableFile,
  findTableFileByDate,
};
