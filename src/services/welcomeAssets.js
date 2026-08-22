const fs = require("fs");
const path = require("path");
const { DATA_DIR } = require("./tableFiles");

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function findTopImagePath() {
  if (!fs.existsSync(DATA_DIR)) {
    return null;
  }
  const files = fs.readdirSync(DATA_DIR);
  const matches = files.filter((filename) => {
    const ext = path.extname(filename).toLowerCase();
    const stem = path.basename(filename, ext).toLowerCase();
    return stem === "topimage" && IMAGE_EXTS.has(ext);
  });
  if (matches.length === 0) {
    return null;
  }
  const preferred = matches.find((name) => name.toLowerCase() === "topimage.png") || matches[0];
  return path.join(DATA_DIR, preferred);
}

module.exports = { findTopImagePath };
