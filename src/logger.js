const pino = require("pino");
const { config } = require("./config");

const logger = pino({
  level: config.logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

module.exports = { logger };
