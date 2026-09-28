# 第二大脑 · 空白框架

> 一个可以直接复制使用的空知识库骨架，方法来自 Andrej Karpathy 的 LLM Wiki。
> **换什么 AI 都能用**（Claude Code、Codex、Gemini CLI、Cursor、网页版 ChatGPT / Kimi / 豆包 / DeepSeek），**换什么领域都能用**。

## 三分钟上手

1. 把整个 `第二大脑-空白框架/` 文件夹复制一份，改成你的名字（例如 `选品知识库/`）。
2. 打开 `AGENTS.md`，把 `【你的领域】` 换成你的主题，填好第 0 节和第 5 节。
3. 用 Obsidian「打开本地仓库」选中这个文件夹。
4. 往 `raw/资料/` 里放资料（文章、复盘、会议纪要、Web Clipper 剪藏）。
5. 在 AI 里粘贴 `prompts/01-初始化知识库.md`，它会把 raw 整理成维基。
6. 以后每次放新资料：`/ingest`；想问问题：`/query 问题`；每周：`/lint`。

```
第二大脑-空白框架/
├── AGENTS.md          ← 规则（所有 AI 通用；先填【你的领域】）
├── CLAUDE.md          ← Claude Code 入口（一行 @AGENTS.md）
├── GEMINI.md          ← Gemini CLI 入口
├── raw/资料/          ← 原始资料，只读
├── raw/附件/          ← 图片、PDF
├── wiki/              ← AI 维护的维基（index.md + log.md + 七个子目录）
├── outputs/           ← 问答、报告、体检结果
├── templates/         ← 概念页 / 实体页 / 摘要页 / 对比页 / 综合页 / 问题页 / 课程页
├── prompts/           ← 01 初始化 · 02 录入 · 03 提问 · 04 体检 · 05 从零搭建
├── 知识库结构.canvas   ← 方法示意白板
└── .claude/           ← obsidian-skills + llm-wiki 技能 + /ingest /query /lint 命令
```

下面是完整的原子级步骤。

## 一、准备容器（10 分钟）

1. 下载安装 Obsidian：<https://obsidian.md/download>（Windows / macOS / Linux / iOS / Android 都有，免费）。
2. 打开 Obsidian →「打开本地仓库」→ 选中本文件夹（`你复制出来的文件夹`）。已经建好的结构：
   - `raw/`：原始资料（只读）
   - `wiki/`：AI 整理后的知识库
   - 另有 `outputs/` `canvas/` `bases/` `templates/` `prompts/`
3. 配同步（多台设备看到同一份文件）：
   - **苹果全家（Mac + iPhone/iPad）**：把整个仓库文件夹放进 `iCloud 云盘 / Obsidian` 目录里。iPhone 上的 Obsidian 只能读这个位置的仓库。
   - **Windows**：把仓库放进 OneDrive 文件夹，右键仓库文件夹 →「始终保留在此设备上」，否则文件只是占位符，AI 读不到内容。
   - **Windows + iPhone 混用**：iCloud for Windows 或官方 Obsidian Sync（付费、最省心）二选一。
   - 同一个仓库**只用一种同步方式**，两种同时开会产生「冲突副本」。
   - 想要版本历史：再加一层 Git。

## 二、接通 AI 的手脚（10 分钟）

1. 安装 Claude Code（在终端里操作你笔记的 AI 助手）：
   - macOS / Linux / WSL：`curl -fsSL https://claude.ai/install.sh | bash`
   - Windows PowerShell：`irm https://claude.ai/install.ps1 | iex`
   - 或者用 npm（需要 Node.js 18+）：`npm install -g @anthropic-ai/claude-code`
2. 终端进入仓库目录，输入 `claude` 启动，第一次按提示登录。
3. 安装 obsidian-skills（教 AI 正确写 Obsidian 的双链、属性、白板、数据库）。**本框架已经装好了**，在 `.claude/skills/`。自己的新仓库三选一：
   - 在 Claude Code 里输入：`/plugin marketplace add kepano/obsidian-skills`，再输入 `/plugin install obsidian@obsidian-skills`
   - 或在终端：`npx skills add https://github.com/kepano/obsidian-skills`
   - 或手动：`git clone https://github.com/kepano/obsidian-skills.git`，把里面的 `skills/` 文件夹复制到仓库的 `.claude/skills/`
4. 装完输入 `/reload-plugins`（或退出后重新输入 `claude`）让技能生效。输入 `/skills` 能看到列表就说明装好了。

## 三、初始化知识库（一次）

