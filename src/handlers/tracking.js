const { logger } = require("../logger");
const {
  isTrackingQuery,
  queryByTrackingNumber,
  formatTrackingReply,
} = require("../services/shipments");
const { replyLongText } = require("../utils/telegramReply");

function registerTrackingHandler(bot) {
  bot.hears(/^[A-Za-z0-9]+$/, async (ctx, next) => {
    const input = ctx.message.text.trim();
    if (!isTrackingQuery(input)) {
      return next();
    }

    logger.info({ userId: ctx.from.id, tracking: input }, "查询快递单号");
    const result = queryByTrackingNumber(input);
    await replyLongText(ctx, formatTrackingReply(result, input));
  });
}

module.exports = { registerTrackingHandler };
