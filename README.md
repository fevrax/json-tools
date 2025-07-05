<div align="center">
  <img src="public/logo.png" alt="JSON Tools Next" width="160" />
  <h1>JSON Tools Next</h1>
  <p><strong>强大、灵活的JSON工具集，融合AI的现代化JSON数据处理解决方案</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) [![GitHub Stars](https://img.shields.io/github/stars/dalefengs/json-tools?style=social)](https://github.com/dalefengs/json-tools/stargazers) [![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/) [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) [![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  
</div>

## ✨ 特性

JSON Tools Next 是一个多功能的JSON工具集，提供了直观的界面和多种强大功能，帮助开发者处理和转换JSON数据。

- 🚀 **多视图模式**：支持文本视图、树形视图、差异对比视图和表格视图
- 🎨 **深色/浅色主题**：适应各种工作环境和个人偏好
- 🔄 **视图切换**：快速在不同视图模式间切换
- 🧩 **多标签页**：支持同时打开多个JSON文件处理
- 🧩 **丰富工具箱**：集成多种专用JSON处理工具
- 🔍 **字符解码器**：自动识别并解码常见编码格式
- 🤖 **AI驱动功能**：利用AI技术增强JSON处理体验

## 📦 JSON 工具箱 

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="https://api.iconify.design/fluent-emoji-flat:magic-wand.svg" width="24" />
        <br />
        <strong>JSON AI 修复</strong>
        <br />
        <small>AI智能修复JSON格式错误</small>
      </td>
      <td align="center">
        <img src="https://api.iconify.design/fluent-color:code-block-24.svg" width="24" />
        <br />
        <strong>对象类型转换器</strong>
        <br />
        <small>JSON转TS/Go/Java/Rust等</small>
      </td>
      <td align="center">
        <img src="https://api.iconify.design/token-branded:swap.svg" width="24" />
        <br />
        <strong>数据格式转换</strong>
        <br />
        <small>JSON/YAML/XML/TOML互转</small>
      </td>
      <td align="center">
        <img src="https://api.iconify.design/icon-park-outline:key.svg" width="24" />
        <br />
        <strong>JWT解析验证</strong>
        <br />
        <small>解析JWT令牌与验证签名</small>
      </td>
    </tr>
  </table>
</div>

## 🖼️ 界面预览

![250419132143711.png](https://minio.kl.do/default/250419132143711-20250419132143726.png)
![250419132241894.png](https://minio.kl.do/default/250419132241894-20250419132242640.png)
![250419132405927.png](https://minio.kl.do/default/250419132405927-20250419132406260.png)
## 🔥 核心功能

### 多视图JSON编辑器

- **文本视图**：基于Monaco Editor的专业代码编辑体验
- **树形视图**：直观的树状结构展示，适合数据浏览
- **差异对比视图**：方便对比JSON数据差异
- **表格视图**：以表格形式展示JSON数据

### 字符解码解码器

- **时间戳解码器**：自动识别并将时间戳转换为可读日期时间格式
- **Base64解码器**：检测并解码Base64编码字符串
- **Unicode解码器**：自动解码Unicode转义序列为可读字符
- **URL解码器**：识别并解码URL编码的字符串
- **可配置性**：支持全局或按编辑器实例单独启用/禁用解码器

### JSON AI 修复

- **自动修复**：使用jsonrepair库自动修复常见格式错误
- **AI智能修复**：借助OpenAI API进行更复杂的JSON修复



## 🐳 Docker 部署

### 使用 Docker Compose（推荐）

```bash
# 构建并启动容器
docker-compose up -d

# 访问 http://localhost:3300 即可使用
```

### 使用 Docker 命令

```bash
# 构建镜像
docker build -t json-tools-next .

# 运行容器
docker run -d -p 3300:80 --name json-tools json-tools-next

# 访问 http://localhost:3300 即可使用
```

## 🚀 快速开始

### 安装依赖

```bash
# 使用pnpm（推荐）
pnpm install

# 或使用npm
npm install

# 或使用yarn
yarn install
```

### 开发环境

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```


## 📈 Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=fevrax/json-tools&type=Date)](https://star-history.com/#dalefengs/json-tools&Date)

## 🤝 贡献

欢迎提交PR、创建Issue或提供功能建议！请查看[贡献指南](CONTRIBUTING.md)了解更多。

## 📝 提交规范

详情查看：[CONTRIBUTING.md](./CONTRIBUTING.md)

本项目使用 [semantic-release](https://github.com/semantic-release/semantic-release) 进行版本管理和自动发布。
为确保正确生成版本号和更新日志，请遵循以下提交消息格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 提交类型（type）

- `feat:` 新功能（触发 minor 版本更新）
- `fix:` 修复bug（触发 patch 版本更新）
- `docs:` 文档更新（不触发版本更新）
- `style:` 代码风格变更（不影响代码功能，不触发版本更新）
- `refactor:` 代码重构（不触发版本更新）
- `perf:` 性能优化（触发 patch 版本更新）
- `test:` 测试相关（不触发版本更新）
- `build:` 构建系统或外部依赖变更（不触发版本更新）
- `ci:` CI配置变更（不触发版本更新）
- `chore:` 其他变更（不触发版本更新）
- `revert:` 撤销之前的提交（触发 patch 版本更新）

### 示例

```
feat(editor): 添加JSON格式化快捷键

添加Ctrl+Shift+F快捷键用于格式化JSON

BREAKING CHANGE: 修改了之前的格式化行为
```

提交符合规范的消息后，semantic-release 会：
1. 根据提交类型自动确定版本号变更（major/minor/patch）
2. 自动生成更新日志（CHANGELOG.md）
3. 创建Git标签
4. 发布GitHub Release

## 🙏 致谢

感谢以下优秀项目的支持：

- [Cursor](https://www.cursor.com/) - 强大的AI代码编辑器
- [uTools](https://u.tools/) - 高效的效率工具平台
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 专业的代码编辑器组件
- [svelte-jsoneditor](https://github.com/josdejong/svelte-jsoneditor/) - 多功能的代码编辑器组件

## 📜 许可证

[MIT License](LICENSE) © 2025 json-tools
