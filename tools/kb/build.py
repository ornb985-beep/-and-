#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""编译「主播知识库」Obsidian 仓库（Karpathy LLM Wiki 方法）并生成空白框架。

用法：python3 tools/kb/build.py
- 读 raw/（已放好的原始资料，不改动）
- 写 wiki/（概念、实体、摘要、对比、综合、课程、问题、数据）+ index.md + log.md
- 写 canvas/、bases/、templates/、prompts/、.obsidian/、AGENTS.md、CLAUDE.md、README.md
- 复制 obsidian-skills 到 .claude/skills/（需要 OBSIDIAN_SKILLS 指向克隆目录）
- 生成「第二大脑-空白框架」
- 最后做一次链接体检，打印所有指向不存在页面的链接
"""
import json
import os
import pathlib
import re
import shutil
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from content_concepts import CONCEPTS  # noqa: E402
from content_other import (CARDS, COMPARISONS, CROWDS, ENTITIES, FAILURES, LESSON_VIDEO, LESSONS,  # noqa: E402
                           QUESTIONS, SESSIONS, SOURCES)
from vault_text import (AGENTS_MD, BLANK_AGENTS_MD, BLANK_README, CLAUDE_MD, COMMANDS, GEMINI_MD, LLM_WIKI_SKILL,  # noqa: E402
                        PROMPTS, README_MD, TEMPLATES, USAGE_PAGE, lint_report)
import content_market as M  # noqa: E402  (2026-09-28 录入：市场与竞争)

SOURCES.update(M.SOURCES_MKT)
ENTITIES += M.ENTITIES_MKT
COMPARISONS += M.COMPARISONS_MKT
QUESTIONS += M.QUESTIONS_MKT
INGEST2 = "2026-09-28"
NEW_TITLES = ({c["title"] for c in CONCEPTS if M.TAG in c["tags"]} | {v[0] for v in M.SOURCES_MKT.values()}
              | {e[0] for e in M.ENTITIES_MKT} | {x[0] for x in M.COMPARISONS_MKT} | {x[0] for x in M.QUESTIONS_MKT}
              | {M.OVERVIEW_TITLE})


def born(title):
    """页面的创建日期：第二次录入新建的页面记 2026-09-28。"""
    return INGEST2 if title in NEW_TITLES else TODAY

REPO = HERE.parent.parent
VAULT = REPO / "主播知识库"
BLANK = REPO / "第二大脑-空白框架"
TODAY = "2026-09-26"
SKILLS_SRC = pathlib.Path(os.environ.get("OBSIDIAN_SKILLS", ""))


# ------------------------------------------------------------------ helpers
def q(s):
    return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'


def frontmatter(d):
    out = ["---"]
    for k, v in d.items():
        if v is None or v == [] or v == "":
            continue
        if isinstance(v, bool):
            out.append(f"{k}: {'true' if v else 'false'}")
        elif isinstance(v, (int, float)):
            out.append(f"{k}: {v}")
        elif isinstance(v, (list, tuple)):
            out.append(f"{k}:")
            out.extend(f"  - {q(x)}" for x in v)
        else:
            out.append(f"{k}: {q(v)}")
    out.append("---")
    return "\n".join(out) + "\n"


def link(t):
    return f"[[{t}]]"


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def bullets(items):
    return "\n".join(f"- {x}" for x in items)


def table(rows):
    head, body = rows[0], rows[1:]
    s = "| " + " | ".join(head) + " |\n| " + " | ".join("---" for _ in head) + " |\n"
    s += "\n".join("| " + " | ".join(r) + " |" for r in body)
    return s


PAGES = {}  # title -> (relative path, type, lead)


def page(folder, title, ptype, lead, fm, body):
    rel = f"wiki/{folder}/{title}.md" if folder else f"wiki/{title}.md"
    PAGES[title] = (rel, ptype, lead)
    write(VAULT / rel, frontmatter(fm) + "\n" + body.strip() + "\n")


SRC_TITLE = {k: v[0] for k, v in SOURCES.items()}
# 口述原话是体系的起点：这些概念页都要能追到 raw/内部资料/训练思路-口述
USER_CITES = {"五道门", "需求门", "价值门", "福利门", "信任门", "稀缺门", "讲品六步", "痛点", "卖点", "场景", "逼单四要素", "价值锚定",
              "比价", "保障", "真实稀缺", "两分钟逼一次单", "憋单框架", "钩子品", "拉新", "逼单", "讲到自己都想买", "塑品",
              "为什么买与为什么不买", "人货场", "产品拆解卡", "客群画像", "拆解七步", "每轮五个数", "诊断规则", "播法类型"}
GUIDE_CITES = {"LLM Wiki方法", "第二大脑三操作"}
for _c in CONCEPTS:
    if _c["title"] in USER_CITES and "USER" not in _c["src"]:
        _c["src"] = ["USER"] + list(_c["src"])
    if _c["title"] in GUIDE_CITES and "GUIDE" not in _c["src"]:
        _c["src"] = list(_c["src"]) + ["GUIDE"]
# 摘要页 → 它涉及的人、系统、机构（实体页的入链）
SOURCE_ENTITY = {"SOP": ["有经验候选人"], "REV": ["主播A", "主管C", "珊瑚海", "视频号"], "BOSS": ["老板", "主播A"],
                 "SPM": ["SPM操盘系统", "抖音", "头部直播间"], "AUDIT": ["复盘教练台", "SPM操盘系统", "头部直播间"],
                 "RULES": ["复盘教练台", "老板"], "WAR": ["主播波动作战室", "老板"], "JJRB": ["经济日报"], "WJS": ["网经社", "视频号", "抖音"],
                 "NBS": ["国家统计局"], "NVSA": ["中国网络视听节目服务协会"], "CAPA": ["中国演出行业协会网络表演分会"], "IIM": ["视频号"],
                 "KARP": ["Andrej Karpathy", "Obsidian", "Obsidian Web Clipper"], "OSK": ["obsidian-skills", "Obsidian", "Claude Code"],
                 "GUIDE": ["Obsidian", "Claude Code", "obsidian-skills", "Obsidian Web Clipper"], "HB": ["成交方程式影片"],
                 "GAC": ["中国珠宝玉石首饰行业协会"], "IIM25": ["艾媒咨询"], "IIM24": ["艾媒咨询"], "YIWU": ["义乌饰品产业带"],
                 "PAN": ["潘多拉"], "WXR": ["视频号"], "DYR": ["抖音"], "GOLD": ["周大福"], "D11": ["南奢", "周大福", "蝉妈妈"],
                 "SPH23": ["视频号"], "NEWB": ["范琦", "戴拉珠宝", "礼兰珠宝"], "APM": ["APM Monaco"], "QIC": ["抖音"],
                 "TOOLS": ["蝉妈妈", "飞瓜数据", "友望数据"]}
SOURCE_ENTITY["IIM"] = ["视频号", "艾媒咨询"]
LAYER_NAME = {1: "底层方程", 2: "五道门", 3: "讲品六步", 4: "逼单四要素", 5: "节奏", 6: "数据", 7: "播法"}
LAYER_PAGE = {1: "底层方程", 2: "五道门", 3: "讲品六步", 4: "逼单四要素", 5: "憋单框架", 6: "每轮五个数", 7: "播法类型"}


# ------------------------------------------------------------------ wiki pages
def build_concepts():
    for c in CONCEPTS:
        srcs = [link(SRC_TITLE[s]) for s in c["src"]]
        fm = {"title": c["title"], "type": "concept", "aliases": c["al"], "tags": ["概念"] + c["tags"],
              "layer": c["layer"], "lesson": link(c["lesson"]) if c["lesson"] else None, "sources": srcs,
              "related": [link(r) for r in c["rel"]], "confidence": c["conf"], "created": born(c["title"]), "updated": born(c["title"])}
        body = f"# {c['title']}\n\n> [!abstract] 一句话\n> {c['lead']}\n"
        if c["layer"]:
            hub = LAYER_PAGE[c["layer"]]
            body += f"\n所在层级：第 {c['layer']} 层 · {LAYER_NAME[c['layer']]}"
            body += "（本页是这一层的主页面）" if hub == c["title"] else f" · 主页面 {link(hub)}"
            if c["lesson"]:
                body += f" · 对应课程：{link(c['lesson'])}"
            body += "\n"
        if c["pts"]:
            body += "\n## 要点\n\n" + bullets(c["pts"]) + "\n"
        if c["use"]:
            body += "\n## 怎么用\n\n" + bullets(c["use"]) + "\n"
        if c["bad"]:
            body += "\n## 常见错误\n\n" + bullets(c["bad"]) + "\n"
        body += "\n## 出处\n\n" + bullets(srcs) + "\n"
        if c["rel"]:
            body += "\n## 相关\n\n" + " · ".join(link(r) for r in c["rel"]) + "\n"
        page("concepts", c["title"], "concept", c["lead"], fm, body)


def build_sources():
    for key, (title, raw, lead, pts) in SOURCES.items():
        cited = [c["title"] for c in CONCEPTS if key in c["src"]]
        fm = {"title": title, "type": "source", "tags": ["摘要"], "raw": raw, "created": born(title), "updated": born(title)}
        rawlink = f"[[{raw[:-3]}|{pathlib.Path(raw).stem}]]"
        body = f"# {title}\n\n> [!info] 原文\n> {rawlink}\n\n{lead}\n\n## 要点\n\n{bullets(pts)}\n"
        if SOURCE_ENTITY.get(key):
            body += "\n## 涉及\n\n" + " · ".join(link(t) for t in SOURCE_ENTITY[key]) + "\n"
        if cited:
            body += "\n## 引用它的页面\n\n" + " · ".join(link(t) for t in cited) + "\n"
        page("sources", title, "source", lead, fm, body)


def build_entities():
    for name, kind, lead, pts, rel, al in ENTITIES:
        fm = {"title": name, "type": "entity", "kind": kind, "aliases": al, "tags": ["实体", kind.split("（")[0]],
              "related": [link(r) for r in rel], "created": born(name), "updated": born(name)}
        body = f"# {name}\n\n> [!abstract] {kind}\n> {lead}\n"
        if pts:
            body += "\n## 要点\n\n" + bullets(pts) + "\n"
        if rel:
            body += "\n## 相关\n\n" + " · ".join(link(r) for r in rel) + "\n"
        page("entities", name, "entity", lead, fm, body)


def build_comparisons():
    for title, lead, rows, notes, rel in COMPARISONS:
        fm = {"title": title, "type": "comparison", "tags": ["对比"], "related": [link(r) for r in rel], "created": born(title), "updated": born(title)}
        body = f"# {title}\n\n> [!abstract] 一句话\n> {lead}\n\n{table(rows)}\n"
        if notes:
            body += "\n" + bullets(notes) + "\n"
        body += "\n## 相关\n\n" + " · ".join(link(r) for r in rel) + "\n"
        page("comparisons", title, "comparison", lead, fm, body)


def build_failures():
    for title, lead, facts, rules, srcs in FAILURES:
        s = [link(SRC_TITLE[k]) for k in srcs]
        fm = {"title": title, "type": "synthesis", "tags": ["失败复盘"], "sources": s, "lesson": link("第0课 为什么这样教"), "created": TODAY, "updated": TODAY}
        body = (f"# {title}\n\n> [!failure] 发生了什么\n> {lead}\n\n## 事实与原因\n\n{bullets(facts)}\n\n"
                f"## 所以体系这样定\n\n{bullets(rules)}\n\n## 出处\n\n{bullets(s)}\n")
        page("synthesis", title, "synthesis", lead, fm, body)


def build_questions():
    for title, lead, pts, status in QUESTIONS:
        fm = {"title": title, "type": "question", "status": status, "tags": ["待定"], "created": born(title), "updated": born(title)}
        body = f"# {title}\n\n> [!question] 待定\n> {lead}\n"
        if pts:
            body += "\n" + bullets(pts) + "\n"
        body += "\n本库规则：没有答案的地方写「未知」，不编（见 [[AGENTS]] 第 6 条）。\n"
        page("questions", title, "question", lead, fm, body)


def build_lessons():
    for i, (no, title, goal, passc, concepts, drills) in enumerate(LESSONS):
        name = f"第{no}课 {title}"
        fm = {"title": name, "type": "lesson", "lesson_no": no, "tags": ["课程"], "goal": goal, "pass": passc,
              "video": f"dist/video/lessons/第{no}课-{LESSON_VIDEO[no]}.mp4", "created": TODAY, "updated": TODAY}
        prev_ = f"第{no - 1}课 {LESSONS[i - 1][1]}" if i else None
        next_ = f"第{no + 1}课 {LESSONS[i + 1][1]}" if i + 1 < len(LESSONS) else None
        body = (f"# {name}\n\n> [!goal] 这一课的目标\n> {goal}\n\n> [!success] 出关标准\n> {passc}\n\n"
                f"## 这一课用到的概念\n\n" + " · ".join(link(x) for x in concepts) + "\n")
        if drills:
            body += "\n## 今天的练习（15–30 分钟）\n\n" + "\n".join(f"- [ ] {d}" for d in drills) + "\n"
        body += (f"\n## 动画\n\n分阶段教学动画：仓库 `dist/video/lessons/第{no}课-{LESSON_VIDEO[no]}.mp4`；"
                 f"网页播放器 `dist/showreel/index.html`（选「第 {no} 课」）。全部动画见 {link('成交方程式影片')}。\n")
        nav = []
        if prev_:
            nav.append(f"上一课：{link(prev_)}")
        if next_:
            nav.append(f"下一课：{link(next_)}")
        if nav:
            body += "\n" + " · ".join(nav) + "\n"
        page("lessons", name, "lesson", goal, fm, body)


def build_data():
    for mmdd, mins, gmv, shop, target, avg, peak, prods, notes in SESSIONS:
        title = f"场次-{mmdd}"
        date = f"2026-{mmdd[:2]}-{mmdd[2:]}"
        hit = (gmv >= target) if target else None
        fm = {"title": title, "type": "data", "dataset": "场次", "date": date, "anchor": link("主播A"), "platform": "视频号",
              "minutes": mins, "gmv": gmv, "shop_gmv": shop, "target": target or None, "hit": hit,
              "avg_online": avg, "peak_online": peak or None, "products": prods, "tags": ["数据/场次"]}
        verdict = "达标" if hit else ("未达标" if hit is False else "未写目标")
        body = (f"# {title}\n\n{date} · 视频号 · {link('主播A')} · {mins} 分钟 · GMV {gmv:,} 元 · {verdict}\n\n"
                f"> [!quote] 主播自述要点\n> {notes}\n\n来源：{link('摘要-主播A复盘19条')}\n")
        if mmdd == "0730":
            body += "\n用于 [[一笔真实的账]]：约 360 人进场、成交 12 人 15 件。\n"
        if mmdd == "0826":
            body += "\n用于 [[人货场]]：[[珊瑚海]]跑起来，人群精准。\n"
        page("data/场次", title, "data", f"{date} GMV {gmv}", fm, body)
    status = {1: "命中", 0: "未命中", -1: "未测"}
    for no, name, src, lvl, how, say, fail, hit in CARDS:
        title = f"打法卡{no}-{name}"
        fm = {"title": title, "type": "data", "dataset": "打法卡", "card_no": no, "card_name": name, "origin": src, "level": lvl,
              "result": status[hit], "tags": ["数据/打法卡"]}
        body = (f"# {title}\n\n| 字段 | 内容 |\n| --- | --- |\n| 来源 | {src} |\n| 适用层级 | {lvl} |\n| 怎么做 | {how} |\n"
                f"| 怎么说 | {say} |\n| 失效信号 | {fail} |\n| 在主播A 复盘上 | {status[hit]} |\n\n"
                f"来源：{link('摘要-SPM操盘系统蓝本')} · 验证：{link('摘要-复盘教练台与SPM整合')} · 见 {link('底层逻辑与打法卡')}\n")
        page("data/打法卡", title, "data", name, fm, body)
    for code, official, age, city, power, aov, pref, risk, play in CROWDS:
        title = f"人群-{code}"
        fm = {"title": title, "type": "data", "dataset": "人群", "code": code, "official": official, "age": age, "city": city,
              "power": power, "aov": aov, "risk": risk, "tags": ["数据/人群"]}
        body = (f"# {title}\n\n| 字段 | 内容 |\n| --- | --- |\n| 官方人群 | {official} |\n| 年龄 | {age} |\n| 城市 | {city} |\n"
                f"| 消费实力 | {power} |\n| 客单区间 | {aov} |\n| 偏好与决策点 | {pref} |\n| 风险档 | {risk} |\n| 打法 | {play} |\n\n"
                f"来源：{link('摘要-SPM操盘系统蓝本')}（行业初始假设值，需用罗盘真实成交画像修正）· 见 {link('八大人群')}\n")
        if "⚠" in play:
            body += f"\n> [!warning] 体检发现\n> 这一行与本库其他规则冲突，见 {link('体检报告-2026-09-26')}。\n"
        page("data/人群", title, "data", official, fm, body)


def append(title, text):
    f = VAULT / PAGES[title][0]
    f.write_text(f.read_text(encoding="utf-8").rstrip() + "\n\n" + text.strip() + "\n", encoding="utf-8")


def build_hubs():
    ses = [k for k, v in PAGES.items() if v[0].startswith("wiki/data/场次/")]
    append("主播A", "## 19 场数据\n\n" + " · ".join(link(t) for t in sorted(ses)) + "\n\n表格视图：`bases/场次数据.base`")
    cards = sorted(k for k, v in PAGES.items() if v[0].startswith("wiki/data/打法卡/"))
    append("底层逻辑与打法卡", "## 14 张打法卡\n\n" + "\n".join(f"- {link(t)}" for t in cards) + "\n\n表格视图：`bases/打法卡.base`（按命中结果分组）")
    append("打法卡", "## 全部卡片\n\n" + " · ".join(link(t) for t in cards))
    crowds = sorted(k for k, v in PAGES.items() if v[0].startswith("wiki/data/人群/"))
    append("八大人群", "## 八个人群\n\n" + " · ".join(link(t) for t in crowds) + "\n\n表格视图：`bases/人群.base`")


def build_overview():
    lead = "一页看懂：直播只有两个字——拉新、逼单；七层体系从钱从哪来，一直讲到你是谁。"
    body = f"""# 成交方程式-总览

