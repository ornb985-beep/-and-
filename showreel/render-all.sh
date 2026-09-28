#!/usr/bin/env bash
# Render every reel to MP4 (1080p30, H.264 + AAC). Run from anywhere:
#   bash showreel/render-all.sh
# Needs: python3 showreel/build.py, node showreel/timings.mjs, python3 showreel/audio.py first.
set -euo pipefail
cd "$(dirname "$0")/.."
node showreel/render.mjs video full "dist/video/01-完整版-成交方程式.mp4" --audio .render/audio/full.wav --crf 21
node showreel/render.mjs video investor "dist/video/02-投资人版.mp4" --audio .render/audio/investor.wav --crf 21
node showreel/render.mjs video teaser "dist/video/03-15秒版.mp4" --audio .render/audio/teaser.wav --crf 20
names=("为什么这样教" "底层方程" "五道门" "讲品六步" "逼单四要素" "节奏" "数据" "你的播法" "拆解顶尖直播间" "合规红线与出师")
for i in $(seq 0 9); do
  node showreel/render.mjs video "l$i" "dist/video/lessons/第${i}课-${names[$i]}.mp4" --audio ".render/audio/l$i.wav" --crf 23
done
echo "ALL DONE"
