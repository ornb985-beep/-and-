# CLAUDE.md

本仓库的全部规则写在 AGENTS.md（所有 AI 通用）。Claude Code 会通过下面这行把它导入：

@AGENTS.md

Claude Code 专用补充：

- 技能在 `.claude/skills/`：写 Markdown 用 obsidian-markdown，写 `.base` 用 obsidian-bases，写 `.canvas` 用 json-canvas，抓网页用 defuddle，录入 / 提问 / 体检用 llm-wiki。
- 快捷命令：`/ingest 文件名`、`/query 问题`、`/lint`。
- 复杂任务（首次建库、大批录入、全库体检）在指令末尾加 `ultrathink`，让模型深度思考后再动手。
