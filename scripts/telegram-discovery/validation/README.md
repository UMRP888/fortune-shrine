# Discovery Validation Protocol v1

Timezone: Asia/Shanghai

Daily validation fields:

- `date`
- `sampled`
- `matched`
- `false_positive`
- `unverified`

Rules:

- Randomly sample at least five current candidates per validation day.
- Verify each candidate against its original Telegram message.
- Human inspection of the original post is the authoritative evidence.
- Automated reports, success rates, and logs do not override human inspection.
- A matched original post is not automatically a true-positive classification.
- Record `false_positive` only after reviewing the original context.
- Record inaccessible or inconclusive samples as `unverified`.
- Do not estimate or claim Discovery accuracy until at least 50 samples have
  been verified.

Canonical log:

```text
discovery-validation-log.json
```
