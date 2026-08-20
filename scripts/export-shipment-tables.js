const fs = require("fs");
const path = require("path");
const { saveShipmentTables } = require("./save-shipment-tables");

const dataDir = path.resolve(__dirname, "..", "data");
const jsonPath = path.join(dataDir, "shipments.json");
const rows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const tables = saveShipmentTables(rows, dataDir);
console.log(`已将 ${rows.length} 条记录导出为表格`);
console.log(tables.csvPath);
console.log(tables.xlsPath);
