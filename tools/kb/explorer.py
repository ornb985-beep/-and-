#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把「主播知识库」Obsidian 仓库打包成一个可交互的网页（图谱 + 阅读器 + 导览）。

用法：python3 tools/kb/build.py && python3 tools/kb/explorer.py
输出：dist/kb/index.html（数据内嵌，单文件，可直接发布为 Artifact）
"""
import json
import pathlib
import re

import yaml

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent
VAULT = REPO / "主播知识库"
OUT = REPO / "dist" / "kb" / "index.html"
REEL_URL = "https://claude.ai/artifact/SHzYL92cgqLjky17FidRbB"  # 影片与训练文档（showreel/build.py 生成）

LINK_RE = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\\?\|[^\]]*)?\]\]")
FOLDER_TYPE = {"synthesis": "synthesis", "lessons": "lesson", "concepts": "concept", "comparisons": "comparison",
               "entities": "entity", "sources": "source", "questions": "question", "data": "data"}


def strip_code(text):
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    return re.sub(r"`[^`\n]*`", "", text)


def split_fm(text):
    if text.startswith("---\n"):
        _, fm, body = text.split("---\n", 2)
        return yaml.safe_load(fm) or {}, body
    return {}, text


def classify(rel):
    parts = rel.split("/")
    if parts[0] == "wiki":
        if len(parts) == 2:
            return "overview"
        return FOLDER_TYPE.get(parts[1], "overview")
    if parts[0] == "raw":
        return "raw"
    if parts[0] == "outputs":
        return "output"
    return "schema"


def lead_of(fm, body):
    m = re.search(r"^> \[!\w+\][^\n]*\n> (.+)$", body, flags=re.M)
    if m:
        return re.sub(r"\[\[([^\]|]+)(?:\\?\|([^\]]+))?\]\]", lambda x: x.group(2) or x.group(1), m.group(1)).strip()
    for line in body.splitlines():
        s = line.strip()
        if s and not s.startswith(("#", ">", "|", "-", "`", "!")):
            return s[:120]
    return ""


def main():
    files = [p for p in VAULT.rglob("*.md") if ".claude" not in p.parts and "templates" not in p.parts
             and "prompts" not in p.parts and p.name not in ("CLAUDE.md", "GEMINI.md", "README.md")]
    files.sort(key=lambda p: p.relative_to(VAULT).as_posix())
    docs, by_key = [], {}
    for p in files:
        rel = p.relative_to(VAULT).as_posix()
        fm, body = split_fm(p.read_text(encoding="utf-8"))
        d = {"id": len(docs), "t": p.stem, "path": rel, "type": classify(rel), "fm": fm, "md": body.strip(),
             "al": fm.get("aliases") or [], "layer": fm.get("layer"), "lead": lead_of(fm, body)}
        if d["t"] in ("index", "log"):
            d["type"] = "meta"
        docs.append(d)
        by_key[p.stem] = d["id"]
        by_key[rel[:-3]] = d["id"]
    edges, seen, unresolved = [], set(), set()
    for d in docs:
        text = strip_code(d["md"]) + "\n" + json.dumps(d["fm"], ensure_ascii=False, default=str)
        out = []
        for m in LINK_RE.finditer(text):
            t = m.group(1).strip().rstrip("\\")
            if t not in by_key:
                unresolved.add(t)
                continue
            j = by_key[t]
            if j != d["id"] and j not in out:
                out.append(j)
        d["out"] = out
        if d["type"] == "meta":
            continue
        for j in out:
            if docs[j]["type"] == "meta":
                continue
            key = (d["id"], j)
            if key not in seen:
                seen.add(key)
                edges.append([d["id"], j])
    for d in docs:
        d["in"] = sorted({s for s, t in edges if t == d["id"]})
    # 只保留阅读器用得到的属性，日期等转成字符串
    keep = ["type", "kind", "layer", "lesson", "sources", "related", "confidence", "raw", "goal", "pass", "video", "date",
            "minutes", "gmv", "target", "hit", "avg_online", "peak_online", "products", "origin", "level", "result",
            "official", "age", "city", "power", "aov", "risk", "status", "source", "url", "published", "captured"]
    for d in docs:
        d["fm"] = {k: (v if isinstance(v, (list, int, float, bool)) else str(v))
                   for k, v in d["fm"].items() if k in keep and v is not None and v != ""}
    stats = {"pages": sum(1 for d in docs if d["path"].startswith("wiki/") and d["type"] != "meta"),
             "raw": sum(1 for d in docs if d["type"] == "raw"), "links": len(edges), "unresolved": len(unresolved),
             "orphans": sum(1 for d in docs if d["path"].startswith("wiki/") and d["type"] not in ("meta",) and not d["in"])}
    data = {"docs": docs, "edges": edges, "stats": stats}
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = (HERE / "explorer.html").read_text(encoding="utf-8").replace("/*KB_DATA*/{}", blob).replace("{{REEL_URL}}", REEL_URL)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"{OUT.relative_to(REPO)} · {len(docs)} docs · {len(edges)} links · unresolved {len(unresolved)} · "
          f"orphans {stats['orphans']} · {OUT.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
