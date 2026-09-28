# AGENTS.md —— 【你的领域】知识库的规则

> 这个文件是给 AI 看的「宪法」。任何 AI 助手（Claude Code、Codex、Gemini CLI、Cursor……）进入本仓库，第一件事是完整读完本文件，再动手。
> 方法来自 Andrej Karpathy 的 LLM Wiki：AI 不是每次从原始资料里现查现编，而是**持续维护一个会复利增长的维基**。
>
> 使用前：把全文的 `【你的领域】` 换成你的主题，把第 0 节和第 5 节按你的情况填好。其余各节可以原样保留。

## 0. 这个库是干什么的

主题：**【你的领域】**。服务谁：【谁会来查、他们要解决什么问题】。

总入口：`wiki/synthesis/【总览页】.md`（第一次录入后由 AI 建）；目录：`wiki/index.md`；历史：`wiki/log.md`。

## 1. 三层结构（不许混）

| 层 | 目录 | 谁写 | 规则 |
| --- | --- | --- | --- |
| 原始资料 | `raw/` | 人（手动放入 / Web Clipper / 导出） | **只读**。AI 永远不改、不删、不重命名 raw 里的文件。它是唯一事实来源。 |
| 维基 | `wiki/` | AI | AI 全权维护：新建、改写、合并、加链接。人可以改，但改完要在 log 里记一笔。 |
| 规则 | `AGENTS.md` `CLAUDE.md` `GEMINI.md` `templates/` `prompts/` `.claude/` | 人和 AI 一起定 | 改规则 = 改宪法，必须在 log 里写 `schema` 条目并说明理由。 |

另外三个目录：`outputs/`（问答、报告、体检结果，给人看的成品）、`canvas/`（白板）、`bases/`（数据库视图）。

## 2. wiki 里的页面类型

每一页都是一个 `.md` 文件，**文件名 = 页面标题 = 双链名**。标题用名词短语，不带书名号和标点，不超过 14 个字。

| type | 目录 | 放什么 | 必填属性 |
| --- | --- | --- | --- |
| `concept` 概念页 | `wiki/concepts/` | 一个方法、规则、指标、术语 | title, type, aliases, tags, sources, related, confidence, created, updated |
| `entity` 实体页 | `wiki/entities/` | 人（脱敏）、平台、机构、产品、工具 | title, type, kind, aliases, tags, related |
| `source` 摘要页 | `wiki/sources/` | 一份 raw 资料的摘要，**一份资料对应一页**，页名 `摘要-资料名` | title, type, raw, tags |
| `comparison` 对比页 | `wiki/comparisons/` | 两个容易混的东西放一张表里比 | title, type, related |
| `synthesis` 综合页 | `wiki/synthesis/` | 跨多份资料得出的结论、复盘、总览 | title, type, sources |
| `question` 问题页 | `wiki/questions/` | 资料里没有答案、需要人补的事 | title, type, status（open / answered） |
| `lesson` 课程页 | `wiki/lessons/` | 一节课：目标、出关标准、用到的概念、练习 | title, type, lesson_no, goal, pass |
| `data` 数据记录 | `wiki/data/<数据集>/` | 一行数据一页（场次、打法卡、人群），供 Bases 做表 | title, type, dataset + 数据字段 |

属性写在文件开头的 YAML 里（Obsidian「属性」面板会显示）。**属性名一律用英文小写**（Bases 公式要用），显示名在 `.base` 里用 `displayName` 翻成中文。

页面正文固定骨架（概念页）：

```markdown
# 标题

> [!abstract] 一句话
> 用一句人话说清楚它是什么。

## 要点
## 怎么用
## 常见错误
## 出处      ← 每条都链到 wiki/sources 里的摘要页
## 相关      ← 3–8 个双链
```

## 3. 三个操作

### 3.1 录入（ingest）——有新资料放进 raw 时

