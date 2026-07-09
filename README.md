# 📸 证件照处理工具

纯浏览器端 AI 证件照处理，上传即抠图，一键换底色。

## 🔗 在线体验

- **GitHub Pages**: https://zhangwei6321-spec.github.io/book-reader/证件照/
- 或克隆后本地打开 `证件照/index.html`

## ✨ 功能

- 🤖 **AI 智能抠图** — 浏览器本地运行，隐私安全
- 🎨 **一键换底色** — 白/蓝/红/自定义
- 📐 **50+ 考试规格** — 国考、省考、教资、法考、护照签证等
- 👁️ **实时预览** — 拖拽平移、滚轮缩放
- 💾 **导出** — 单张证件照 / 4×6 排版照
- 📱 **移动端适配** — 拍照上传、拖拽上传

## 🚀 技术栈

- 前端：HTML5 Canvas + vanilla JS
- AI 抠图：[`@imgly/background-removal`](https://www.npmjs.com/package/@imgly/background-removal)（浏览器端 WebAssembly）
- 模型：首次下载 ~40MB，后续浏览器缓存秒开

## 📂 项目结构

```
证件照/
├── index.html        # 页面
├── css/style.css     # 样式
└── js/
    ├── exams.js      # 考试规格数据库
    └── main.js       # 核心逻辑
```

## 📦 本地运行

```bash
cd 证件照
python3 -m http.server 3000
# 浏览器打开 http://localhost:3000
```

## 🔗 其他项目

- **媒体解析工具** — 小红书/抖音链接解析
- **题库工具** — 前端题库系统
- **视频解析** — Node.js 视频处理