> [!abstract] 一句话
> {lead} 判断讲得对不对只有一个标准：{link('讲到自己都想买')}。

```mermaid
flowchart LR
    A[底层方程<br/>GMV = UV × UV价值] --> B[五道门<br/>需求→价值→福利→信任→稀缺]
    B --> C[讲品六步<br/>痛点→卖点→场景→福利→质保→逼单]
    C --> D[逼单四要素<br/>价值·比价·保障·稀缺]
    D --> E[节奏<br/>钩子→憋→放→逼→预告]
    E --> F[数据<br/>每轮五个数 · 只改一处]
    F --> G[播法<br/>强项放大 · 弱项及格]
    F -. 下一场 .-> C
```

| 层 | 解决什么 | 页面 | 课程 |
| --- | --- | --- | --- |
| 1 | 钱从哪来 | {link('底层方程')} | {link('第1课 底层方程')} |
| 2 | 她为什么买 | {link('五道门')} | {link('第2课 五道门')} |
| 3 | 一款怎么讲 | {link('讲品六步')} | {link('第3课 讲品六步')} |
| 4 | 怎么收口 | {link('逼单四要素')} | {link('第4课 逼单四要素')} |
| 5 | 一场怎么排 | {link('憋单框架')} | {link('第5课 节奏')} |
| 6 | 怎么越播越好 | {link('每轮五个数')} | {link('第6课 数据')} |
| 7 | 你是谁 | {link('播法类型')} | {link('第7课 你的播法')} |

