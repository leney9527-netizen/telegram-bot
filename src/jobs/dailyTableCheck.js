const cron = require("node-cron");
const { logger } = require("../logger");
const { TIMEZONE } = require("../constants/shipmentFields");
const { beijingDateString } = require("../utils/beijingTime");
const { ingestTodayTable } = require("../services/ingest");

const CHECK_HOURS = [16, 18, 20, 22];
const CHECK_CRON = `0 ${CHECK_HOURS.join(",")} * * *`;
const CHECK_HOURS_LABEL = CHECK_HOURS.map((hour) => `${hour}:00`).join("、");

function checkTodayTableUpdate() {
  const today = beijingDateString();
  logger.info({ today }, "开始核对当日发货表格是否已更新");
  const result = ingestTodayTable(today);
  if (!result.updated) {
    logger.warn(
      { today, expected: `${today}发货快递单.csv|.xls|.xlsx` },
      `北京时间${CHECK_HOURS_LABEL}核对：当日表格未更新`
    );
    return result;
  }
  logger.info(
    { today, sourceFile: result.payload.sourceFile, rowCount: result.payload.rowCount },
    "当日表格已更新并完成 JSON 转换"
  );
  return result;
}

function startDailyTableCheck() {
  cron.schedule(
    CHECK_CRON,
    () => {
      try {
        checkTodayTableUpdate();
      } catch (err) {
        logger.error({ err }, "核对应日发货表格失败");
      }
    },
    { timezone: TIMEZONE }
  );
  logger.info(`已登记北京时间每天下午${CHECK_HOURS_LABEL}的表格更新核对`);
}

module.exports = { startDailyTableCheck, checkTodayTableUpdate, CHECK_HOURS };
