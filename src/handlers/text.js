const { logger } = require("../logger");
const { HELP_TEXT } = require("./commands");
const { inlineDemoKeyboard } = require("../keyboards");

function registerTextHandlers(bot) {
  bot.hears("功能介绍", async (ctx) => {
    await ctx.reply(HELP_TEXT);
  });

  bot.hears("发送示例", async (ctx) => {
    await ctx.reply("点击下面的按钮试试内联交互：", inlineDemoKeyboard());
  });

  bot.hears("帮助", async (ctx) => {
    await ctx.reply(HELP_TEXT);
  });

  bot.hears("关于", async (ctx) => {
    await ctx.reply("基于 Telegraf 的 Node.js Telegram 机器人示例。");
  });

  bot.on("text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) {
      await ctx.reply("未知命令。发送 /help 查看可用命令。");
      return;
    }

    logger.info({ userId: ctx.from.id, text: ctx.message.text }, "收到文本消息");
    await ctx.reply(`收到：${ctx.message.text}\n\n提示：发送 /help 查看更多功能。`);
  });
}

module.exports = { registerTextHandlers };
