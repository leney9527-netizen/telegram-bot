const { Telegraf } = require("telegraf");
const { config, validateConfig } = require("./config");
const { logger } = require("./logger");
const { loggingMiddleware } = require("./middlewares/logging");
const { errorHandler } = require("./middlewares/errorHandler");
const { registerCommands } = require("./handlers/commands");
const { registerTextHandlers } = require("./handlers/text");
const { registerCallbacks } = require("./handlers/callbacks");

function createBot() {
  const bot = new Telegraf(config.botToken);

  errorHandler(bot);
  bot.use(loggingMiddleware());

  registerCommands(bot);
  registerCallbacks(bot);
  registerTextHandlers(bot);

  return bot;
}

async function launch(bot) {
  if (config.mode === "webhook") {
    const { domain, path, port } = config.webhook;
    await bot.launch({
      webhook: {
        domain,
        hookPath: path,
        port,
      },
    });
    logger.info({ domain, path, port }, "机器人已以 webhook 模式启动");
    return;
  }

  await bot.launch();
  logger.info("机器人已以 long polling 模式启动");
}

async function main() {
  validateConfig();
  const bot = createBot();

  process.once("SIGINT", () => {
    logger.info("收到 SIGINT，正在停止");
    bot.stop("SIGINT");
  });
  process.once("SIGTERM", () => {
    logger.info("收到 SIGTERM，正在停止");
    bot.stop("SIGTERM");
  });

  try {
    await launch(bot);
  } catch (err) {
    logger.fatal({ err }, "启动失败");
    process.exit(1);
  }
}

main();