贯穿模块：{link('拆解七步')}（{link('第8课 拆解顶尖直播间')}）· {link('合规红线')}（{link('第9课 合规红线与出师')}）

为什么这样教：{link('失败1-试训半天流失')} · {link('失败2-19场4场达标')} · {link('失败3-打法卡8张未命中')}（{link('第0课 为什么这样教')}）

给投资人：{link('直播电商市场规模')} · {link('主播供给与收入')} · {link('一笔真实的账')} · {link('经济价值推算')}

市场与竞争：{link(M.OVERVIEW_TITLE)} · {link('五个市场口径')} · {link('竞品分层')} · {link('金色仿品红线')}

白板：`canvas/成交方程式-总览.canvas` · `canvas/饰品市场与竞争.canvas` · 数据库视图：`bases/场次数据.base` · `bases/竞品库.base`
"""
    fm = {"title": "成交方程式-总览", "type": "synthesis", "tags": ["总览"], "created": TODAY, "updated": INGEST2}
    page("synthesis", "成交方程式-总览", "synthesis", lead, fm, body)


def build_market_overview():
    keys = ["GAC", "DMI", "YIWU", "NBS", "IIM25", "IIM24", "SPH23", "PAN", "APM", "NEWB", "D11", "GOLD", "WXR", "DYR", "GBT", "QIC", "TOOLS", "XZS"]
    srcs = [link(SRC_TITLE[k]) for k in keys]
    fm = {"title": M.OVERVIEW_TITLE, "type": "synthesis", "tags": ["总览", M.TAG], "sources": srcs,
          "created": INGEST2, "updated": INGEST2}
    body = M.OVERVIEW_BODY.replace("{lead}", M.OVERVIEW_LEAD) + "\n## 出处\n\n" + bullets(srcs) + "\n"
    page("synthesis", M.OVERVIEW_TITLE, "synthesis", M.OVERVIEW_LEAD, fm, body)


def build_usage_page():
    fm = {"title": "知识库使用说明", "type": "overview", "tags": ["说明"], "created": TODAY, "updated": TODAY}
    page("", "知识库使用说明", "overview", "怎么用这个库：录入、提问、体检三件事。", fm, USAGE_PAGE)


# ------------------------------------------------------------------ index + log
TYPE_ORDER = [("synthesis", "综合"), ("lesson", "课程"), ("concept", "概念"), ("comparison", "对比"), ("entity", "实体"),
              ("source", "摘要（来源）"), ("question", "待定问题"), ("overview", "说明")]


def build_index():
    lines = [frontmatter({"title": "index", "type": "index", "updated": INGEST2}),
             "# 索引\n", f"> [!info] 每次录入都会更新这一页。先看 [[成交方程式-总览]] 和 [[{M.OVERVIEW_TITLE}]]，再按需往下找。\n"]
    for t, name in TYPE_ORDER:
        items = sorted([(k, v) for k, v in PAGES.items() if v[1] == t], key=lambda kv: kv[0])
        if not items:
            continue
        lines.append(f"\n## {name}（{len(items)}）\n")
        if t == "concept":
            by_layer = {}
            for k, v in items:
                cc = next(c for c in CONCEPTS if c["title"] == k)
                group = cc["layer"] or (M.TAG if M.TAG in cc["tags"] else "其他")
                by_layer.setdefault(group, []).append((k, v))
            order = lambda g: (0, g) if isinstance(g, int) else ((1, 0) if g == M.TAG else (2, 0))  # noqa: E731
            for group in sorted(by_layer, key=order):
                lines.append(f"\n### {'第 %d 层 · %s' % (group, LAYER_NAME[group]) if isinstance(group, int) else group}\n")
                for k, v in by_layer[group]:
                    lines.append(f"- {link(k)} — {short(v[2])}")
        elif t == "lesson":
            for k, v in sorted(items, key=lambda kv: int(re.search(r'第(\d+)课', kv[0]).group(1))):
                lines.append(f"- {link(k)} — {short(v[2])}")
        else:
            for k, v in items:
                lines.append(f"- {link(k)} — {short(v[2])}")
    n = {ds: sum(1 for v in PAGES.values() if v[0].startswith(f'wiki/data/{ds}/')) for ds in ('场次', '打法卡', '人群')}
    lines.append(f"\n## 数据记录\n\n- 场次 {n['场次']} 条 → `bases/场次数据.base`\n- 打法卡 {n['打法卡']} 张 → `bases/打法卡.base`\n- 人群 {n['人群']} 个 → `bases/人群.base`\n")
    lines.append("\n## 输出（outputs/）\n\n- [[2026-09-26-主播训练体系]] — 训练手册全文\n- [[体检报告-2026-09-26]] — 第一次体检\n"
                 "- [[体检报告-2026-09-28]] — 录入市场与竞争资料后的体检\n")
    lines.append("\n## 数据库视图（bases/）\n\n- `场次数据.base` · `打法卡.base` · `人群.base` · `概念库.base` · `竞品库.base`\n")
    write(VAULT / "wiki" / "index.md", "\n".join(lines) + "\n")


def short(s, n=46):
    s = re.sub(r"\[\[([^\]|]+)(\|[^\]]+)?\]\]", r"\1", s)
    return s if len(s) <= n else s[: n - 1] + "…"


def build_log():
    raws = sorted(p.relative_to(VAULT).as_posix() for p in (VAULT / "raw").rglob("*.md"))
    by_raw = {v[1]: (k, v[0]) for k, v in SOURCES.items()}
    lines = [frontmatter({"title": "log", "type": "log"}), "# 操作日志\n",
             "> [!info] 只追加，不改写。格式：`## [日期] 操作 | 标题`，可以用 `grep \"^## \\[\" wiki/log.md` 直接查。\n",
             f"## [{TODAY}] init | 建库：raw / wiki / schema 三层\n",
             "- 建立目录：raw/（原始资料，只读）· wiki/（AI 维护）· outputs/ · canvas/ · bases/ · templates/ · prompts/",
             "- 写入规则文件：[[AGENTS]]（通用）· CLAUDE.md（Claude Code 导入 AGENTS.md）",
             "- 安装 obsidian-skills 到 `.claude/skills/`\n"]
    new_raw = {v[1] for v in M.SOURCES_MKT.values()}

    def ingest(r, date):
        key, title = by_raw.get(r, (None, None))
        cited = [c["title"] for c in CONCEPTS if key and key in c["src"]]
        out = [f"## [{date}] ingest | {pathlib.Path(r).stem}\n", f"- 原文：`{r}`"]
        if title:
            out.append(f"- 新建摘要页：{link(title)}")
        if cited:
            out.append(f"- 新建或更新概念页（{len(cited)}）：" + " ".join(link(t) for t in cited))
        return out + [""]

    for r in raws:
        if r not in new_raw:
            lines += ingest(r, TODAY)
    lines += [f"## [{TODAY}] query | 这套训练体系能给公司带来多少经济价值？\n",
              "- 回答已存回：[[经济价值推算]]、[[一笔真实的账]]；结论标注为推算\n",
              f"## [{TODAY}] build | 白板与数据库视图\n",
              "- 白板：`canvas/成交方程式-总览.canvas` · `canvas/五道门.canvas` · `canvas/训练路线图.canvas` · `canvas/知识库结构.canvas`",
              "- 视图：`bases/场次数据.base` · `bases/打法卡.base` · `bases/人群.base` · `bases/概念库.base`\n",
              f"## [{TODAY}] lint | 第一次体检\n",
              "- 报告：[[体检报告-2026-09-26]]（3 处冲突、5 个缺口、0 个断链、0 个孤立页）\n",
              f"## [{INGEST2}] lint | 第二次体检：引语逐条对原文\n",
              "- 删除三处找不到出处的说法：「小红书」是在播平台、视频号是「主阵地」、一句老板原话",
              "- 引语改成原文原话（主管点评、规则库回复、老板心法等）",
              "- 把需求方的口述原话和搭建步骤存进 raw：[[摘要-训练思路口述]] · [[摘要-第二大脑搭建步骤]]\n"]
    for r in raws:
        if r in new_raw:
            lines += ingest(r, INGEST2)
    lines += [f"## [{INGEST2}] query | 我们的仿宝石设计款属于哪个品类？市场多大？谁在竞争？\n",
              f"- 回答已存回：[[{M.OVERVIEW_TITLE}]]；数字按[[五个市场口径]]分开写，估算标「推算」\n",
              f"## [{INGEST2}] build | 市场白板与竞品库视图\n",
              "- 白板：`canvas/饰品市场与竞争.canvas` · 视图：`bases/竞品库.base`\n",
              f"## [{INGEST2}] build | 市场地图页、竞品雷达、市场篇影片\n",
              "- 页面版总览和团队记录表见[[饰品市场与竞争-总览]]第八节；影片见[[成交方程式影片]]\n",
              f"## [{INGEST2}] lint | 第三次体检\n",
              "- 报告：[[体检报告-2026-09-28]]\n"]
    write(VAULT / "wiki" / "log.md", "\n".join(lines) + "\n")


# ------------------------------------------------------------------ canvas
_id = [0]


def nid():
    _id[0] += 1
    return "%016x" % (0x5a17c0de00000000 + _id[0] * 7919)


def fnode(title, x, y, w=320, h=180, color=None):
    n = {"id": nid(), "type": "file", "file": PAGES[title][0], "x": x, "y": y, "width": w, "height": h}
    if color:
        n["color"] = color
    return n


def tnode(text, x, y, w=320, h=120, color=None):
    n = {"id": nid(), "type": "text", "text": text, "x": x, "y": y, "width": w, "height": h}
    if color:
        n["color"] = color
    return n


def gnode(label, x, y, w, h, color=None):
    n = {"id": nid(), "type": "group", "label": label, "x": x, "y": y, "width": w, "height": h}
    if color:
        n["color"] = color
    return n


def edge(a, b, label=None, fs="right", ts="left", color=None):
    e = {"id": nid(), "fromNode": a["id"], "fromSide": fs, "toNode": b["id"], "toSide": ts, "toEnd": "arrow"}
    if label:
        e["label"] = label
    if color:
        e["color"] = color
    return e


def save_canvas(name, nodes, edges):
    ids = {n["id"] for n in nodes}
    assert all(e["fromNode"] in ids and e["toNode"] in ids for e in edges), name
    write(VAULT / "canvas" / f"{name}.canvas", json.dumps({"nodes": nodes, "edges": edges}, ensure_ascii=False, indent=1))


def build_canvases():
    # 1) overview: failures → rules → seven layers
    N, E = [], []
    N.append(tnode("# 成交方程式\n\n讲到你自己都想买，你就讲对了。\n\n直播只有两个字：**拉新**、**逼单**。", -40, -420, 520, 220, "#D8BC80"))
    g1 = gnode("三次失败 → 三条理由", -1300, -120, 1000, 1080, "1")
    N.append(g1)
    fails = [fnode(t, -1260, -60 + i * 340, 400, 260, "1") for i, t in enumerate(["失败1-试训半天流失", "失败2-19场4场达标", "失败3-打法卡8张未命中"])]
    rules = [fnode(t, -760, -60 + i * 340, 400, 260) for i, t in enumerate(["先筛后教", "讲人话", "底层逻辑与打法卡"])]
    N += fails + rules
    E += [edge(f, r, "所以") for f, r in zip(fails, rules)]
    g2 = gnode("七层体系", 40, -120, 560, 2020, "#D8BC80")
    N.append(g2)
    layers = ["底层方程", "五道门", "讲品六步", "逼单四要素", "憋单框架", "每轮五个数", "播法类型"]
    L = [fnode(t, 80, -80 + i * 280, 480, 240) for i, t in enumerate(layers)]
    N += L
    E += [edge(L[i], L[i + 1], None, "bottom", "top") for i in range(len(L) - 1)]
    E.append(edge(L[5], L[2], "下一场只改一处", "right", "right", "4"))
    g3 = gnode("贯穿模块", 700, -120, 480, 620, "6")
    N.append(g3)
    x1, x2 = fnode("拆解七步", 740, -80, 400, 260, "6"), fnode("合规红线", 740, 220, 400, 260, "1")
    N += [x1, x2]
    g4 = gnode("给投资人", 700, 560, 480, 900, "4")
    N.append(g4)
    inv = [fnode(t, 740, 600 + i * 280, 400, 240, "4") for i, t in enumerate(["直播电商市场规模", "一笔真实的账", "经济价值推算"])]
    N += inv
    E += [edge(r, L[0], "理由进入体系", "right", "left") for r in rules[:1]]
    save_canvas("成交方程式-总览", N, E)

    # 2) five gates, six steps, four elements
    N, E = [], []
    cols = ["1", "2", "4", "5", "6"]
    gates = [fnode(t, i * 380, 0, 340, 220, cols[i]) for i, t in enumerate(["需求门", "价值门", "福利门", "信任门", "稀缺门"])]
    N.append(tnode("## 五道门\n她心里依次要过的五道门。一道没开，她就走。", 0, -220, 700, 150))
    N += gates
    E += [edge(gates[i], gates[i + 1]) for i in range(4)]
    steps = [("痛点", 0), ("卖点", 1), ("场景", 1), ("讲品六步", 2), ("为什么买与为什么不买", 3), ("两分钟逼一次单", 4)]
    sn = [fnode(t, g * 380 + (60 if t == "场景" else 0), 330 + (260 if t == "场景" else 0), 300, 200) for t, g in steps]
    N += sn
    E += [edge(s, gates[g], "开这道门", "top", "bottom") for s, (t, g) in zip(sn, steps)]
    four = [fnode(t, 380 + i * 380, 900, 340, 200, cols[i + 1]) for i, t in enumerate(["价值锚定", "比价", "保障", "真实稀缺"])]
    N.append(tnode("## 逼单四要素\n价值 · 比价 · 保障 · 稀缺", 0, 930, 340, 140))
    N += four
    E += [edge(f, gates[i + 1], None, "top", "bottom", cols[i + 1]) for i, f in enumerate(four)]
    save_canvas("五道门", N, E)

    # 3) training roadmap
    N, E = [], []
    road = [("两道门筛选", "初筛 → 面谈 → 15 分钟试播 → 回家作业 → 锁定"), ("试岗三天", "D1 产品与买点 · D2 讲品六步 · D3 搭配与录播"),
            ("留用判定", "出关至少两项 · 不缺勤 · 同一问题不犯二次"), ("一轮循环", "一轮 22 分钟内跑完，不看稿"),
            ("出师标准", "连续 2 场达到场均目标（目前 3,000 元）"), ("强项放大弱项及格", "按自己的类型定打法，每周只练一件事")]
    prev = None
    for i, (t, note) in enumerate(road):
        n = fnode(t, i * 420, 0, 360, 220, "#D8BC80" if i in (0, 4) else None)
        c = tnode(f"**出关**：{note}", i * 420, 260, 360, 130)
        N += [n, c]
        E.append(edge(n, c, None, "bottom", "top"))
        if prev:
            E.append(edge(prev, n))
        prev = n
    N.append(fnode("每日练习", 840, 480, 360, 200, "4"))
    save_canvas("训练路线图", N, E)

    # 4) the second-brain structure (method)
    N, E = [], []
    raw = tnode("## raw/\n原始资料，只读\n\n内部资料 · 公开数据 · 方法论\n（Web Clipper / 手动放入）", 0, 0, 360, 240, "5")
    wiki = tnode("## wiki/\nAI 维护的维基\n\n概念 · 实体 · 摘要 · 对比 · 综合 · 课程 · 问题 · 数据\nindex.md · log.md", 520, 0, 380, 260, "#D8BC80")
    out = tnode("## outputs/\n存回的答案、报告、体检", 1060, 0, 340, 200, "4")
    schema = tnode("## 规则\nAGENTS.md · CLAUDE.md\n.claude/skills（obsidian-skills）", 520, -320, 380, 200, "6")
    lint_ = tnode("## 体检 lint\n每周一次：冲突 · 过时 · 孤立页 · 断链 · 缺口", 1060, -320, 340, 170, "1")
    N += [raw, wiki, out, schema, lint_]
    E += [edge(raw, wiki, "录入 ingest"), edge(wiki, out, "提问 query"), edge(out, wiki, "好答案存回", "bottom", "bottom"),
          edge(schema, wiki, "约束", "bottom", "top"), edge(wiki, lint_, "检查", "top", "left"), edge(lint_, out, "报告", "bottom", "top")]
    N.append(fnode("知识库使用说明", 0, 360, 360, 200))
    N.append(fnode("LLM Wiki方法", 520, 360, 380, 200))
    save_canvas("知识库结构", N, E)

    # 5) market & competition (2026-09-28 ingest)
    N, E = [], []
    hub = fnode(M.OVERVIEW_TITLE, 0, -40, 460, 300, "#D8BC80")
    N.append(hub)
    N.append(gnode("市场有多大：先分口径", -1060, -200, 520, 980, "5"))
    scope = [fnode(t, -1020, -150 + i * 300, 440, 260, "5") for i, t in enumerate(["五个市场口径", "市场范围估算", "时尚饰品"])]
    N += scope
    E += [edge(scope[0], hub, "零售口径 130–180 亿元", "right", "left")]
    N.append(gnode("谁在竞争", 620, -200, 520, 1280, "4"))
    comp = [fnode(t, 660, -150 + i * 300, 440, 260, "4") for i, t in enumerate(["竞品分层", "价格带地图", "品牌护城河薄", "潘多拉与我们"])]
    N += comp
    E += [edge(hub, comp[0], None, "right", "left")]
    N.append(gnode("红线", -1060, 860, 520, 700, "1"))
    red = [fnode(t, -1020, 910 + i * 320, 440, 280, "1") for i, t in enumerate(["金色仿品红线", "仿宝石定名"])]
    N += red
    N.append(gnode("我们的路", -140, 400, 720, 700, "6"))
    ours = [fnode(t, -100, 450 + i * 320, 640, 280, "6") for i, t in enumerate(["平替与设计款", "仿宝石的信任"])]
    N += ours
    E += [edge(hub, ours[0], None, "bottom", "top"), edge(red[0], ours[0], "所以", "right", "left")]
    loop = [fnode(t, 660 + i * 480, 1160, 440, 240, "2") for i, t in enumerate(["竞品观察", "AI竞品分析流程"])]
    N += loop
    E += [edge(loop[0], loop[1], "记满 20 条"), edge(loop[1], hub, "结论存回", "top", "right")]
    save_canvas("饰品市场与竞争", N, E)


# ------------------------------------------------------------------ bases
BASES = {
    "场次数据": """filters:
  and:
    - file.inFolder("wiki/data/场次")
