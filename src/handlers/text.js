const { getHelpText } = require("./commands");
const { sampleTrackingNumbers } = require("../services/shipments");

function registerTextHandlers(bot) {
  bot.hears("查件说明", async (ctx) => {
    await ctx.reply(getHelpText());
  });

  bot.hears("示例单号", async (ctx) => {
    const samples = sampleTrackingNumbers(8);
    await ctx.reply(`可直接复制发送以下模拟单号查询：\n${samples.join("\n")}`);
  });

  bot.hears("帮助", async (ctx) => {
    await ctx.reply(getHelpText());
  });

  bot.hears("关于", async (ctx) => {
    await ctx.reply(
      "跨境发货查询机器人：按快递单号检索状态，并汇总同一唛头当天的重量与泰铢收款。"
    );
  });

  bot.on("text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) {
      await ctx.reply("未知命令。发送 /help 查看可用命令。");
      return;
    }

    await ctx.reply("请发送快递单号查询（仅数字和大小写字母）。发送 /help 查看说明。");
  });
}

module.exports = { registerTextHandlers };
