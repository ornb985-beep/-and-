---
description: 录入 raw 里的新资料到维基（Karpathy LLM Wiki）
argument-hint: [raw 里的文件名，可留空=全部未录入的]
---

按 AGENTS.md 第 3.1 节和 llm-wiki 技能执行「录入」。

要录入的资料：$ARGUMENTS
（如果为空：对比 wiki/log.md 里已有的 ingest 条目，找出 raw/ 里还没录入的文件，逐个处理。）

要求：一份一份处理；已有页面就更新，不新建同义页；冲突两说并存并开问题页；更新 wiki/index.md；在 wiki/log.md 末尾追加日志。
完成后汇报：新建了哪些页、改了哪些页、发现哪些冲突。
