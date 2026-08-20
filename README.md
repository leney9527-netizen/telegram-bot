# Telegram 机器人

基于 [Telegraf](https://github.com/telegraf/telegraf) 的 Node.js Telegram 机器人，支持文本收发、常用命令、回复键盘与内联键盘，并带有模块化结构、错误处理和日志。

## 功能

- 跨境发货查询：只使用最新业务表格转换后的 JSON
- 业务表格命名：`YYYY-MM-DD发货快递单.csv`（也支持 `.xls` / `.xlsx`）
- 北京时间每天下午 18:00 核对当天表格是否已更新并重新转换 JSON
- 同一唛头只返回被查询单号对应发货日期的全部记录；唛头为「无唛头」时提示联系客服
- 命令：`/start`、`/help`、`/about`、`/echo`、`/menu`、`/inline`、`/hide`

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

启动成功后，把当天业务表放到 `data/`，文件名必须同时包含**当天日期**和**发货快递单**，例如：

```
2026-08-20发货快递单.csv
```

启动时会读取日期最新的表格，转换成 `data/shipments.json`。之后所有单号查询、唛头重量和泰铢汇总都只读这份 JSON。

手动转换：

```bash
npm run ingest
```

北京时间每天下午 18:00 会核对「当天日期+发货快递单」文件是否存在：已更新则重新转 JSON；未找到则写告警日志，并继续使用上一份 JSON，不会编造数据。

重新生成模拟发货表（会写入当天日期命名的 csv，仍需 ingest）：

```bash
npm run seed
npm run ingest
```

## 代码结构

```
telegram-bot/
├── data/
│   ├── YYYY-MM-DD发货快递单.csv  # 每日更新的业务表格
│   └── shipments.json           # 由最新表格转换，查询唯一数据源
├── scripts/
│   └── generate-shipments.js    # 生成模拟数据
├── src/
│   ├── index.js                 # 入口：创建 Bot、启动、优雅退出
│   ├── config.js                # 读取并校验环境变量
│   ├── logger.js                # pino 日志
│   ├── keyboards.js             # 回复键盘 / 内联键盘
│   ├── services/
│   │   ├── ingest.js            # 最新表格转 JSON
│   │   ├── tableFiles.js        # 按文件名识别业务表
│   │   ├── tableParser.js       # 解析 csv/xls/xlsx
│   │   └── shipments.js         # 仅基于 JSON 的查询
│   ├── jobs/
│   │   └── dailyTableCheck.js   # 北京时间 18:00 核对当日表格
│   ├── handlers/
│   │   ├── commands.js          # 命令处理
│   │   ├── tracking.js          # 快递单号查询
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
