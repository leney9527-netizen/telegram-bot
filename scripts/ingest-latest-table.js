const { ingestLatestTable } = require("../src/services/ingest");

const payload = ingestLatestTable();
if (!payload) {
  process.exitCode = 1;
}
