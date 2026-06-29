# Fortune Shrine Growth Engine V0.7

V0.7 是独立发送层原型。它不修改 V0.5 或 V0.6。

## 安全边界

- 不自动点击 X 的 `Reply` 发送按钮。
- 不自动按发送快捷键。
- 不批量打开帖子。
- 不连续发送。
- 每次只处理用户明确点击的一条草稿。
- 用户必须在 X 页面阅读草稿并亲自确认发送。

## 文件

```text
prepare-queue.mjs       从 V0.6 CSV 恢复可核验的原帖 URL
server.mjs              本地审核页面服务器
public/                 审核队列界面
extension/              Chrome/Chromium 草稿填入扩展
data/queue.json         默认审核队列
data/queue.csv          可审计队列
```

## 1. 准备队列

```bash
PUBLIC_X_PROXY=http://127.0.0.1:7897 \
/Users/lixiaole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
scripts/distribution/v07/prepare-queue.mjs
```

若某条历史帖子已不在公开资料页中，`post_url_status` 会是 `missing`。
审核页面不会把主页冒充原帖，也不会启用自动填入按钮。

## 2. 安装草稿填入扩展

1. 打开 `chrome://extensions/`。
2. 开启 Developer mode。
3. 点击 Load unpacked。
4. 选择：

```text
scripts/distribution/v07/extension
```

扩展支持：

- `x.com/*/status/*`
- `twitter.com/*/status/*`
- `polymarket.com/event/*`
- `polymarket.com/zh/event/*`

Polymarket 队列会按原文定位评论，点击该评论下的回复入口并填入草稿。
它不会点击“发布”。如果无法确认目标评论或输入框，只会复制草稿并提示人工处理。

## 3. 启动审核页面

```bash
/Users/lixiaole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
scripts/distribution/v07/server.mjs
```

访问：

```text
http://127.0.0.1:4191/
```

## 4. 人工发送流程

```text
选择用户
→ 阅读原帖
→ 选择回复 A/B/C
→ 点击“打开原帖并填入”
→ 扩展定位回复框并填入
→ 人工逐字检查
→ 人工点击 Reply
→ 返回审核页标记“已人工发送”
```

“复制回复”只写入剪贴板。“标记为已人工发送”只记录在本机浏览器
`localStorage`，不会执行任何 X 账号操作。
