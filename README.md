# Telegram 机器人

基于 [Telegraf](https://github.com/telegraf/telegraf) 的 Node.js Telegram 机器人，支持文本收发、常用命令、回复键盘与内联键盘，并带有模块化结构、错误处理和日志。

## 功能

- 文本消息接收与回显
- 命令：`/start`、`/help`、`/about`、`/echo`、`/menu`、`/inline`、`/hide`
- 回复键盘（主菜单）与内联键盘（点赞 / 统计）
- 全局错误捕获，避免单次失败导致进程退出
- 结构化日志（可通过 `LOG_LEVEL` 调整）

## 环境要求

- Node.js 18 或更高版本
- 一个由 [@BotFather](https://t.me/BotFather) 创建的 Bot Token

## 依赖安装

在项目根目录执行：

```bash
npm install
```

## 环境变量配置

1. 复制示例文件：

```bash
copy .env.example .env
```

macOS / Linux 使用：

```bash
cp .env.example .env
```

2. 编辑 `.env`，至少填写 `BOT_TOKEN`。

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `BOT_TOKEN` | 是 | BotFather 提供的 Token |
| `BOT_MODE` | 否 | `polling`（默认）或 `webhook` |
| `WEBHOOK_DOMAIN` | webhook 时必填 | 公网 HTTPS 域名，例如 `https://bot.example.com` |
| `WEBHOOK_PATH` | 否 | webhook 路径，默认 `/telegram/webhook` |
| `WEBHOOK_PORT` | 否 | 本地监听端口，默认 `3000` |
| `LOG_LEVEL` | 否 | `fatal` / `error` / `warn` / `info` / `debug` / `trace` |

获取 Token：打开 Telegram，联系 `@BotFather`，发送 `/newbot`，按提示创建后复制 Token。

## 启动命令

开发（文件变更后自动重启，需 Node 18+）：

```bash
npm run dev
```

生产：

```bash
npm start
```

启动成功后日志中会看到「机器人已以 long polling 模式启动」。在 Telegram 中向机器人发送 `/start` 即可使用。

## 代码结构

```
telegram-bot/
├── src/
│   ├── index.js                 # 入口：创建 Bot、启动、优雅退出
│   ├── config.js                # 读取并校验环境变量
│   ├── logger.js                # pino 日志
│   ├── keyboards.js             # 回复键盘 / 内联键盘
│   ├── handlers/
│   │   ├── commands.js          # 命令处理
│   │   ├── text.js              # 文本与菜单按钮
│   │   └── callbacks.js         # 内联按钮回调
│   └── middlewares/
│       ├── logging.js           # 请求日志
│       └── errorHandler.js      # 错误处理
├── .env.example
├── package.json
└── README.md
```

## 部署说明

### 本机或 VPS（Polling，推荐起步）

1. 安装 Node.js 18+
2. 将代码放到服务器并执行 `npm install`
3. 配置 `.env`（`BOT_MODE=polling`，填写 `BOT_TOKEN`）
4. `npm start`

建议用进程管理器保持常驻，例如：

```bash
npm install -g pm2
pm2 start src/index.js --name telegram-bot
pm2 save
```

Polling 不需要公网 HTTPS，适合个人 VPS。同一 Token 不要同时开多个 polling 实例。

### Webhook（生产可选）

1. 准备可公网访问的 HTTPS 域名（Telegram 要求 webhook 使用 TLS）
2. `.env` 中设置：

```
BOT_MODE=webhook
WEBHOOK_DOMAIN=https://你的域名
WEBHOOK_PATH=/telegram/webhook
WEBHOOK_PORT=3000
```

3. 用 Nginx / Caddy 把 `443` 反代到本机 `WEBHOOK_PORT`
4. `npm start`

## 常见问题

- **启动报缺少 BOT_TOKEN**：未创建 `.env` 或仍使用占位符 `your_bot_token_here`
- **收不到消息**：检查 Token 是否正确、是否有另一个实例占用同一 Bot、本机网络是否能访问 `api.telegram.org`
- **Webhook 无响应**：确认域名 HTTPS 有效、反代路径与 `WEBHOOK_PATH` 一致、防火墙放行 443

## 许可证

MIT
