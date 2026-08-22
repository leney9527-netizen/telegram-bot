const fs = require("fs");
const { Markup } = require("telegraf");
const { logger } = require("../logger");
const { START_WELCOME_TEXT } = require("../constants/welcome");
const { findTopImagePath } = require("../services/welcomeAssets");

function registerCommands(bot) {
  bot.start(async (ctx) => {
    logger.info({ userId: ctx.from && ctx.from.id }, "用户点击开始");

    const imagePath = findTopImagePath();
    if (!imagePath || !fs.existsSync(imagePath)) {
      logger.error("未找到 data/topimage 图片，无法按顺序发送欢迎图");
      return;
    }

    await ctx.replyWithPhoto({ source: imagePath }, Markup.removeKeyboard());
    await ctx.reply(START_WELCOME_TEXT, Markup.removeKeyboard());
  });
}

module.exports = { registerCommands };
