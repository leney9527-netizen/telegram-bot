const { Markup } = require("telegraf");

function mainMenuKeyboard() {
  return Markup.keyboard([
    ["查件说明", "示例单号"],
    ["帮助", "关于"],
  ]).resize();
}

function inlineDemoKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("点赞", "like"),
      Markup.button.callback("统计", "stats"),
    ],
    [Markup.button.url("Telegram 官方文档", "https://core.telegram.org/bots")],
  ]);
}

function removeKeyboard() {
  return Markup.removeKeyboard();
}

module.exports = {
  mainMenuKeyboard,
  inlineDemoKeyboard,
  removeKeyboard,
};
