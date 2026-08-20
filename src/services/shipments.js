const fs = require("fs");
const path = require("path");
const { logger } = require("../logger");
const { JSON_OUTPUT_NAME } = require("../constants/shipmentFields");

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

function isTrackingQuery(text) {
  return /^[A-Za-z0-9]+$/.test(text);
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
  const summedThb = round2(
    rows.reduce((sum, row) => sum + Number(row.实际收款泰铢 || 0), 0)
  );
  const totalThb = summedThb < 50 ? 50 : summedThb;
  return { totalWeight, totalThb };
}

function queryByTrackingNumber(input) {
  const record = findByTrackingNumber(input);
  if (!record) {
    return { found: false };
  }

  if (isMissingMark(record.唛头)) {
    return {
      found: true,
      needSupport: true,
      trackingNumber: record.快递单号,
      mark: String(record.唛头 ?? "").trim() || "无唛头",
    };
  }

  const sameDayRows = rowsForMarkAndDate(record.唛头, record.发货日期);
  const { totalWeight, totalThb } = summarizeRows(sameDayRows);

  return {
    found: true,
    needSupport: false,
    trackingNumber: record.快递单号,
    status: record.快递状态,
    mark: record.唛头,
    shipDate: record.发货日期,
    sameDayRows,
    totalWeight,
    totalThb,
  };
}

function sampleTrackingNumbers(limit = 5) {
  return loadShipments()
    .filter((row) => !isMissingMark(row.唛头))
    .slice(0, limit)
    .map((row) => row.快递单号);
}

function formatRowLine(row, index) {
  return [
    `${index + 1}. 快递单号 ${row.快递单号}`,
    `品名 ${row.品名}`,
    `件数 ${row.件数}`,
    `实际计算重量 ${row.实际计算重量} KG`,
    `实际收款泰铢 ${row.实际收款泰铢}`,
    `快递状态 ${row.快递状态}`,
  ].join("，");
}

function formatTrackingReply(result, input) {
  if (!result.found) {
    return `未查询到快递单号 ${input} 的记录，请核对后重试。`;
  }

  if (result.needSupport) {
    return `快递单号 ${result.trackingNumber} 对应唛头为无唛头，请联系客服处理。`;
  }

  const detailLines = result.sameDayRows.map((row, index) => formatRowLine(row, index));
  return [
    `快递单号 ${result.trackingNumber} 当前状态为：${result.status}。`,
    `对应唛头：${result.mark}。`,
    `该单号对应发货日期：${result.shipDate}。以下为该唛头在该日期的全部记录：`,
    ...detailLines,
    `该唛头当日发货总重量为 ${result.totalWeight} KG，当日收款总金额为 ${result.totalThb} 泰铢。`,
  ].join("\n");
}

module.exports = {
  isTrackingQuery,
  queryByTrackingNumber,
  sampleTrackingNumbers,
  formatTrackingReply,
  loadShipments,
  reloadShipments,
};
