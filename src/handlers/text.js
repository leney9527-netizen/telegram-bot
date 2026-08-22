const { isAlphanumericInput, answerForUserMessage } = require("../services/keyAnswers");
const { replyLongText } = require("../utils/telegramReply");

function registerTextHandlers(bot) {
  bot.on("text", async (ctx, next) => {
    const input = (ctx.message.text || "").trim();
    if (!input || isAlphanumericInput(input)) {
      return next();
    }

    const answer = answerForUserMessage(input);
    if (answer === null || answer === "") {
      return;
    }
    await replyLongText(ctx, answer);
  });
}

module.exports = { registerTextHandlers };
