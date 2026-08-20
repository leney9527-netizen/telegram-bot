const { logger } = require("../logger");

function errorHandler(bot) {
  bot.catch((err, ctx) => {
    logger.error(
      {
        err,
        updateType: ctx.updateType,
        chatId: ctx.chat && ctx.chat.id,
        userId: ctx.from && ctx.from.id,
      },
      "处理更新时出错"
    );

    ctx.reply("处理请求时出现问题，请稍后重试。").catch((replyErr) => {
      logger.error({ err: replyErr }, "向用户发送错误提示失败");
    });
  });
}

module.exports = { errorHandler };
