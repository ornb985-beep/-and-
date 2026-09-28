---
name: llm-wiki
description: 按 Karpathy LLM Wiki 方法维护本 Obsidian 知识库：录入（ingest）raw 里的新资料、对维基提问（query）、体检（lint）。当用户说录入、整理、归档、提问、体检、检查知识库、更新索引或日志时使用。
---

# LLM Wiki 维护技能

先读仓库根目录的 `AGENTS.md`，它是最高规则。本技能只是把三个操作写成可执行的步骤。

## 录入（ingest）

输入：`raw/` 里的一个或多个新文件（没指定就对比 `wiki/log.md` 找出还没录入过的文件）。

1. 逐个读全文。
2. 写 `wiki/sources/摘要-<资料名>.md`（用 `templates/摘要页.md`）。
3. 抽取概念和实体：先在 `wiki/index.md` 和各页 `aliases` 里查是否已有页面。
   - 有 → 更新（要点、出处、`updated`）
   - 没有 → 用 `templates/概念页.md` 或 `templates/实体页.md` 新建
4. 冲突 → 两说并存 + `> [!warning] 冲突` + 在 `wiki/questions/` 开问题页。
5. 更新 `wiki/index.md`。
6. 在 `wiki/log.md` 末尾追加 `## [YYYY-MM-DD] ingest | <资料名>`，列出新建 / 修改的页面。
7. 最后汇报：新建几页、修改几页、发现几处冲突。

写 Markdown 时遵守 obsidian-markdown 技能（双链、callout、属性）；需要表格视图时用 obsidian-bases；需要关系图时用 json-canvas。

## 提问（query）

1. 读 `wiki/index.md` → 读相关页面 → 必要时核对 raw 原文。
2. 回答带 `[[双链]]` 出处；原话、推算、未知分开写。
3. 有长期价值 → 存 `outputs/YYYY-MM-DD-<问题>.md`，结论回写相关页面。
4. log 追加 `## [YYYY-MM-DD] query | <问题>`。

## 体检（lint）

检查：冲突、过时、孤立页、断链、缺页、缺口、越权（wiki 写了 raw 没说的事实）。
报告写 `outputs/体检报告-YYYY-MM-DD.md`，log 追加 `## [YYYY-MM-DD] lint | 第 N 次体检`。

断链可以用这个命令快速列出（在仓库根目录运行）：

```bash
grep -rhoE "\[\[[^]|#]+" wiki | sed 's/\[\[//' | sort -u | while read -r t; do
  [ -n "$(find . -name "$t.md" -not -path './.claude/*' | head -1)" ] || echo "断链: $t"; done
```