formulas:
  achieve: 'if(target > 0, (gmv / target * 100).round(0), "")'
  gmv_per_hour: '(gmv / minutes * 60).round(0)'
properties:
  date:
    displayName: 日期
  minutes:
    displayName: 时长（分）
  gmv:
    displayName: GMV（元）
  target:
    displayName: 目标（元）
  hit:
    displayName: 达标
  peak_online:
    displayName: 峰值在线
  products:
    displayName: 讲解产品
  formula.achieve:
    displayName: 达成率 %
  formula.gmv_per_hour:
    displayName: 每小时 GMV
views:
  - type: table
    name: 全部场次
    order:
      - file.name
      - date
      - minutes
      - gmv
      - target
      - formula.achieve
      - hit
      - peak_online
      - formula.gmv_per_hour
      - products
    sort:
      - property: date
        direction: ASC
    summaries:
      gmv: Average
      minutes: Sum
  - type: table
    name: 达标的场次
    filters:
      and:
        - 'hit == true'
    order:
      - file.name
      - gmv
      - target
      - products
  - type: cards
    name: 卡片
    order:
      - file.name
      - gmv
      - products
""",
    "打法卡": """filters:
  and:
    - file.inFolder("wiki/data/打法卡")
properties:
  card_no:
    displayName: 编号
  card_name:
    displayName: 名称
  origin:
    displayName: 来源
  level:
    displayName: 适用层级
  result:
    displayName: 在主播A 复盘上
