# 成交方程式 · 主播训练体系

> 讲到你自己都想买，你就讲对了。

一套给视频号珠宝饰品直播间用的主播训练体系：一本训练手册、13 支动态影片、一个 Obsidian 知识库（附空白框架）、两套幻灯片。所有主播数据来自公司自己的复盘记录（已脱敏），所有市场数字都有出处，推算的数字标了「推算」，不知道的写「未知」。

## 在线打开

下面四个链接是 claude.ai 上的私有页面，只有所有者能打开；要给学员或投资人看，先在页面右上角的「分享」菜单里分享。

| 页面 | 给谁 | 链接 |
| --- | --- | --- |
| 影片与训练文档（完整版、投资人版、15 秒版、第 0–9 课动画 + 手册全文） | 所有人 | <https://claude.ai/artifact/SHzYL92cgqLjky17FidRbB> |
| 主播知识库 · 交互图谱（213 页，同心图谱、阅读器、三条导览） | 团队 | <https://claude.ai/artifact/5pmYWe2raA7bJ8A1Kax5F6> |
| 学员课件（21 页，带讲师备注，可导出 PPTX / PDF） | 主播、带教 | <https://claude.ai/artifact/V3mCNTGEdkv9gMV82ofwwc> |
| 投资人简报（12 页，可导出 PPTX / PDF） | 投资人 | <https://claude.ai/artifact/NqJ97YBvss9S6YcPVMynKv> |

## 仓库里有什么

| 路径 | 内容 |
| --- | --- |
| `docs/主播训练体系.md` | 训练手册 v1.0：三次失败给的理由、七层体系、训练路线、给运营的每日动作、经济价值、未知和待定 |
| `dist/video/01-完整版-成交方程式.mp4` | 完整版影片，3:22 |
| `dist/video/02-投资人版.mp4` | 投资人版，1:36 |
| `dist/video/03-15秒版.mp4` | 15 秒版 |
| `dist/video/lessons/第0课…第9课.mp4` | 分阶段教学动画，每课 51–59 秒 |
| `dist/showreel/index.html` | 影片网页播放器 + 手册全文（配乐在 `dist/showreel/audio/`） |
| `dist/kb/index.html` | 知识库交互图谱（单文件） |
| `主播知识库/` | Obsidian 仓库：用 Obsidian「打开本地仓库」选中它。说明见里面的 `README.md` |
| `第二大脑-空白框架/` | 同一套结构的空白版，换领域、换 AI 都能用 |
| `showreel/` | 动画引擎、场景、配乐合成、逐帧渲染脚本 |
| `tools/kb/` | 知识库编译器（`build.py`）和交互图谱生成器（`explorer.py`） |

所有影片都是 1920×1080、30 帧、H.264 + AAC。网页播放和 MP4 用的是同一套代码，逐帧一致。

## 七层体系一页看懂

| 层 | 解决什么 | 一句话 |
| --- | --- | --- |
| 1 底层方程 | 钱从哪来 | GMV = UV × UV价值 |
| 2 五道门 | 她为什么买 | 需求 → 价值 → 福利 → 信任 → 稀缺 |
| 3 讲品六步 | 一款怎么讲 | 痛点 → 卖点 → 场景 → 福利 → 质保 → 逼单 |
| 4 逼单四要素 | 怎么收口 | 价值 · 比价 · 保障 · 稀缺 |
| 5 节奏 | 一场怎么排 | 钩子留人 → 憋 → 放 → 逼 → 预告 |
| 6 数据 | 怎么越播越好 | 每轮记五个数，每场只改一处 |
| 7 播法 | 你是谁 | 强项放大，弱项补到及格 |

## 重新生成

需要 Python 3（`numpy` `scipy` `fonttools` `markdown` `pyyaml` `imageio-ffmpeg`）和 Node 18+（`playwright`，带 Chromium）。

```bash
python3 showreel/build.py                 # 网页播放器和渲染页（首次运行会下载字体）
node showreel/timings.mjs                 # 导出每支影片的时间点
python3 showreel/audio.py                 # 按时间点合成配乐
bash showreel/render-all.sh               # 逐帧渲染全部 MP4

git clone https://github.com/kepano/obsidian-skills.git /tmp/obsidian-skills
OBSIDIAN_SKILLS=/tmp/obsidian-skills python3 tools/kb/build.py   # 编译知识库，并检查断链和孤立页
python3 tools/kb/explorer.py              # 生成知识库交互图谱
```

改了训练内容，按这个顺序改：先改 `docs/主播训练体系.md` 和 `tools/kb/` 里的页面内容，再改 `showreel/src/` 里的动画，最后重新生成。

## 隐私与出处

- 仓库是公开的：主播、主管、候选人的名字都已脱敏，内部系统链接已删除。
- 市场数字的出处写在手册第 13 节和知识库的摘要页里；知识库每一页都能追到 `主播知识库/raw/` 里的原文。
- 推算只用来说明杠杆大小，不是承诺，也不是预测。
