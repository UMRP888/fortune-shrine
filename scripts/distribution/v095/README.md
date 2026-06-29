# Fortune Shrine V0.95 运营分析层

V0.95 是只读分析层。

它不会修改：

- 搜索逻辑
- 搜索稳定性与永久记忆
- 发送逻辑
- Blessing Corpus V0.9
- 产品 UI

运行：

```bash
/Users/lixiaole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
scripts/distribution/v095/run.mjs
```

输入：

```text
v08/state/搜索历史.json
v08/state/saw.json
v08/state/sent-history.json
v08/output/fresh-targets-*.json
docs/blessing-corpus-v2.json
```

输出：

```text
output/operations-analytics.json
output/OPERATIONS_DASHBOARD.md
output/blessing-corpus-audit.json
output/BLESSING_CORPUS_AUDIT.md
```

统计定义：

- 搜索次数：唯一 `runId`
- 候选人数：各来源搜索返回的 `candidateCount`
- 进入队列人数：实际 `fresh-targets` 输出行数
- 发送人数：`sent-history` 中 `status=sent` 的记录
- 唯一用户：已发送用户名忽略大小写去重

所有输出都是观察结果，不会回写现有系统。