views:
  - type: table
    name: 按命中结果分组
    groupBy:
      property: result
      direction: ASC
    order:
      - card_no
      - card_name
      - origin
      - level
      - result
    sort:
      - property: card_no
        direction: ASC
""",
    "人群": """filters:
  and:
    - file.inFolder("wiki/data/人群")
properties:
  code:
    displayName: 代号
  official:
    displayName: 官方人群
  age:
    displayName: 年龄
  power:
    displayName: 消费实力
  aov:
    displayName: 客单区间
  risk:
    displayName: 风险档
views:
  - type: table
    name: 八大人群
    groupBy:
      property: risk
      direction: DESC
    order:
      - code
      - official
      - age
      - power
      - aov
      - risk
""",
    "概念库": """filters:
  and:
    - file.inFolder("wiki/concepts")
formulas:
  backlinks: 'file.backlinks.length'
properties:
  layer:
    displayName: 层
  lesson:
    displayName: 课程
  confidence:
    displayName: 可信度
  formula.backlinks:
    displayName: 被引用次数
views:
  - type: table
    name: 按层
    groupBy:
      property: layer
      direction: ASC
    order:
      - file.name
      - layer
      - lesson
      - confidence
      - formula.backlinks
  - type: table
    name: 最常被引用
    order:
      - file.name
      - formula.backlinks
      - layer
    sort:
      - property: formula.backlinks
        direction: DESC
    limit: 25
