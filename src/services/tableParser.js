const fs = require("fs");
const XLSX = require("xlsx");
const { REQUIRED_FIELDS, NUMBER_FIELDS } = require("../constants/shipmentFields");

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function parseCsv(content) {
  const text = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = parseCsvLine(lines[0]).map((cell) => cell.trim());
  const rows = lines.slice(1).map((line) => parseCsvLine(line));
  return { headers, rows };
}

function parseExcelXml(content) {
  const rowMatches = [...content.matchAll(/<Row\b[^>]*>([\s\S]*?)<\/Row>/gi)];
  const matrix = rowMatches.map((rowMatch) => {
    const cells = [];
    const cellRegex = /<Cell\b([^>]*)>([\s\S]*?)<\/Cell>|<Cell\b[^>]*\/>/gi;
    let absIndex = 0;
    let cellMatch = cellRegex.exec(rowMatch[1] || "");
    while (cellMatch) {
      const attrs = cellMatch[1] || "";
      const indexMatch = attrs.match(/ss:Index="(\d+)"/i);
      if (indexMatch) {
        absIndex = Number(indexMatch[1]) - 1;
      }
      const dataMatch = (cellMatch[2] || "").match(/<Data\b[^>]*>([\s\S]*?)<\/Data>/i);
      const value = dataMatch ? decodeXml(dataMatch[1]) : "";
      cells[absIndex] = value;
      absIndex += 1;
      cellMatch = cellRegex.exec(rowMatch[1] || "");
    }
    return cells;
  });
  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = (matrix[0] || []).map((cell) => String(cell || "").trim());
  return { headers, rows: matrix.slice(1) };
}

function decodeXml(value) {
  return String(value)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}

function parseXlsx(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [] };
  }
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = (matrix[0] || []).map((cell) => String(cell || "").trim());
  return { headers, rows: matrix.slice(1) };
}

function normalizeCell(header, value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (NUMBER_FIELDS.includes(header)) {
    if (text === "") {
      return "";
    }
    const num = Number(String(text).replace(/,/g, ""));
    return Number.isNaN(num) ? text : num;
  }
  return text;
}

function matrixToObjects(headers, rows) {
  const missing = REQUIRED_FIELDS.filter((field) => !headers.includes(field));
  if (missing.length > 0) {
    throw new Error(`表格缺少必要列：${missing.join("、")}`);
  }

  return rows
    .filter((row) => (row || []).some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        if (!header) {
          return;
        }
        item[header] = normalizeCell(header, row[index]);
      });
      return item;
    })
    .filter((item) => String(item.快递单号 || "").trim() !== "");
}

function headerHasRequired(headers) {
  return REQUIRED_FIELDS.every((field) => headers.includes(field));
}

function decodeCsvBuffer(buf) {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.slice(3).toString("utf8");
  }
  const utf8 = buf.toString("utf8");
  if (headerHasRequired(parseCsv(utf8).headers)) {
    return utf8;
  }
  try {
    const gbk = new TextDecoder("gbk").decode(buf);
    if (headerHasRequired(parseCsv(gbk).headers)) {
      return gbk;
    }
  } catch (_err) {
    // 继续抛出后续缺列错误
  }
  return utf8;
}

function parseTableFile(filePath) {
  const lower = filePath.toLowerCase();
  let parsed;
  if (lower.endsWith(".csv")) {
    parsed = parseCsv(decodeCsvBuffer(fs.readFileSync(filePath)));
  } else if (lower.endsWith(".xls")) {
    const content = fs.readFileSync(filePath, "utf8");
    if (content.includes("urn:schemas-microsoft-com:office:spreadsheet")) {
      parsed = parseExcelXml(content);
    } else {
      parsed = parseXlsx(filePath);
    }
  } else if (lower.endsWith(".xlsx")) {
    parsed = parseXlsx(filePath);
  } else {
    throw new Error(`不支持的表格格式：${filePath}`);
  }
  return matrixToObjects(parsed.headers, parsed.rows);
}

module.exports = { parseTableFile };
