const { logger } = require("../logger");
const {
  isTrackingQuery,
  parseTrackingNumbers,
  queryTrackingNumbers,
  formatTrackingReply,
} = require("../services/shipments");
const { replyLongText } = require("../utils/telegramReply");

function registerTrackingHandler(bot) {
  bot.on("text", async (ctx, next) => {
    const input = (ctx.message.text || "").trim();
    if (!isTrackingQuery(input)) {
      return next();
    }

    const numbers = parseTrackingNumbers(input);
    logger.info({ userId: ctx.from && ctx.from.id, count: numbers.length }, "查询快递单号");
    const result = queryTrackingNumbers(numbers);
    const text = formatTrackingReply(result);
    if (!text) {
      return;
    }
    await replyLongText(ctx, text);
  });
}

module.exports = { registerTrackingHandler };