""",
    "竞品库": """filters:
  and:
    - file.inFolder("wiki/entities")
    - 'kind.contains("品牌")'
properties:
  kind:
    displayName: 类别
  created:
    displayName: 录入日期
views:
  - type: table
    name: 竞品与对标品牌
    groupBy:
      property: kind
      direction: ASC
    order:
      - file.name
      - kind
      - created
  - type: cards
    name: 卡片
    order:
      - file.name
      - kind
""",
}


def build_bases():
    for name, y in BASES.items():
        write(VAULT / "bases" / f"{name}.base", y)


# ------------------------------------------------------------------ obsidian config + schema files
def obsidian_config(root, accent="#D8BC80", with_groups=True):
    cfg = root / ".obsidian"
    write(cfg / "app.json", json.dumps({"alwaysUpdateLinks": True, "newFileLocation": "folder", "newFileFolderPath": "raw",
                                        "attachmentFolderPath": "raw/附件", "readableLineLength": True, "showUnsupportedFiles": False,
                                        "userIgnoreFilters": [".claude/"]}, ensure_ascii=False, indent=2))
    write(cfg / "appearance.json", json.dumps({"theme": "obsidian", "accentColor": accent, "baseFontSize": 16}, indent=2))
    core = ["file-explorer", "global-search", "switcher", "graph", "backlink", "canvas", "outgoing-link", "tag-pane", "properties",
            "page-preview", "templates", "note-composer", "command-palette", "editor-status", "bookmarks", "outline", "word-count",
            "file-recovery", "bases"]
    write(cfg / "core-plugins.json", json.dumps({k: True for k in core}, indent=2))
    write(cfg / "templates.json", json.dumps({"folder": "templates", "dateFormat": "YYYY-MM-DD"}, indent=2))
    rgb = lambda h: int(h.lstrip("#"), 16)  # noqa: E731
    groups = [("path:wiki/synthesis", "#FFFFFF"), ("path:wiki/lessons", "#FF9A52"), ("path:wiki/concepts", "#D8BC80"),
              ("path:wiki/comparisons", "#AE7BFF"), ("path:wiki/entities", "#5B85FF"), ("path:wiki/sources", "#8E8C99"),
              ("path:wiki/questions", "#FF4F6D"), ("path:wiki/data", "#2FD9B0")] if with_groups else []
    write(cfg / "graph.json", json.dumps({"collapse-filter": False, "search": "path:wiki -path:wiki/data", "showTags": False,
                                          "showAttachments": False, "hideUnresolved": False, "showOrphans": True,
                                          "colorGroups": [{"query": qy, "color": {"a": 1, "rgb": rgb(c)}} for qy, c in groups],
                                          "showArrow": False, "textFadeMultiplier": -0.6, "nodeSizeMultiplier": 1.15,
                                          "lineSizeMultiplier": 1, "centerStrength": 0.45, "repelStrength": 14,
                                          "linkStrength": 1, "linkDistance": 220, "scale": 0.7}, indent=2))


def install_skills(root):
    dst = root / ".claude" / "skills"
    if SKILLS_SRC and (SKILLS_SRC / "skills").exists():
        for d in (SKILLS_SRC / "skills").iterdir():
            if d.is_dir():
                shutil.copytree(d, dst / d.name, dirs_exist_ok=True)
        shutil.copy(SKILLS_SRC / "LICENSE", dst / "LICENSE-obsidian-skills")
        shutil.copy(SKILLS_SRC / "README.md", dst / "README-obsidian-skills.md")
    write(dst / "llm-wiki" / "SKILL.md", LLM_WIKI_SKILL)
    for name, text in COMMANDS.items():
        write(root / ".claude" / "commands" / f"{name}.md", text)


def build_schema_and_docs():
    write(VAULT / "AGENTS.md", AGENTS_MD)
    write(VAULT / "CLAUDE.md", CLAUDE_MD)
    write(VAULT / "GEMINI.md", GEMINI_MD)
    cnt = lambda t: sum(1 for v in PAGES.values() if v[1] == t)  # noqa: E731
    stats = (f"概念页 {cnt('concept')} · 实体页 {cnt('entity')} · 摘要页 {cnt('source')} · 对比页 {cnt('comparison')} · "
             f"综合页 {cnt('synthesis')} · 课程页 {cnt('lesson')} · 问题页 {cnt('question')} · 数据记录 {cnt('data')}")
    raw_count = {d: len(list((VAULT / "raw" / d).glob("*.md"))) for d in ("内部资料", "公开数据", "方法论")}
    raw_stats = (f"- 原始资料 {sum(raw_count.values())} 份：内部资料 {raw_count['内部资料']} · 公开数据 {raw_count['公开数据']} · "
                 f"方法论 {raw_count['方法论']}（2026-09-28 新录入市场与竞争资料 {len(M.SOURCES_MKT)} 份）")
    write(VAULT / "README.md", README_MD.replace("{STATS}", stats).replace("{RAW_STATS}", raw_stats))
    for name, text in TEMPLATES.items():
        write(VAULT / "templates" / f"{name}.md", text)
    for name, text in PROMPTS.items():
        write(VAULT / "prompts" / f"{name}.md", text)
    hb = (REPO / "docs" / "主播训练体系.md").read_text(encoding="utf-8")
    write(VAULT / "outputs" / "2026-09-26-主播训练体系.md",
          frontmatter({"title": "2026-09-26-主播训练体系", "type": "output", "tags": ["输出"], "created": TODAY}) + "\n" + hb)
    write(VAULT / "outputs" / "体检报告-2026-09-26.md", lint_report(TODAY))
    obsidian_config(VAULT)
    write(VAULT / ".obsidian" / "bookmarks.json", json.dumps({"items": [
        {"type": "file", "path": "wiki/index.md", "title": "索引"},
        {"type": "file", "path": "wiki/synthesis/成交方程式-总览.md", "title": "总览"},
        {"type": "file", "path": "canvas/成交方程式-总览.canvas", "title": "白板 · 总览"},
        {"type": "file", "path": "canvas/五道门.canvas", "title": "白板 · 五道门"},
        {"type": "file", "path": "canvas/训练路线图.canvas", "title": "白板 · 训练路线图"},
        {"type": "file", "path": "bases/场次数据.base", "title": "数据 · 场次"},
        {"type": "file", "path": "wiki/log.md", "title": "日志"}]}, ensure_ascii=False, indent=2))
    install_skills(VAULT)


# ------------------------------------------------------------------ blank framework
def build_blank():
    if BLANK.exists():
        shutil.rmtree(BLANK)
    write(BLANK / "README.md", BLANK_README)
    write(BLANK / "AGENTS.md", BLANK_AGENTS_MD)
    write(BLANK / "CLAUDE.md", CLAUDE_MD)
    write(BLANK / "GEMINI.md", GEMINI_MD)
    for sub in ["raw/资料", "raw/附件", "outputs"]:
        write(BLANK / sub / ".gitkeep", "")
    for sub in ["concepts", "entities", "sources", "comparisons", "synthesis", "questions", "data"]:
        write(BLANK / "wiki" / sub / ".gitkeep", "")
    write(BLANK / "wiki" / "index.md", frontmatter({"title": "index", "type": "index"}) + "\n# 索引\n\n> [!info] 每次录入后由 AI 更新。现在还是空的。\n\n## 综合\n\n## 概念\n\n## 对比\n\n## 实体\n\n## 摘要（来源）\n\n## 待定问题\n")
    write(BLANK / "wiki" / "log.md", frontmatter({"title": "log", "type": "log"}) + "\n# 操作日志\n\n> [!info] 只追加，不改写。格式：`## [YYYY-MM-DD] 操作 | 标题`\n\n## [YYYY-MM-DD] init | 建库\n")
    for name, text in TEMPLATES.items():
        if name != "场次记录":
            write(BLANK / "templates" / f"{name}.md", text)
    for name, text in PROMPTS.items():
        text = text.split("## 可以试试的问题")[0].rstrip() + "\n"
        write(BLANK / "prompts" / f"{name}.md", text.replace("主播训练与直播运营", "【你的领域】"))
    cv = json.loads((VAULT / "canvas" / "知识库结构.canvas").read_text(encoding="utf-8"))
    stub = {"wiki/知识库使用说明.md": "## 使用说明\n见根目录 README.md：放资料、提问、每周体检。",
            "wiki/concepts/LLM Wiki方法.md": "## 方法\nKarpathy LLM Wiki：raw 只读，AI 维护 wiki，录入 / 提问 / 体检三个操作。"}
    for n in cv["nodes"]:
        if n["type"] == "file":
            n["type"], n["text"] = "text", stub[n.pop("file")]
    write(BLANK / "知识库结构.canvas", json.dumps(cv, ensure_ascii=False, indent=1))
    obsidian_config(BLANK)
    install_skills(BLANK)


# ------------------------------------------------------------------ lint: unresolved links
LINK_RE = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\\?\|[^\]]*)?\]\]")


def strip_code(text):
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    return re.sub(r"`[^`\n]*`", "", text)


def links_in(p):
    return [m.group(1).strip().rstrip("\\") for m in LINK_RE.finditer(strip_code(p.read_text(encoding="utf-8")))]


def lint():
    names = {p.stem for p in VAULT.rglob("*.md")} | {str(p.relative_to(VAULT))[:-3] for p in VAULT.rglob("*.md")}
    bad, inbound = {}, {}
    for p in VAULT.rglob("*.md"):
        if ".claude" in p.parts or "templates" in p.parts:
            continue
        for t in links_in(p):
            if t not in names:
                bad.setdefault(t, set()).add(p.relative_to(VAULT).as_posix())
            elif p.stem not in ("index", "log") and t != p.stem:
                inbound.setdefault(t, set()).add(p.stem)
    orphans = sorted(k for k in PAGES if k not in inbound)
    return bad, orphans


def lint_report_2(n_bad, n_orphans):
    new = {t: PAGES[t][1] for t in NEW_TITLES if t in PAGES}
    cnt = lambda ty: sum(1 for v in new.values() if v == ty)  # noqa: E731
    q_rows = "\n".join(f"| {link(t)} | {lead} |" for t, lead, _, _ in M.QUESTIONS_MKT)
    return f"""---
