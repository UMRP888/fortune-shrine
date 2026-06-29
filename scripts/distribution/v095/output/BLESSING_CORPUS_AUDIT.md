# Fortune Shrine V0.9 祝福语料库审计

审计时间：2026-06-21T06:34:25.237Z

语料数量：308

> 本报告只列出问题与启发式风险，不修改语料库。

## 摘要

| 项目 | 数量 |
| --- | ---: |
| 完全重复组 | 0 |
| 高相似度文本对 | 2 |
| 语法启发式问题 | 0 |
| 长度异常 | 0 |
| 风格异常 | 0 |

## 完全重复文本

未发现完全重复文本。

## 高相似度文本

阈值：字符三元组 Dice similarity ≥ 0.5

| 相似度 | 左侧 ID | 右侧 ID | 左侧文本 | 右侧文本 |
| --- | --- | --- | --- | --- |
| 0.581 | FSV2-RISK-026 | FSV2-BEGIN-016 | An uncertain road asks for more than confidence. May patience, humility, and courage travel together. | You are allowed to begin before confidence feels complete. May humility and courage travel together. |
| 0.519 | FSV2-LOSS-025 | FSV2-END-018 | You may feel both gratitude and sorrow for the same thing. May neither feeling be asked to leave. | You are allowed to feel relief beside sorrow. May neither feeling accuse the other. |

## 语法问题

未发现语法启发式问题。

## 长度异常

正常范围：8–45 个英文单词。

未发现长度异常。

## 风格异常

未发现协议级风格异常。
