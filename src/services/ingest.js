const fs = require("fs");
const path = require("path");
const { logger } = require("../logger");
const { JSON_OUTPUT_NAME, REQUIRED_FIELDS } = require("../constants/shipmentFields");
const { beijingNowIso } = require("../utils/beijingTime");
const { DATA_DIR, findLatestTableFile, findTableFileByDate } = require("./tableFiles");
const { parseTableFile } = require("./tableParser");
const { reloadShipments } = require("./shipments");

const JSON_OUTPUT_PATH = path.join(DATA_DIR, JSON_OUTPUT_NAME);

function writeNormalizedJson(tableFile, rows) {
  const payload = {
    sourceFile: tableFile.filename,
    sourceDate: tableFile.date,
    convertedAt: beijingNowIso(),
    fields: REQUIRED_FIELDS,
    rowCount: rows.length,
    rows,
  };
  fs.writeFileSync(JSON_OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  reloadShipments();
  logger.info(
    {
      sourceFile: tableFile.filename,
      sourceDate: tableFile.date,
      rowCount: rows.length,
      output: JSON_OUTPUT_NAME,
    },
    "已将最新表格转换为 JSON"
  );
  return payload;
}

function ingestTableFile(tableFile) {
  const rows = parseTableFile(tableFile.fullPath);
  return writeNormalizedJson(tableFile, rows);
}

function ingestLatestTable() {
  const tableFile = findLatestTableFile();
  if (!tableFile) {
    logger.warn("data 目录中没有按「日期+发货快递单」命名的表格文件");
    return null;
  }
  return ingestTableFile(tableFile);
}

function ingestTodayTable(dateString) {
  const tableFile = findTableFileByDate(dateString);
  if (!tableFile) {
    return { updated: false, date: dateString };
  }
  const payload = ingestTableFile(tableFile);
  return { updated: true, date: dateString, payload };
}

module.exports = {
  JSON_OUTPUT_PATH,
  ingestLatestTable,
  ingestTodayTable,
};
