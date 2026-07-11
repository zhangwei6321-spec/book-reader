# 🎬 媒体解析器

> 支持 **抖音 · 快手 · 视频 · 图片** — 在线预览 & 一键下载

[![GitHub Pages](https://img.shields.io/badge/在线访问-GitHub%20Pages-blue)](https://zhangwei6321-spec.github.io/media-parser/)

---

## ✨ 功能

- 🔗 **自动提取链接** — 直接粘贴抖音/快手分享文案，自动识别并提取 URL
- 🎵 **抖音解析** — 输入分享链接，解析视频地址、封面、标题、作者
- 📱 **快手解析** — 同上
- 🎥 **视频直链** — `.mp4` / `.webm` 等直接预览 + 下载
- 🖼️ **图片直链** — `.jpg` / `.png` / `.gif` / `.webp` 直接展示 + 下载
- 📑 **批量解析** — 每行一个链接批量处理
- 👁️ **灯箱预览** — 点击预览区全屏查看
- ⬇️ **一键下载** — 下载进度实时显示

## 🚀 使用方式

### 在线版

直接访问 GitHub Pages：

👉 **[zhangwei6321-spec.github.io/media-parser](https://zhangwei6321-spec.github.io/media-parser/)**

> ⚠️ 在线版对抖音/快手解析依赖免费第三方 API，可能不稳定。视频/图片直链功能正常。

### 本地完整版（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/zhangwei6321-spec/media-parser.git

# 2. 启动解析后端（需 Python 3）
cd video-parser && python3 server.py

# 3. 打开前端
open media-parser/index.html
```

本地运行后，前端会自动检测并调用 `localhost:3000` 后端，获得完整稳定的抖音/快手解析能力。

## 📁 项目结构

```
media-parser/
├── index.html          # 主页面
├── css/
│   └── style.css       # 深色主题 · 玻璃态设计
├── js/
│   ├── parser.js       # URL 识别 · 平台解析 · 多 API 容灾
│   ├── downloader.js   # Blob 流式下载 · 进度追踪
│   ├── ui.js           # 卡片渲染 · Toast · 灯箱
│   └── app.js          # 事件绑定 · 入口
└── README.md
```

## 🛠️ 技术栈

- 纯静态前端：HTML5 + CSS3 + Vanilla JS
- 解析后端：Python `http.server`（需搭配 `video-parser/server.py`）
- 自动环境检测：本地自动走 localhost 后端，线上走远程 API

## 📄 免责声明

本项目仅用于个人学习与研究，请遵守各平台服务条款，勿用于商业用途。
