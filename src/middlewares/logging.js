const { logger } = require("../logger");

function loggingMiddleware() {
  return async (ctx, next) => {
    const from = ctx.from
      ? `${ctx.from.id}:${ctx.from.username || ctx.from.first_name || "unknown"}`
      : "anonymous";
    const updateType = ctx.updateType || "unknown";
    logger.debug({ from, updateType }, "收到更新");
    await next();
  };
}

module.exports = { loggingMiddleware };
