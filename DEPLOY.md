# Vultr 部署与数据维护手册

适用本项目：Telegram 查件机器人（Polling 模式）。  
电脑关机后由 Vultr 云服务器 24 小时运行。同一 Bot Token 同一时间只能有一个实例在跑（本机请先停掉 `npm start`）。

---

## 一、开始前准备

在 Vultr 控制台记下：

- 公网 IP（例如 `45.xx.xx.xx`）
- 系统：建议 Ubuntu 22.04 / 24.04
- 登录账号：一般是 `root`（或你创建的用户）
- 登录密码或 SSH 密钥

本机需要：

- SSH 客户端（Windows 可用 PowerShell，或 [PuTTY](https://www.putty.org/)）
- 传文件工具：[WinSCP](https://winscp.net/)（推荐，用来每天传业务表格）

GitHub 仓库：

```text
https://github.com/leney9527-netizen/telegram-bot.git
```

`.env` 里的 Token **只放在服务器本机**，不要提交到 GitHub。

---

## 二、第一次部署（只做一次）

### 1. 停掉本机机器人

在你的 Windows 上，关掉正在跑 `npm start` 的终端，避免和服务器抢同一个 Token。

### 2. SSH 登录 Vultr

PowerShell：

```bash
ssh root@你的服务器IP
```

首次会提示确认指纹，输入 `yes`。再输入 root 密码（输入时屏幕不显示字符，属正常）。

### 3. 更新系统并安装 Git、时区工具

```bash
apt update && apt upgrade -y
apt install -y git curl ca-certificates
timedatectl set-timezone Asia/Shanghai
timedatectl
```

16:00、18:00、20:00、22:00 核对已按北京时间写在程序里，改服务器时区主要是让日志时间好读。

### 4. 安装 Node.js 20（LTS）

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
```

`node -v` 应显示 `v20` 或更高。

### 5. 拉取代码

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/leney9527-netizen/telegram-bot.git
cd telegram-bot
npm install
```

### 6. 配置环境变量

```bash
cp .env.example .env
nano .env
```

至少改这一行（把占位符换成 BotFather 给的 Token）：

```text
BOT_TOKEN=这里填真实Token
BOT_MODE=polling
LOG_LEVEL=info
```

保存：`Ctrl+O` 回车，退出：`Ctrl+X`。

检查权限，避免别人读到 Token：

```bash
chmod 600 .env
```

### 7. 放入第一份业务表格

表格必须放在 `/opt/telegram-bot/data/`，文件名必须是：

```text
YYYY-MM-DD发货快递单.csv
```

例如北京时间 2026-08-22 的表：

```text
2026-08-22发货快递单.csv
```

也支持 `.xls` / `.xlsx`。  
列需包含：唛头、快递单号、品名、件数、实际计算重量、实际收款泰铢、发货日期、快递状态。

用 WinSCP：协议 SFTP，主机填服务器 IP，用户 `root`，密码与 SSH 相同。  
左侧选本机表格，右侧进入 `/opt/telegram-bot/data/`，拖进去。

或在服务器上确认：

```bash
ls -l /opt/telegram-bot/data/
```

### 8. 用 PM2 常驻运行

```bash
cd /opt/telegram-bot
npm install -g pm2
pm2 start src/index.js --name telegram-bot
pm2 save
pm2 startup
```

最后一条命令会打印一行 `sudo env ...`，**原样再执行一次**，这样服务器重启后机器人会自动起来。

查看状态：

```bash
pm2 status
pm2 logs telegram-bot --lines 50
```

正常日志应类似：

- 已将最新表格转换为 JSON
- 已登记北京时间每天下午16:00、18:00、20:00、22:00的表格更新核对
- 机器人已以 long polling 模式启动

到 Telegram 给机器人发 `/start` 和一笔快递单号，确认能回复。

### 9. 防火墙（Polling 模式）

Polling 是服务器主动连 Telegram，一般**不必**对公网开放 3000 或 443。  
Vultr / `ufw` 只需放行 SSH（22）。不要把 `.env` 暴露到网站目录。

---

## 三、日常维护后台数据

查询**只读** `data/shipments.json`。这份 JSON 由「日期最新」的业务表格转换而来，不要手改 JSON 应付业务（改了也会在下次转换时被覆盖）。

### 每天怎么更新发货表

1. 在本机整理好当天表格。
2. 文件命名：`当天北京日期 + 发货快递单`，例如 `2026-08-22发货快递单.csv`。
3. 用 WinSCP 上传到服务器 `/opt/telegram-bot/data/`（可保留历史日期的旧文件）。
4. 上传后任选一种刷新 JSON：

**方式 A：等北京时间 16:00、18:00、20:00 或 22:00**  
程序会在这些整点自动找「当天日期+发货快递单」：找到就转换；找不到只打告警日志，继续用上一份 JSON，不会编造数据。

**方式 B：上传后立刻生效（推荐白天改完就执行）**

SSH 登录后：

```bash
cd /opt/telegram-bot
npm run ingest
pm2 restart telegram-bot
```

`ingest` 会读取 `data/` 里**日期最新**的那张「*发货快递单*」表，覆盖生成 `data/shipments.json`。  
重启是为了让已运行的进程重新加载 JSON（若你希望免重启，需要以后再改热加载；当前请重启一次）。

### 查询规则（维护时需知道）

- 用户发快递单号 → 只查 JSON，不直接读 csv。
- 同一唛头有多天数据时，只返回**该单号对应发货日期**当天的记录和汇总。
- 唛头为「无唛头」→ 提示联系客服，并返回该单到货状态（取表格中的「到货状态」，没有则用「快递状态」）。
- 查不到单号 → 明确说没有记录，不会编数据。

### 建议保留哪些文件

| 路径 | 作用 | 是否每天覆盖 |
| --- | --- | --- |
| `data/YYYY-MM-DD发货快递单.csv` | 业务源文件，建议按天保留 | 当天文件可覆盖上传 |
| `data/shipments.json` | 查询唯一数据源，由 ingest / 启动 / 16–22 点核对生成 | 自动覆盖 |
| `.env` | Token，勿删除、勿上传到 Git | 几乎不改 |

定期把 `data/` 整夹下载到本机备份（WinSCP 拖到本地即可）。

---

## 四、代码更新（GitHub 有新提交时）

本机改完并 push 到 GitHub 后，在服务器：

```bash
cd /opt/telegram-bot
git pull
npm install
pm2 restart telegram-bot
```

`.env` 和 `data/` 里的业务表一般不受 `git pull` 影响（`data` 里若被 Git 跟踪的文件可能被覆盖，以仓库实际情况为准；业务 csv 建议只放服务器、不要提交 Token）。

---

## 五、常用运维命令

```bash
pm2 status                 # 是否在跑
pm2 logs telegram-bot      # 实时日志
pm2 restart telegram-bot   # 重启
pm2 stop telegram-bot      # 停止
pm2 start telegram-bot     # 再启动
```

服务器重启后，若已执行过 `pm2 startup` 和 `pm2 save`，机器人会自动起来。  
验证：`pm2 status` 中 `telegram-bot` 为 `online`。

---

## 六、常见问题

**Telegram 没反应**

- 本机是否还在 `npm start`（必须关掉）。
- `pm2 logs` 是否有 Token 错误、连不上 `api.telegram.org`。
- Vultr 机房若被墙连 Telegram，需换能访问 Telegram API 的地区或按你现有网络方案处理。

**16:00 / 18:00 / 20:00 / 22:00 显示表格未更新**

- 文件名日期必须是**当天北京日期**，中间不要多空格。
- 扩展名：`.csv` / `.xls` / `.xlsx`。
- 文件是否在 `/opt/telegram-bot/data/`，而不是 `data/data/`。

**上传了新表但查询还是旧数据**

- 执行 `npm run ingest` 后 `pm2 restart telegram-bot`。
- `ls -l data/shipments.json` 看文件时间是否刚更新。

**Token 泄露**

- 立刻找 BotFather 换 Token，改服务器 `.env`，`pm2 restart telegram-bot`。
- 不要把 `.env` 发到聊天或提交 Git。

**SSH 登不上**

- Vultr 控制台看实例是否 Running、IP 是否变了。
- 用控制台自带的 View Console 进系统，检查 ssh 服务和防火墙。

---

## 七、建议的每日节奏

1. 白天：整理发货表，按当天日期命名。  
2. WinSCP 上传到 `/opt/telegram-bot/data/`。  
3. SSH 执行 `npm run ingest && pm2 restart telegram-bot`（希望马上查到新单就做）。  
4. 不手动执行时：最晚在北京时间 22:00 前传好当天文件，交给自动核对。  
5. 偶尔下载 `data/` 做备份。