1. 在 Claude Code 输入框粘贴 `prompts/01-初始化知识库.md` 里的整段指令（它会让 AI 学习 obsidian-skills，按 Karpathy 方法建库，末尾带 `ultrathink` 让模型深度思考）。
2. AI 会自动扫描 `raw/` 里的所有文件，生成：
   - **概念页**（`wiki/concepts/`）：方法、规则、指标
   - **实体页**（`wiki/entities/`）：人、平台、机构、工具
   - **摘要页**（`wiki/sources/`）：每份资料一页
   - **index.md**（分类索引）和 **log.md**（操作日志）
3. 空白框架里 `wiki/` 只有空的 index 和 log，第一次运行后才会长出页面。

## 四、往里灌资料（每天）

1. **网页文章**：装 Obsidian Web Clipper 浏览器插件（<https://obsidian.md/clipper>，Chrome / Edge / Safari / Firefox 都有）。设置里把保存位置改成 `raw/`，看到好文章点一下，正文就变成 Markdown 存进来。
2. **视频**：同一个插件在 YouTube 等视频页会抓标题、简介和**带时间戳的字幕**，一起存成 Markdown。国内视频平台字幕抓不到时，用剪映 / 飞书妙记导出文字稿再放进 `raw/`。
3. **复杂网页**（要登录、要点开、要翻页的）：让 Claude Code 用浏览器插件（Claude in Chrome）直接操作页面，指令例：「打开这个页面，把正文和表格提取出来，存成 Markdown 放进 raw/资料/」。
4. **自己的资料**：复盘记录、话术稿、会议纪要、截图 → 直接拖进 `raw/`（图片放 `raw/附件/`）。
5. 文件名建议：`来源-标题-日期.md`，例如 `某报-某主题-2026-01-01.md`。

## 五、触发整理（每次放完新资料）

在 Claude Code 里输入 `/ingest`（或粘贴 `prompts/02-录入新资料.md`）。AI 会：

1. 读新文件 → 写一页摘要
2. 更新相关的概念页和实体页（一份资料通常动 5–15 页）
3. 发现冲突就标出来，不悄悄覆盖
4. 更新 `index.md`，在 `log.md` 末尾记一笔

## 六、提问（随时）

输入 `/query 你的问题`（或用 `prompts/03-提问.md`）。例：
- 「这批资料里最重要的三个结论是什么？」
- 「A 和 B 两种做法有什么区别？各适合什么情况？」
好答案会存进 `outputs/`，结论回写到维基——**问得越多，库越聪明**。

## 七、体检（每周一次）

输入 `/lint`（或用 `prompts/04-体检.md`）。AI 查冲突、过时、孤立页、断链、缺口，报告存进 `outputs/体检报告-日期.md`。

## 八、怎么看（可视化、可交互）

- **图谱**：左侧栏「打开关系图谱」。颜色分组已配好：白=综合、金=概念、紫=对比、蓝=实体、灰=摘要、红=问题、青=数据。
- **白板**：`知识库结构.canvas` 是方法示意；让 AI 用 json-canvas 技能给你的主题画新白板。
- **数据库**：让 AI 用 obsidian-bases 技能给表格型数据建 `.base` 视图，可筛选、分组、排序、写公式。
- **书签**：左侧栏书签里放了最常用的入口。

## 九、换别的 AI 用

规则写在 `AGENTS.md`，这是各家 AI 助手通用的约定文件名：

| AI | 怎么读规则 |
| --- | --- |
| Claude Code | 读 `CLAUDE.md`（里面一行 `@AGENTS.md` 把规则导入） |
| OpenAI Codex / Cursor / 多数 Agent | 直接读 `AGENTS.md` |
| Gemini CLI | 读 `GEMINI.md`（同样指向 `AGENTS.md`） |
| 网页版 ChatGPT / Kimi / 豆包 / DeepSeek | 把 `AGENTS.md` 和 `prompts/` 里的指令一起粘贴进对话，再上传要处理的文件 |

技能（`.claude/skills/`）遵循 Agent Skills 开放规范，Codex 等工具也能用：复制到 `~/.codex/skills/`。

## 为什么叫「会自我进化」

- 你每放一份资料，AI 会更新 5–15 个相关页面，而不是只多一份文件。
- 你每问一个好问题，答案会存回维基，下一次回答就站在它上面。
- 每周体检，AI 会自己找出矛盾、断链和缺口，并提醒你补资料。

维护知识库最累的部分（改链接、改摘要、保持一致）对 AI 几乎是零成本，所以它不会像人手写的笔记那样慢慢荒废。

*这个空白框架从「主播知识库」复制而来，去掉了全部领域内容，只保留结构、规则、模板、提示词和技能。*