1. 读新文件全文。一次只处理一份，处理完再下一份。
2. 在 `wiki/sources/` 写 `摘要-资料名.md`：来源、日期、5–10 条要点、每条要点能落到哪个概念页。
3. 找出资料里的概念和实体：
   - 已有页面 → **更新**它（加要点、加出处、改 `updated` 日期），不要新建同义页。
   - 没有页面 → 按 `templates/` 新建。
   - 同义词 → 写进已有页面的 `aliases`，不要新建页。
4. 和已有内容**冲突**时：两个说法都保留，写明各自出处，在页面里加 `> [!warning] 冲突`，并在 `wiki/questions/` 开一个问题页。不许悄悄覆盖。
5. 更新 `wiki/index.md`（新页面要进索引，一句话摘要）。
6. 在 `wiki/log.md` **末尾追加**：`## [YYYY-MM-DD] ingest | 资料名`，下面列出新建和修改的页面。
7. 一份资料通常会动 5–15 个页面。这是正常的，这正是维基值钱的地方。

### 3.2 提问（query）——人问问题时

1. 先读 `wiki/index.md`，找到相关页面，再读页面，必要时再回 raw 核对原文。
2. 回答要带双链出处（`[[页面]]`），说清哪些是资料原话、哪些是推算。
3. 答案有长期价值 → 存到 `outputs/YYYY-MM-DD-问题.md`，并把结论回写进相关概念页（知识复利）。
4. 在 log 追加：`## [YYYY-MM-DD] query | 问题`。

### 3.3 体检（lint）——每周一次，或录入 5 份资料以后

逐项检查，结果写进 `outputs/体检报告-YYYY-MM-DD.md`：

- **冲突**：两页说法矛盾（数字、规则、定义）。
- **过时**：新资料推翻了旧结论，旧页没改。
- **孤立页**：没有任何页面链接它。
- **断链**：`[[链接]]` 指向不存在的页面。
- **缺页**：多次被提到、却没有自己页面的概念。
- **缺口**：重要问题资料里没有答案 → 开问题页，写「未知」。
- **越权**：有没有 wiki 页面把 raw 没说过的话写成了事实。

在 log 追加：`## [YYYY-MM-DD] lint | 第 N 次体检`，写上各项数量。

## 4. 写作规则

1. **讲人话**。短句。一句只说一件事。少用「赋能、抓手、闭环、心智」这类词。
2. **每个事实都能追到 raw**。页面「出处」一节列摘要页，摘要页再指回 raw 原文。
3. **推算要标「推算」**，写清口径和公式；预测不写成事实。
4. 数字写全：单位、日期、口径、来源。「超 5 万亿元（经济日报，2025 年）」而不是「5 万亿」。
5. 双链只链**已存在或马上要建**的页面；建不了就先开问题页。
6. 不写营销腔、不夸大、不用最高级形容词。
7. 日期一律 `YYYY-MM-DD`。

## 5. 本领域的专门规则（按需填写，示例）

1. **隐私**：人名是否脱敏、哪些信息不能进 wiki。
2. **合规 / 专业红线**：本领域有哪些不能说、不能写的内容。
3. **数据口径**：本领域核心指标怎么定义。
4. **样本说明**：数据量小的时候，规律要标「待验证」。
5. **没有答案就写「未知」**：不编造。开问题页，等人来补。

## 6. 禁止事项

- 改动、删除、重命名 `raw/` 里的任何文件。
- 编造数字、编造出处、编造人说过的话。
- 把推算写成事实。
- 一次录入就重写整个维基；只改和新资料有关的页面。
- 删除 log 里的旧条目（log 只追加）。

## 7. 工具

- `.claude/skills/`：obsidian-skills（obsidian-markdown、obsidian-bases、json-canvas、obsidian-cli、defuddle、knap）+ `llm-wiki` 技能。
- `.claude/commands/`：`/ingest`、`/query`、`/lint`。
- `templates/`：新建页面时照着填。
- `prompts/`：可以直接复制粘贴给任何 AI 的指令。
