const fs = require("fs");
const path = require("path");
const { logger } = require("../logger");
const { JSON_OUTPUT_NAME } = require("../constants/shipmentFields");
const { parseTrackingNumbers, isTrackingQuery } = require("../utils/trackingInput");

const DATA_FILE = path.resolve(__dirname, "..", "..", "data", JSON_OUTPUT_NAME);

let cache = null;
let meta = null;

function isMissingMark(mark) {
  const value = String(mark ?? "").trim();
  return value === "" || value === "无唛头";
}

function readJsonFile() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error("未找到查询数据 data/shipments.json，请先放入业务表格并完成转换");
  }
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  if (Array.isArray(raw)) {
    return { rows: raw, meta: { sourceFile: null, sourceDate: null, rowCount: raw.length } };
  }
  if (!raw || !Array.isArray(raw.rows)) {
    throw new Error("data/shipments.json 格式无效：需要包含 rows 数组");
  }
  return {
    rows: raw.rows,
    meta: {
      sourceFile: raw.sourceFile || null,
      sourceDate: raw.sourceDate || null,
      rowCount: raw.rowCount || raw.rows.length,
    },
  };
}

function loadShipments() {
  if (cache) {
    return cache;
  }
  const parsed = readJsonFile();
  cache = parsed.rows;
  meta = parsed.meta;
  logger.info(
    { count: cache.length, sourceFile: meta.sourceFile, sourceDate: meta.sourceDate },
    "已加载 JSON 查询数据"
  );
  return cache;
}

function reloadShipments() {
  cache = null;
  meta = null;
  return loadShipments();
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function findByTrackingNumber(input) {
  const key = String(input).trim().toUpperCase();
  const rows = loadShipments();
  return rows.find((row) => String(row.快递单号).toUpperCase() === key) || null;
}

function rowsForMarkAndDate(mark, shipDate) {
  return loadShipments().filter((row) => row.唛头 === mark && row.发货日期 === shipDate);
}

function summarizeRows(rows) {
  const totalWeight = round2(
    rows.reduce((sum, row) => sum + Number(row.实际计算重量 || 0), 0)
  );
  const totalThb = round2(
    rows.reduce((sum, row) => sum + Number(row.实际收款泰铢 || 0), 0)
  );
  const totalQty = rows.reduce((sum, row) => sum + Number(row.件数 || 0), 0);
  return { totalWeight, totalThb, totalQty };
}

function arrivalStatus(row) {
  const fromArrival = String(row.到货状态 ?? "").trim();
  if (fromArrival) {
    return fromArrival;
  }
  return String(row.快递状态 ?? "").trim();
}

function sharedStatus(rows) {
  const values = [];
  const seen = new Set();
  for (const row of rows) {
    const status = arrivalStatus(row);
    if (!status || seen.has(status)) {
      continue;
    }
    seen.add(status);
    values.push(status);
  }
  return values.join("、");
}

function queryTrackingNumbers(inputs) {
  const numbers = parseTrackingNumbers(Array.isArray(inputs) ? inputs.join(" ") : String(inputs || ""));
  const missing = [];
  const needSupport = [];
  const found = [];

  for (const input of numbers) {
    const record = findByTrackingNumber(input);
    if (!record) {
      missing.push(input);
      continue;
    }
    if (isMissingMark(record.唛头)) {
      needSupport.push({
        trackingNumber: record.快递单号,
        status: arrivalStatus(record),
      });
      continue;
    }
    found.push(record);
  }

  const groups = [];
  const seen = new Set();
  for (const record of found) {
    const key = `${record.唛头}\0${record.发货日期}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const sameDayRows = rowsForMarkAndDate(record.唛头, record.发货日期);
    const { totalWeight, totalThb, totalQty } = summarizeRows(sameDayRows);
    groups.push({
      mark: record.唛头,
      shipDate: record.发货日期,
      status: sharedStatus(sameDayRows),
      sameDayRows,
      totalWeight,
      totalThb,
      totalQty,
    });
  }

  return { missing, needSupport, groups };
}

function formatGroupTable(group) {
  const lines = [];
  if (group.mark !== undefined && group.mark !== "") {
    lines.push(`唛头：${group.mark}`);
  }
  if (group.shipDate !== undefined && group.shipDate !== "") {
    lines.push(`发货日期：${group.shipDate}`);
  }
  if (group.status) {
    lines.push(`快递状态：${group.status}`);
  }
  lines.push("");

  for (const row of group.sameDayRows) {
    lines.push("----------");
    lines.push(`单号：${row.快递单号 ?? ""}`);
    lines.push(`品名：${row.品名 ?? ""}`);
    lines.push(`件数：${row.件数 ?? ""}`);
    lines.push(`实际计算重量：${row.实际计算重量 ?? ""} KG`);
    lines.push(`实际收款泰铢：${row.实际收款泰铢 ?? ""}`);
  }

  lines.push("----------");
  lines.push(`今日发货总重量：${group.totalWeight} KG`);
  lines.push(`今日收款总金额：${group.totalThb} 泰铢`);
  lines.push(`今日发货总数量：${group.totalQty}`);
  return lines.join("\n");
}

function sampleTrackingNumbers(limit = 5) {
  return loadShipments()
    .filter((row) => !isMissingMark(row.唛头))
    .slice(0, limit)
    .map((row) => row.快递单号);
}

function formatTrackingReply(result) {
  const parts = [];

  if (result.missing && result.missing.length) {
    if ((!result.groups || result.groups.length === 0) && (!result.needSupport || result.needSupport.length === 0)) {
      parts.push("抱歉亲，没有查到记录，请联系客服处理: @vip666005");
    } else {
      parts.push(`未查询到记录的快递单号：${result.missing.join("、")}`);
    }
  }

  if (result.needSupport && result.needSupport.length) {
    const supportLines = result.needSupport.map((item) => {
      const trackingNumber = typeof item === "string" ? item : item.trackingNumber;
      const status = typeof item === "string" ? "" : String(item.status || "").trim();
      const lines = [`快递单号 ${trackingNumber} 对应唛头为无唛头，请联系客服处理：https://t.me/vip666005`];
      if (status) {
        lines.push(`到货状态：${status}`);
      }
      return lines.join("\n");
    });
    parts.push(supportLines.join("\n\n"));
  }

  const groupTexts = (result.groups || []).map((group) => formatGroupTable(group));
  return [...parts, ...groupTexts].join("\n\n");
}

module.exports = {
  isTrackingQuery,
  parseTrackingNumbers,
  queryTrackingNumbers,
  sampleTrackingNumbers,
  formatTrackingReply,
  loadShipments,
  reloadShipments,
};
