# Fortune Shrine Discovery Engine V0.8

V0.8 是独立的新鲜度优先发现版本，不覆盖现有发现引擎，也不修改
V0.7 发送器。

排序顺序：

```text
freshness_score
→ age_minutes
→ 原有评分
→ post_created_at
```

分档：

```text
S  0–15分钟
A  15–30分钟
B  30–60分钟
C  1–3小时
D  3小时以上
```

运行：

```bash
/Users/lixiaole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
scripts/distribution/v08/discover.mjs
```

输出：

```text
scripts/distribution/v08/output/latest.csv
scripts/distribution/v08/output/latest.json
```

新增字段：

```text
age_minutes
freshness_score
discovered_at
post_created_at
post_id
post_url
```

## 永久记忆

```text
state/saw.json
state/sent-history.json
```

- `saw.json` 永久记录进入候选队列的帖子 ID。
- 已记录的帖子不会再次进入 V0.8 队列。
- 同一用户名在最近 24 小时内只会进入一次。
- `sent-history.json` 由现有“标记为已人工发送”动作记录：
  `postId`、`username`、`blessing`、`sentAt`、`status`。

## 搜索可靠性

每次运行会按来源记录：

```text
时间戳
来源
搜索方式
成功 / 失败
候选人数
耗时
错误分类
错误原因
```

永久历史：

```text
state/搜索历史.json
```

最近 24 小时健康摘要：

```text
output/search-health.json
```

可视化健康仪表盘：

```text
output/search-health.html
```

结果语义：

```text
status=success + result=candidates_found  搜索成功且发现候选
status=success + result=no_results        搜索成功但没有结果
status=failed  + result=search_failed     搜索链路失败
```

Polymarket、X 官方 API 和 X 公共来源会优先读取显式代理环境变量。
若未配置，程序会探测本机 `127.0.0.1:7897`；代理不可用时才尝试直连。
