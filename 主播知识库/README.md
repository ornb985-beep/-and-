# 主播知识库 · 第二大脑

> 一个关于「主播训练与直播运营」的、会自我进化的知识库。
> 用 Obsidian 看，用 AI 维护，方法来自 Andrej Karpathy 的 LLM Wiki：**原始资料只读，AI 持续编写和维护一个互相链接的维基，每次录入和提问都让它更完整。**

**从这里开始**：用 Obsidian 打开本文件夹 → 看 `wiki/synthesis/成交方程式-总览.md` → 左侧栏打开「关系图谱」。

```
主播知识库/
├── AGENTS.md          ← 给 AI 的规则（所有 AI 通用）
├── CLAUDE.md          ← Claude Code 入口（导入 AGENTS.md）
├── GEMINI.md          ← Gemini CLI 入口
├── raw/               ← 原始资料，只读：内部资料 / 公开数据 / 方法论
├── wiki/              ← AI 维护的维基
│   ├── index.md       ← 分类索引（每次录入都更新）
│   ├── log.md         ← 操作日志（只追加）
│   ├── concepts/      ← 概念页
│   ├── entities/      ← 实体页
│   ├── sources/       ← 摘要页（一份资料一页）
│   ├── comparisons/   ← 对比页
│   ├── synthesis/     ← 综合页（总览、三次失败复盘）
│   ├── lessons/       ← 课程页（第0–9课，对应教学动画）
│   ├── questions/     ← 待定问题
│   └── data/          ← 场次 / 打法卡 / 人群（一行一页，给数据库视图用）
├── outputs/           ← 问答、报告、体检结果
├── canvas/            ← 白板（可拖拽的关系图）
├── bases/             ← 数据库视图（表格、卡片、分组、公式）
├── templates/         ← 新页面模板
├── prompts/           ← 可以直接复制给 AI 的指令
└── .claude/           ← obsidian-skills 技能包 + llm-wiki 技能 + 快捷命令
```

下面从原子级环节拆开讲：**如何从无到有搭一个能自我进化的第二大脑**。

## 一、准备容器（10 分钟）

1. 下载安装 Obsidian：<https://obsidian.md/download>（Windows / macOS / Linux / iOS / Android 都有，免费）。
2. 打开 Obsidian →「打开本地仓库」→ 选中本文件夹（`主播知识库`）。已经建好的结构：
   - `raw/`：原始资料（只读）
   - `wiki/`：AI 整理后的知识库
   - 另有 `outputs/` `canvas/` `bases/` `templates/` `prompts/`
3. 配同步（多台设备看到同一份文件）：
   - **苹果全家（Mac + iPhone/iPad）**：把整个仓库文件夹放进 `iCloud 云盘 / Obsidian` 目录里。iPhone 上的 Obsidian 只能读这个位置的仓库。
   - **Windows**：把仓库放进 OneDrive 文件夹，右键仓库文件夹 →「始终保留在此设备上」，否则文件只是占位符，AI 读不到内容。
   - **Windows + iPhone 混用**：iCloud for Windows 或官方 Obsidian Sync（付费、最省心）二选一。
   - 同一个仓库**只用一种同步方式**，两种同时开会产生「冲突副本」。
   - 想要版本历史：再加一层 Git（本仓库就是用 Git 管理的）。

## 二、接通 AI 的手脚（10 分钟）

1. 安装 Claude Code（在终端里操作你笔记的 AI 助手）：
   - macOS / Linux / WSL：`curl -fsSL https://claude.ai/install.sh | bash`
   - Windows PowerShell：`irm https://claude.ai/install.ps1 | iex`
   - 或者用 npm（需要 Node.js 18+）：`npm install -g @anthropic-ai/claude-code`
2. 终端进入仓库目录，输入 `claude` 启动，第一次按提示登录。
3. 安装 obsidian-skills（教 AI 正确写 Obsidian 的双链、属性、白板、数据库）。**本仓库已经装好了**，在 `.claude/skills/`。自己的新仓库三选一：
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
3. 本仓库已经初始化完成：概念页 83 · 实体页 22 · 摘要页 18 · 对比页 7 · 综合页 4 · 课程页 10 · 问题页 5 · 数据记录 41。

## 四、往里灌资料（每天）

1. **网页文章**：装 Obsidian Web Clipper 浏览器插件（<https://obsidian.md/clipper>，Chrome / Edge / Safari / Firefox 都有）。设置里把保存位置改成 `raw/`，看到好文章点一下，正文就变成 Markdown 存进来。
2. **视频**：同一个插件在 YouTube 等视频页会抓标题、简介和**带时间戳的字幕**，一起存成 Markdown。国内视频平台字幕抓不到时，用剪映 / 飞书妙记导出文字稿再放进 `raw/`。
3. **复杂网页**（要登录、要点开、要翻页的）：让 Claude Code 用浏览器插件（Claude in Chrome）直接操作页面，指令例：「打开这个页面，把正文和表格提取出来，存成 Markdown 放进 raw/公开数据/」。
4. **自己的资料**：复盘记录、话术稿、会议纪要、截图 → 直接拖进 `raw/`（图片放 `raw/附件/`）。
5. 文件名建议：`来源-标题-日期.md`，例如 `经济日报-直播电商贡献电子商务80%增量-2026-03-02.md`。

## 五、触发整理（每次放完新资料）

在 Claude Code 里输入 `/ingest`（或粘贴 `prompts/02-录入新资料.md`）。AI 会：

1. 读新文件 → 写一页摘要
2. 更新相关的概念页和实体页（一份资料通常动 5–15 页）
3. 发现冲突就标出来，不悄悄覆盖
4. 更新 `index.md`，在 `log.md` 末尾记一笔

## 六、提问（随时）

输入 `/query 你的问题`（或用 `prompts/03-提问.md`）。例：
- 「主播A 转化率低的时候，最该先改哪一处？」
- 「给投资人讲这套训练的经济价值，三句话怎么说？」
好答案会存进 `outputs/`，结论回写到维基——**问得越多，库越聪明**。

## 七、体检（每周一次）

输入 `/lint`（或用 `prompts/04-体检.md`）。AI 查冲突、过时、孤立页、断链、缺口，报告存进 `outputs/体检报告-日期.md`。

## 八、怎么看（可视化、可交互）

- **图谱**：左侧栏「打开关系图谱」。颜色：白=综合、橙=课程、金=概念、紫=对比、蓝=实体、灰=摘要、红=问题。
- **白板**：`canvas/` 里的四张图（总览、五道门、训练路线图、知识库结构），可拖拽、可点开。
- **数据库**：`bases/` 里的表（场次数据、打法卡、人群、概念库），可筛选、分组、排序、算达成率。
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

## 十、这个库里现在有什么

- 7 份内部资料（面试与培训 SOP、主播A 19 场复盘、老板点评、SPM 操盘系统、复盘教练台、规则库、波动作战室）
- 6 份公开数据（经济日报、网经社、国家统计局、中国网络视听报告、网络主播新职业报告、艾媒视频号画像）
- 2 份方法论（Karpathy LLM Wiki、obsidian-skills）
- 第一次体检报告：`outputs/体检报告-2026-09-26.md`

想在别的领域再搭一个？复制上一级目录里的 `第二大脑-空白框架/`，把 `【你的领域】` 换成你的主题就行。

---

*隐私说明：本仓库公开，所有人名均已脱敏，内部系统链接已删除。*
