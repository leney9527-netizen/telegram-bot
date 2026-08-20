const fs = require("fs");
const path = require("path");

const COLUMNS = [
  "唛头",
  "快递单号",
  "品名",
  "件数",
  "实际计算重量",
  "实际收款泰铢",
  "发货日期",
  "快递状态",
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows) {
  const header = COLUMNS.join(",");
  const body = rows
    .map((row) => COLUMNS.map((col) => csvEscape(row[col])).join(","))
    .join("\r\n");
  return `\uFEFF${header}\r\n${body}\r\n`;
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellXml(value, column) {
  if (column === "件数" || column === "实际计算重量" || column === "实际收款泰铢") {
    const num = Number(value);
    if (!Number.isNaN(num)) {
      return `<Cell><Data ss:Type="Number">${num}</Data></Cell>`;
    }
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function toExcelXml(rows) {
  const headerCells = COLUMNS.map(
    (col) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${xmlEscape(col)}</Data></Cell>`
  ).join("");
  const dataRows = rows
    .map((row) => `<Row>${COLUMNS.map((col) => cellXml(row[col], col)).join("")}</Row>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="发货数据">
  <Table>
   <Row>${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>
`;
}

function saveShipmentTables(rows, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const csvPath = path.join(outDir, "shipments.csv");
  const xlsPath = path.join(outDir, "shipments.xls");
  fs.writeFileSync(csvPath, toCsv(rows), "utf8");
  fs.writeFileSync(xlsPath, toExcelXml(rows), "utf8");
  return { csvPath, xlsPath };
}

module.exports = { COLUMNS, saveShipmentTables, toCsv };
