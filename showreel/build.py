#!/usr/bin/env python3
"""Build the 成交方程式 showreel pages.

- Subsets the display fonts to exactly the glyphs the reels use and embeds them
  as data URIs, so the live page and the rendered MP4 look identical.
- dist/render.html      : stage only, GSAP inlined — driven by render.mjs
- dist/showreel/index.html : the published page (player + handbook), GSAP from cdnjs
- dist/showreel/preview.html : same page with GSAP inlined, for local screenshots

Usage:  python3 showreel/build.py
Fonts are fetched from the google/fonts GitHub repo into showreel/.fonts on first run.
"""
import base64
import io
import pathlib
import re
import subprocess
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
import markdown

ROOT = pathlib.Path(__file__).resolve().parent
REPO = ROOT.parent
SRC = ROOT / "src"
FONT_DIR = ROOT / ".fonts"
# 主播知识库的交互图谱（tools/kb/explorer.py 生成，发布为 Artifact）
KB_URL = "https://claude.ai/artifact/5pmYWe2raA7bJ8A1Kax5F6"
DIST = REPO / "dist"
GSAP_VERSION = (ROOT / "vendor" / "GSAP_VERSION").read_text().strip()

FONT_FILES = {
    "serif": ("ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf", "NotoSerifSC[wght].ttf"),
    "sans": ("ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf", "NotoSansSC[wght].ttf"),
    "bodoni": ("ofl/bodonimoda/BodoniModa-Italic%5Bopsz,wght%5D.ttf", "BodoniModa-Italic[opsz,wght].ttf"),
    "mono": ("ofl/dmmono/DMMono-Regular.ttf", "DMMono-Regular.ttf"),
}
JS_FILES = ["reel-engine.js", "reel-scenes.js", "reel-lessons.js", "boot.js"]


def fetch_fonts():
    FONT_DIR.mkdir(exist_ok=True)
    for key, (url, name) in FONT_FILES.items():
        dest = FONT_DIR / name
        if dest.exists():
            continue
        print("fetching", name)
        subprocess.run(["curl", "-sSfL", "-o", str(dest),
                        "https://raw.githubusercontent.com/google/fonts/main/" + url], check=True)


def used_text():
    text = ""
    for p in sorted(SRC.glob("*")):
        if p.suffix in (".js", ".css", ".html"):
            text += p.read_text(encoding="utf-8")
    # printable ASCII + typographic extras that appear via escapes/formatting
    text += "".join(chr(c) for c in range(32, 127)) + "¥≈×→←↺′″−·–—…“”「」（），。：；、！？%‰⅓✓●▏◇"
    return "".join(sorted(set(ch for ch in text if ch >= " ")))


def make_face(src, axes, text, family, weight, style="normal"):
    font = TTFont(src)
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.glyph_names = False
    opts.hinting = False
    sub = subset.Subsetter(options=opts)
    sub.populate(text=text)
    sub.subset(font)
    if axes and "fvar" in font:
        font = instancer.instantiateVariableFont(font, axes)
    font.flavor = "woff2"
    buf = io.BytesIO()
    font.save(buf)
    data = base64.b64encode(buf.getvalue()).decode()
    print(f"  {family} {weight} {style}: {len(buf.getvalue()) / 1024:.0f} KB")
    return (f'@font-face{{font-family:"{family}";font-weight:{weight};font-style:{style};font-display:block;'
            f'src:url(data:font/woff2;base64,{data}) format("woff2")}}')


def build_fonts():
    fetch_fonts()
    text = used_text()
    cjk = "".join(ch for ch in text if ord(ch) > 0x2E7F)
    latin = "".join(ch for ch in text if ord(ch) <= 0x2E7F)
    print(f"glyph set: {len(text)} chars ({len(cjk)} CJK)")
    f = {k: str(FONT_DIR / v[1]) for k, v in FONT_FILES.items()}
    faces = [
        make_face(f["serif"], {"wght": 900}, text, "ReelSerif", 900),
        make_face(f["sans"], {"wght": 400}, text, "ReelSans", 400),
        make_face(f["sans"], {"wght": 700}, text, "ReelSans", 700),
        make_face(f["bodoni"], {"wght": 500, "opsz": 48}, latin, "ReelBodoni", 500, "italic"),
        make_face(f["bodoni"], {"wght": 700, "opsz": 48}, latin, "ReelBodoni", 700, "italic"),
        make_face(f["mono"], None, latin, "ReelMono", 400),
    ]
    return "\n".join(faces)


def read(name):
    return (SRC / name).read_text(encoding="utf-8")


def scripts(inline_gsap):
    parts = []
    if inline_gsap:
        parts.append("<script>" + (ROOT / "vendor" / "gsap.min.js").read_text(encoding="utf-8") + "</script>")
    else:
        parts.append(f'<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/{GSAP_VERSION}/gsap.min.js"></script>')
    for js in JS_FILES:
        p = SRC / js
        if p.exists():
            parts.append("<script>\n" + p.read_text(encoding="utf-8") + "\n</script>")
    return "\n".join(parts)


def handbook_html():
    md = (REPO / "docs" / "主播训练体系.md").read_text(encoding="utf-8")
    md = md.split("\n", 1)[1]  # the page has its own title
    html = markdown.markdown(md, extensions=["tables", "sane_lists", "toc"], extension_configs={"toc": {"slugify": slug}})
    html = re.sub(r"<table>", '<div class="tw"><table>', html)
    html = re.sub(r"</table>", "</table></div>", html)
    html = re.sub(r'<a href="http', '<a target="_blank" rel="noopener" href="http', html)
    return html


def slug(value, separator):
    m = re.match(r"\s*(\d+)\s*·", value)
    return f"s{m.group(1)}" if m else "s-" + str(abs(hash(value)) % 10**6)


def main():
    DIST.mkdir(exist_ok=True)
    (DIST / "showreel").mkdir(exist_ok=True)
    fonts = build_fonts()
    reel_css = read("reel.css")
    stage = '<div id="stage"><canvas id="fx"></canvas><div id="scenes"></div></div>'

    render = ("<!doctype html><html><head><meta charset=\"utf-8\"><title>render</title><style>" + fonts + reel_css +
              "html,body{margin:0;background:#000;overflow:hidden}</style></head><body>" + stage +
              scripts(True) + "</body></html>")
    (DIST / "render.html").write_text(render, encoding="utf-8")

    page = read("page.html")
    page = (page.replace("{{FONTS_CSS}}", fonts)
                .replace("{{REEL_CSS}}", reel_css)
                .replace("{{PAGE_CSS}}", read("page.css"))
                .replace("{{STAGE}}", stage)
                .replace("{{HANDBOOK}}", handbook_html())
                .replace("{{KB_URL}}", KB_URL))
    (DIST / "showreel" / "index.html").write_text(page.replace("{{SCRIPTS}}", scripts(False)), encoding="utf-8")
    (DIST / "showreel" / "preview.html").write_text(
        "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head><body>"
        + page.replace("{{SCRIPTS}}", scripts(True)) + "</body></html>", encoding="utf-8")
    size = (DIST / "showreel" / "index.html").stat().st_size
    print(f"wrote dist/render.html, dist/showreel/index.html ({size / 1024 / 1024:.2f} MB)")


if __name__ == "__main__":
    sys.exit(main())
