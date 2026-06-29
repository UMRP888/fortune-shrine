# Fortune Shrine V1.1 Send Layer MVP

V1.1 completes the controlled local loop:

```text
Candidate
→ Blessing Draft
→ Approve / Reject
→ independent Send confirmation
→ human platform send
→ Result Log
```

Safety properties:

- Approve never sends.
- One `unconfirmed` send is allowed at a time.
- No automatic retry.
- No batch or unattended sending.
- `sent` requires a platform `message_id`.
- Default daily start limit is 100; the hard maximum is 200.
- A manual safety stop blocks new sends.
- The future Auto Approve interface is declared but disabled:
  `auto_approve_enabled=false` and `can_execute_without_human=false`.
- Existing V0.7, V0.8, V0.95, search, attribution, and blessing files are not modified.

Start:

```bash
/Users/lixiaole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
scripts/distribution/v11/server.mjs
```

Open:

```text
http://127.0.0.1:4193/
```

The default queue is read from:

```text
scripts/distribution/v07/data/queue.json
```

Override it without changing another layer:

```bash
V11_QUEUE_PATH=/absolute/path/to/queue.json \
V11_DAILY_SEND_LIMIT=100 \
node scripts/distribution/v11/server.mjs
```

Persistent V1.1 data:

```text
state/send-state.json
state/send-events.jsonl
```