title: "体检报告-{INGEST2}"
type: output
tags:
  - 输出
  - 体检
created: {INGEST2}
---

# 体检报告-{INGEST2}

> [!info] 第 3 次体检 · 录入 {len(M.SOURCES_MKT)} 份市场与竞争资料之后 · 按 [[AGENTS]] 第 3.3 节
> 新增页面 **{len(new)}** · 断链 **{n_bad}** · 孤立页 **{n_orphans}** · 新缺口 **{len(M.QUESTIONS_MKT)}** · 需要马上自查 **1**

## 一、这次录入了什么

- {len(M.SOURCES_MKT)} 份新资料 → {cnt('source')} 个摘要页
- 新建概念页 {cnt('concept')} · 实体页 {cnt('entity')} · 对比页 {cnt('comparison')} · 问题页 {cnt('question')} · 综合页 {cnt('synthesis')}（[[{M.OVERVIEW_TITLE}]]）
- 新白板 `canvas/饰品市场与竞争.canvas`，新视图 `bases/竞品库.base`

## 二、冲突与口径（3）

1. **市场规模差几十倍**：130 亿元（中宝协）、约 25.5 亿美元（海外咨询）、千亿产值（义乌）、7,788 亿元（中宝协全行业）。不是矛盾，是口径不同，已写成 [[五个市场口径]]。**已处理。**
2. **抖音规则前后说法不一**：2022 细则禁售仿黄金外观的银和合金制品；2023 年的解读是合金镀金有条件可售。两说并存，注明以后台当期规则为准，见 [[抖音与视频号的饰品规则]]。**已处理。**
3. **海外咨询页面数字更新过**：早先写 2024 年 20.9 亿美元，现在写 2025 年 25.5 亿美元。采用新数字，注明方法未公开。**已处理。**

