# HN Audit Report

Audit time: 2026-06-19T04:41:34Z

## Conclusion

**能用。**

本轮真实请求返回 HTTP 200、100 条完整结果，并包含作者、发布时间、标题、正文和可访问的 Hacker News 原帖 URL。

## Request

```text
https://hn.algolia.com/api/v1/search_by_date?query=nervous&tags=story&numericFilters=created_at_i%3E1735689600&hitsPerPage=100
```

- HTTP status: `200`
- API total matching count: `161`
- Results returned: `100`
- Raw response: `hn_response_full.json`
- Response headers: `hn_response_headers.txt`
- SHA-256: `3ec6c2e88fae188b8ddf237ed2d072c1fe89ede7e277b1113e8de42118936775`

## First 10 Results

| # | Author | Published | Title | Original post |
|---:|---|---|---|---|
| 1 | jbredeche | 2026-06-18T16:26:30Z | Apple's Meeting That Led It to Take AI Seriously | https://news.ycombinator.com/item?id=48587822 |
| 2 | Brajeshwar | 2026-06-17T19:22:02Z | The hacker sent by Anthropic to calm the government's nerves about AI safety | https://news.ycombinator.com/item?id=48575451 |
| 3 | dkobia | 2026-06-17T08:16:57Z | The Hacker Sent by Anthropic to Calm the Government's Nerves About AI Safety | https://news.ycombinator.com/item?id=48567357 |
| 4 | nickv | 2026-06-15T18:24:54Z | Show HN: Spotlight shows what your Claude Code/Codex are doing | https://news.ycombinator.com/item?id=48545168 |
| 5 | bl4ckbe4r | 2026-06-04T10:01:17Z | Show HN: ssh late.sh - a cozy command-line Clubhouse for computer people | https://news.ycombinator.com/item?id=48396398 |
| 6 | WarOnPrivacy | 2026-06-03T23:33:31Z | Americans Have Grown Dramatically Anti-Data Center | https://news.ycombinator.com/item?id=48391575 |
| 7 | progapandist | 2026-05-28T10:27:21Z | Show HN: A tool to debug complex Stripe interactions (built with Claude's help) | https://news.ycombinator.com/item?id=48307012 |
| 8 | tenpast | 2026-05-27T14:41:41Z | AI as Nervous System | https://news.ycombinator.com/item?id=48295143 |
| 9 | sweetgummybears | 2026-05-27T09:04:57Z | Show HN: Sotto – AI interview assistant for Mac | https://news.ycombinator.com/item?id=48291585 |
| 10 | srameshc | 2026-05-20T16:50:54Z | Ask HN: Shouldn't Google need to give a public statement about Railway incident? | https://news.ycombinator.com/item?id=48210590 |

## Body Evidence

The complete unmodified API response is stored in `hn_response_full.json`.
Examples containing personal uncertainty include:

- `nickv`: “excited (and a little nervous) to share”
- `bl4ckbe4r`: “I've been a little nervous to post this”
- `sweetgummybears`: describes freezing during interviews due to nerves

## Boundary

Successful retrieval does not mean every keyword match is a suitable traveler.
The query also returns news headlines and uses of “nervous system.” Candidate
qualification still requires human review of the saved body.
