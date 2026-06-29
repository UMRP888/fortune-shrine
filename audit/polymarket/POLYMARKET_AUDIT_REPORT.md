# Polymarket Audit Report

Audit time: 2026-06-19T04:41:33Z–2026-06-19T04:41:54Z

## Conclusion

**能用。**

本轮真实请求返回 HTTP 200、10 个活跃市场和 158 条公开评论。评论响应包含用户名或公开钱包标识、正文、发布时间、评论 ID 和所属市场信息。

## Market Request

```text
https://gamma-api.polymarket.com/events?active=true&closed=false&limit=10&order=volume24hr&ascending=false
```

- HTTP status: `200`
- Markets returned: `10`
- Raw response: `markets_response_full.json`
- Response headers: `markets_response_headers.txt`
- SHA-256: `82cb40e3ad3cf4c45f8a458facbf0a8d6208d307fd097d60dae8c0f95d642c80`

Selected market:

- ID: `30615`
- Title: `World Cup Winner`
- Reported comment count: `1418`
- URL: https://polymarket.com/event/world-cup-winner

## Comment Request

```text
https://gamma-api.polymarket.com/comments?parent_entity_id=30615&parent_entity_type=Event&limit=100&offset=0&order=createdAt&ascending=false
```

- HTTP status: `200`
- Comments returned: `158`
- Unique public usernames/wallet labels: `99`
- Raw response: `comments_response_full.json`
- Response headers: `comments_response_headers.txt`
- SHA-256: `3832f84e298fe93e743b82526dba6e9649dd07972beb85afa955b151013da65c`

The endpoint returned 158 records despite the requested `limit=100`; this
report records the actual response length rather than assuming the requested
limit.

## First 10 Comments

| # | Username | Published | Original text | Original market |
|---:|---|---|---|---|
| 1 | 0x90cc9aD4c6385BFD3305a3DCbe78cc424df31Eb0-1774885709853 | 2026-06-19T00:23:44.896987Z | Go go Argentina | https://polymarket.com/event/world-cup-winner |
| 2 | 0x90cc9aD4c6385BFD3305a3DCbe78cc424df31Eb0-1774885709853 | 2026-06-19T00:21:24.667595Z | Canada 6-0 | https://polymarket.com/event/world-cup-winner |
| 3 | Etanol | 2026-06-18T23:36:56.673771Z | Croacia x Panama & Gana next games. Finalist in 2018 and Semifinalist in 2022. Actually priced at 0,7c. Best Pick. | https://polymarket.com/event/world-cup-winner |
| 4 | BetView | 2026-06-18T21:35:37.42355Z | Come on, Ivory Coast | https://polymarket.com/event/world-cup-winner |
| 5 | Vlkva | 2026-06-18T21:21:22.919139Z | SAND 1$ YOU WILL GET 10$ BACK MONEY GLITCH TRY IT | https://polymarket.com/event/world-cup-winner |
| 6 | -bjj | 2026-06-18T21:12:24.049561Z | croatia so undervlaued | https://polymarket.com/event/world-cup-winner |
| 7 | Thyser | 2026-06-18T21:32:07.844718Z | Please 🙏 | https://polymarket.com/event/world-cup-winner |
| 8 | -bjj | 2026-06-18T21:11:29.8719Z | bro croatia is so undevalued its crazy | https://polymarket.com/event/world-cup-winner |
| 9 | kinexbt | 2026-06-18T20:57:04.078804Z | i have good production DM me if interested | https://polymarket.com/event/world-cup-winner |
| 10 | Noctekra | 2026-06-18T18:50:31.462722Z | It is what it is, but you will not know, since you don't have the vision. This is not for you... so it would seem. | https://polymarket.com/event/world-cup-winner |

## Boundary

The API provides a market URL, not a stable per-comment web URL. The saved
comment ID and market URL make the record auditable at API level, but the
website may reorder or hide older comments.

Most comments in this market are outcome advocacy, promotion, or banter. They
prove discovery access, not traveler suitability.