## 三、需要马上自查（1）

- **视频号禁售金色仿品**：「黄金外观、但基底材质为仿黄金材质的商品（铜合金、塑料镀金、银镀金、包金）」。我们在售的款里有没有？见 [[金色外观款自查]] 和 [[金色仿品红线]]。

## 四、新缺口 → 已开问题页（{len(M.QUESTIONS_MKT)}）

| 问题页 | 缺什么 |
| --- | --- |
{q_rows}

## 五、顺手修正

- [[视频号直播电商]]：删掉「我们的主阵地是视频号」（没有出处），改成「主播A 的 19 场都在视频号」，并补上视频号购买用户女性占 78% 的出处。

## 六、链接

- 断链 {n_bad}、孤立页 {n_orphans}（构建脚本 `tools/kb/build.py` 自动检查）。
"""


def main():
    if (VAULT / "wiki").exists():
        shutil.rmtree(VAULT / "wiki")
    for d in ("canvas", "bases", "templates", "prompts", "outputs"):
        if (VAULT / d).exists():
            shutil.rmtree(VAULT / d)
    build_concepts(); build_sources(); build_entities(); build_comparisons(); build_failures()
    build_questions(); build_lessons(); build_data(); build_overview(); build_market_overview(); build_usage_page(); build_hubs()
    build_schema_and_docs()
    build_index(); build_log(); build_canvases(); build_bases()
    build_blank()
    write(VAULT / "outputs" / "体检报告-2026-09-28.md", lint_report_2(0, 0))
    bad, orphans = lint()
    write(VAULT / "outputs" / "体检报告-2026-09-28.md", lint_report_2(len(bad), len(orphans)))
    n = sum(1 for _ in (VAULT / "wiki").rglob("*.md"))
    print(f"wiki pages: {n} · canvases: {len(list((VAULT / 'canvas').glob('*.canvas')))} · bases: {len(BASES)}")
    print(f"orphans (no inbound link except index/log): {len(orphans)}" + (" → " + " ".join(orphans) if orphans else ""))
    if bad:
        print("UNRESOLVED LINKS:")
        for t, where in sorted(bad.items()):
            print(f"  [[{t}]] ← {', '.join(sorted(where))[:160]}")
    else:
        print("links: all resolved")


if __name__ == "__main__":
    main()
