---
source: "Andrej Karpathy · GitHub Gist「LLM Wiki」"
url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
published: 2026-04
captured: 2026-09-26
type: web-clip
---

# LLM Wiki：一种持续积累的知识库模式（要点）

- 核心：不让 AI 每次都从原始文档里重新检索、重新推导，而是让 AI **持续地编写和维护一个 Markdown 维基**。「这个维基是一个会持续复利的产物（persistent, compounding artifact）」。
- 三层：
  1. **raw（原始资料）**：不可改动，是唯一事实来源
  2. **wiki（维基）**：AI 生成并维护的页面——摘要页、实体页、概念页、对比页，互相链接
  3. **schema（规则文件）**：CLAUDE.md / AGENTS.md，规定结构、约定和工作流，让 AI 成为守纪律的维基维护者
- 三个操作：
  - **ingest（录入）**：放入新资料 → AI 读它、写摘要页、更新索引、修订相关的实体和概念页
  - **query（提问）**：对维基提问 → AI 找相关页面并综合回答；有价值的回答可以存回维基，知识继续累积
  - **lint（体检）**：定期检查矛盾、过时说法、孤立页面、缺失的交叉链接
- 两个关键文件：index.md（按类别列出每一页和一句话摘要，每次录入都更新）；log.md（只追加的时间线，条目格式如 `## [YYYY-MM-DD] ingest | 标题`）
- 为什么有效：维基被人放弃，是因为维护负担（更新交叉引用、保持摘要最新、保持一致）；这些对 AI 几乎是零成本——不会忘、不会烦，一次能改 15 个文件
- 工具：Obsidian Web Clipper（网页转 Markdown）、图谱视图、Marp（Markdown 做幻灯片）、qmd（本地搜索）
