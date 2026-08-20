const REQUIRED_FIELDS = [
  "唛头",
  "快递单号",
  "品名",
  "件数",
  "实际计算重量",
  "实际收款泰铢",
  "发货日期",
  "快递状态",
];

const NUMBER_FIELDS = ["件数", "实际计算重量", "实际收款泰铢"];

const TABLE_NAME_TOKEN = "发货快递单";
const TABLE_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const JSON_OUTPUT_NAME = "shipments.json";
const TIMEZONE = "Asia/Shanghai";

module.exports = {
  REQUIRED_FIELDS,
  NUMBER_FIELDS,
  TABLE_NAME_TOKEN,
  TABLE_EXTENSIONS,
  JSON_OUTPUT_NAME,
  TIMEZONE,
};
