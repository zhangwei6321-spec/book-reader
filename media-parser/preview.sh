#!/bin/bash
cd /Users/zw/Downloads/codex/01/media-parser
echo "媒体解析器已就绪: http://localhost:8899"
python3 -m http.server 8899
