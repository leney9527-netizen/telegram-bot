const fs = require("fs");
const path = require("path");

function mulberry32(seed) {
  return function rng() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function trackingNumber(rng, prefix) {
  const body = Array.from({ length: randInt(rng, 10, 14) }, () =>
    pick(rng, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")
  ).join("");
  return `${prefix}${body}`;
}

const MARKS = ["KZ-BKK-A", "SH-LAZADA-09", "GZ-SHOPEE-B", "YW-TIKTOK-03", "DG-WH-088", "NB-FLASH-12"];
const PRODUCTS = [
  "服装",
  "鞋靴",
  "箱包配件",
  "手机壳",
  "充电线",
  "化妆品",
  "日用百货",
  "家居收纳",
  "童装",
  "运动护具",
];
const STATUSES = ["已揽收", "已发运", "运输中", "清关中", "派送中", "已签收"];
const PREFIXES = ["JT", "SF", "KY", "FLASH", "BEST", "SPX", "THP"];
const DATES = ["2026-08-12", "2026-08-13", "2026-08-14", "2026-08-15", "2026-08-16", "2026-08-18", "2026-08-19"];

function generate(seed = 20260820) {
  const rng = mulberry32(seed);
  const rows = [];
  const used = new Set();

  function uniqueTracking() {
    let value;
    do {
      value = trackingNumber(rng, pick(rng, PREFIXES));
    } while (used.has(value.toUpperCase()));
    used.add(value.toUpperCase());
    return value;
  }

  // 保证同一唛头、同一发货日有多票，便于汇总
  for (const mark of MARKS) {
    const dateCount = randInt(rng, 2, 3);
    const dates = [...DATES].sort(() => rng() - 0.5).slice(0, dateCount);
    for (const date of dates) {
      const parcelCount = randInt(rng, 3, 6);
      for (let i = 0; i < parcelCount; i += 1) {
        const pieces = randInt(rng, 1, 24);
        const weight = round2(pieces * (0.35 + rng() * 1.8) + rng() * 2);
        const rate = 28 + rng() * 42;
        rows.push({
          唛头: mark,
          快递单号: uniqueTracking(),
          品名: pick(rng, PRODUCTS),
          件数: pieces,
          实际计算重量: weight,
          实际收款泰铢: round2(weight * rate),
          发货日期: date,
          快递状态: pick(rng, STATUSES),
        });
      }
    }
  }

  return rows;
}

const { saveShipmentTables, toCsv } = require("./save-shipment-tables");
const { beijingDateString } = require("../src/utils/beijingTime");

const outDir = path.resolve(__dirname, "..", "data");
fs.mkdirSync(outDir, { recursive: true });
const shipments = generate();
const date = beijingDateString();
const datedCsv = path.join(outDir, `${date}发货快递单.csv`);
fs.writeFileSync(datedCsv, toCsv(shipments), "utf8");
const tables = saveShipmentTables(shipments, outDir);
console.log(`已写入 ${shipments.length} 条模拟发货记录`);
console.log(`业务表格 -> ${datedCsv}`);
console.log(`已导出表格 -> ${tables.csvPath}`);
console.log(`已导出表格 -> ${tables.xlsPath}`);
console.log("请运行 npm run ingest 将最新表格转为查询用 JSON");
