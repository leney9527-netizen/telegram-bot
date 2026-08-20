const { mainMenuKeyboard, inlineDemoKeyboard, removeKeyboard } = require("../keyboards");
const { logger } = require("../logger");

const HELP_TEXT = [
  "可用命令：",
  "/start — 启动机器人并显示主菜单键盘",
  "/help — 查看帮助",
  "/about — 关于本机器人",
  "/echo <文本> — 原样回复你输入的内容",
  "/menu — 打开主菜单键盘",
  "/inline — 发送内联键盘示例",
  "/hide — 隐藏回复键盘",
  "",
  "也可以直接发送普通文本，机器人会回显并给出提示。",
].join("\n");

function registerCommands(bot) {
  bot.start(async (ctx) => {
    const name = ctx.from.first_name || "朋友";
    logger.info({ userId: ctx.from.id }, "用户执行 /start");
    await ctx.reply(
      `你好，${name}！我是功能演示机器人。\n发送 /help 查看全部命令。`,
      mainMenuKeyboard()
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(HELP_TEXT);
  });

  bot.command("about", async (ctx) => {
    await ctx.reply(
      "基于 Telegraf 的 Node.js Telegram 机器人示例。\n支持文本、命令、回复键盘与内联键盘。"
    );
  });

  bot.command("echo", async (ctx) => {
    const text = ctx.message.text.replace(/^\/echo(@\w+)?\s*/i, "").trim();
    if (!text) {
      await ctx.reply("用法：/echo 你好世界");
      return;
    }
    await ctx.reply(text);
  });

  bot.command("menu", async (ctx) => {
    await ctx.reply("已打开主菜单键盘。", mainMenuKeyboard());
  });

  bot.command("inline", async (ctx) => {
    await ctx.reply("这是内联键盘示例，点击下方按钮：", inlineDemoKeyboard());
  });

  bot.command("hide", async (ctx) => {
    await ctx.reply("已隐藏键盘。", removeKeyboard());
  });
}

module.exports = { registerCommands, HELP_TEXT };
