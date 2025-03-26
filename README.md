# 飞书多维表格 Markdown 预览插件

这是一个为飞书多维表格设计的Markdown预览插件，可以让用户方便地预览和编辑Markdown内容。

## 功能特点

- 将Markdown文本转换为富文本预览
- 支持实时预览Markdown编辑效果
- 支持多种Markdown语法，如标题、列表、链接和代码块等
- 与飞书多维表格无缝集成

## 开发环境要求

- Node.js 16+
- npm 或 yarn

## 安装指南

1. 克隆此仓库
```bash
git clone https://github.com/Jasonzs0102/feishu_markdown.git
cd feishu_markdown
```

2. 安装依赖
```bash
# 使用npm
npm install

# 或使用yarn
npm install -g yarn
yarn
```

3. 启动开发服务器
```bash
# 使用npm
npm run dev

# 或使用yarn
yarn run dev
```

4. 在浏览器中打开开发服务器提供的URL（通常是 http://localhost:3000/）

## 在飞书多维表格中使用

1. 打开飞书多维表格
2. 点击左侧的"插件"按钮
3. 点击"添加自定义插件"
4. 输入开发服务器提供的URL
5. 开始使用Markdown预览功能

## 构建生产版本

```bash
# 使用npm
npm run build

# 或使用yarn
yarn build
```

## 常见问题

如果遇到 `Failed to resolve import "./index.css"` 错误，请确保src目录下存在index.css文件。

## 许可证

MIT

## 贡献指南

欢迎提交问题报告和拉取请求。

## 联系方式

如有任何问题，请通过GitHub Issues联系我们。