const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const config = {
  botToken: process.env.BOT_TOKEN || "",
  mode: (process.env.BOT_MODE || "polling").toLowerCase(),
  webhook: {
    domain: process.env.WEBHOOK_DOMAIN || "",
    path: process.env.WEBHOOK_PATH || "/telegram/webhook",
    port: Number(process.env.WEBHOOK_PORT || 3000),
  },
  logLevel: process.env.LOG_LEVEL || "info",
};

function validateConfig() {
  if (!config.botToken || config.botToken === "your_bot_token_here") {
    throw new Error("缺少或未配置环境变量 BOT_TOKEN，请复制 .env.example 为 .env 并填写");
  }
  if (!["polling", "webhook"].includes(config.mode)) {
    throw new Error(`BOT_MODE 必须是 polling 或 webhook，当前为: ${config.mode}`);
  }
  if (config.mode === "webhook" && !config.webhook.domain) {
    throw new Error("webhook 模式需要配置 WEBHOOK_DOMAIN");
  }
}

module.exports = { config, validateConfig };
