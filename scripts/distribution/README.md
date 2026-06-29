# Fortune Shrine Target Discovery Engine v1

独立发现 Polymarket 与 Crypto Twitter 活跃用户，输出去重、评分排序后的 CSV。

本目录不被 `server.mjs`、生产页面或支付流程引用。运行本工具不会修改生产代码，也不会发帖、回复、私信或执行账号操作。

## 输出字段

```text
用户名
平台
关注者
profile_url
最近的帖子
社区
评分
```

- `关注者`：X 使用官方 API 的 `public_metrics.followers_count`。Polymarket 未公开该指标，因此留空。
- `最近的帖子`：最多保存该用户最近三条本轮发现的公开发言。
- `社区`：X 的搜索主题，或 Polymarket 市场名称。
- `评分`：1–100，依据发言时效、近期活跃度、风险/等待/克制语言和公开互动量计算。推广、拉群、保证收益等语言会扣分。

## 数据来源

### Polymarket

使用公开 Gamma API：

```text
GET https://gamma-api.polymarket.com/events
GET https://gamma-api.polymarket.com/comments
```

默认读取按 24 小时交易量排序的 40 个活跃市场，再读取每个有评论市场的最新公开评论。

### X

使用 X API v2 Recent Search：

```text
GET https://api.x.com/2/tweets/search/recent
```

优先使用官方 API。需要环境变量：

```bash
export X_BEARER_TOKEN='你的 X App Bearer Token'
```

当前执行环境无法读取 Railway Variables 时，会自动切换到不依赖 Railway 的公开工作流：

```text
Brave 公共搜索索引 → X Syndication 公开时间线 → 账号、粉丝数、最近三条帖子
```

若本机网络必须经过代理：

```bash
export PUBLIC_X_PROXY='http://127.0.0.1:7897'
```

搜索主题固定为：

- Polymarket
- Prediction Markets
- Crypto Trading
- Meme Coin
- Risk / Luck

## 运行

如果 Node 不在 PATH：

```bash
NODE=/Users/lixiaole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

运行完整发现：

```bash
$NODE scripts/distribution/discover.mjs
```

也可以使用每日运行入口。它会读取可选的
`scripts/distribution/.env.distribution`，并防止两个定时任务同时运行：

```bash
cp scripts/distribution/.env.distribution.example scripts/distribution/.env.distribution
chmod 600 scripts/distribution/.env.distribution
scripts/distribution/run-daily.sh
```

默认目标：

```text
总数：100
Polymarket：50
X：50
```

某个平台不足时，另一平台自动补足剩余额度。真实结果少于 100 时只输出真实发现，不伪造记录。

只运行 Polymarket：

```bash
$NODE scripts/distribution/discover.mjs --platforms polymarket
```

自定义配额：

```bash
$NODE scripts/distribution/discover.mjs \
  --target 100 \
  --polymarket-target 40 \
  --x-target 60
```

## 输出位置

```text
scripts/distribution/output/latest.csv
scripts/distribution/output/fortune-shrine-targets-<timestamp>.csv
scripts/distribution/output/run-<timestamp>.json
```

运行记录保存每个真实请求 URL、返回数量、平台错误和 CSV 路径。

## 自动去重

已输出的身份保存在：

```text
scripts/distribution/state/seen.json
```

去重键：

- X：小写用户名
- Polymarket：公开代理钱包地址

只有 CSV 成功写入后才更新去重状态。`--dry-run` 会生成 CSV，但不会写入去重状态。

## 每日运行

示例 crontab（每天上午 9:00）：

```cron
0 9 * * * "/Users/lixiaole/Documents/Fortune Shrine/scripts/distribution/run-daily.sh" >> "/Users/lixiaole/Documents/Fortune Shrine/scripts/distribution/discovery.log" 2>&1
```

将真实 Token 写入权限为 `600` 的 `.env.distribution`。该文件匹配项目现有
`.env.*` 忽略规则，不会进入 Git。

## 测试

测试不访问网络：

```bash
$NODE scripts/distribution/test.mjs
```

测试覆盖：

- Polymarket 用户聚合
- X 粉丝数读取
- 跨查询去重
- 平台配额
- 评分排序
- CSV 字段与转义

## 失败行为

- X 未配置 Token：记录 X 失败，Polymarket 仍继续运行。
- 单个平台不可达：记录失败，不用估算数据补齐。
- 两个平台都失败且结果为 0：进程返回非零状态。
- 不会把请求上限、帖子数量或估算覆盖当作真实用户数量。
