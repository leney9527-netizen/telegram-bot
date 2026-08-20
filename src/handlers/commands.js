const { mainMenuKeyboard, inlineDemoKeyboard, removeKeyboard } = require("../keyboards");
const { logger } = require("../logger");
const { sampleTrackingNumbers } = require("../services/shipments");

function buildHelpText() {
  let samples = [];
  try {
    samples = sampleTrackingNumbers(5);
  } catch (err) {
    logger.warn({ err }, "加载示例单号失败");
  }

  const sampleLines = samples.length
    ? ["", "可试查的模拟单号：", ...samples.map((n) => `  ${n}`)]
    : [];

  return [
    "直接发送快递单号即可查询（仅支持数字和大小写字母，无需命令）。",
    "查询只读取最新业务表格转换后的 JSON，不直接读原始表格。",
    "同一唛头若有多日数据，只返回该快递单号对应发货日期的全部记录及当日重量、泰铢汇总；当日该唛头合计泰铢不足 50 时按 50 计算。",
    "若唛头为「无唛头」，将提示联系客服处理。",
    "",
    "可用命令：",
    "/start — 启动机器人并显示主菜单键盘",
    "/help — 查看帮助",
    "/about — 关于本机器人",
    "/echo <文本> — 原样回复你输入的内容",
    "/menu — 打开主菜单键盘",
    "/inline — 发送内联键盘示例",
    "/hide — 隐藏回复键盘",
    ...sampleLines,
  ].join("\n");
}

function getHelpText() {
  return buildHelpText();
}

function registerCommands(bot) {
  bot.start(async (ctx) => {
    const name = ctx.from.first_name || "朋友";
    logger.info({ userId: ctx.from.id }, "用户执行 /start");
    await ctx.reply(
      `你好，${name}！直接发送快递单号（数字和字母）即可查询。\n查询只使用最新表格转换后的 JSON，同一唛头只返回该单号对应发货日期的数据。\n发送 /help 查看说明。`,
      mainMenuKeyboard()
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(getHelpText());
  });

  bot.command("about", async (ctx) => {
    await ctx.reply(
      "跨境发货查询机器人：按快递单号检索状态，并汇总同一唛头当天的重量与泰铢收款。"
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

module.exports = { registerCommands, getHelpText };
