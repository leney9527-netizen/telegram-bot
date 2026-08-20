const { logger } = require("../logger");

const likeCounts = new Map();

function registerCallbacks(bot) {
  bot.action("like", async (ctx) => {
    const userId = ctx.from.id;
    const next = (likeCounts.get(userId) || 0) + 1;
    likeCounts.set(userId, next);
    logger.debug({ userId, next }, "用户点赞");
    await ctx.answerCbQuery(`已点赞 ${next} 次`);
    await ctx.editMessageText(`感谢点赞！当前你点了 ${next} 次。`).catch(() => {
      // 消息内容未变化时 Telegram 会报错，忽略即可
    });
  });

  bot.action("stats", async (ctx) => {
    const count = likeCounts.get(ctx.from.id) || 0;
    await ctx.answerCbQuery(`你的点赞次数：${count}`, { show_alert: true });
  });
}

module.exports = { registerCallbacks };
