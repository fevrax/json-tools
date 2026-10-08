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

![250419132143711.png](https://fs.ssooai.com/default/250419132143711-20250419132143726.png)
![250419132241894.png](https://fs.ssooai.com/default/250419132241894-20250419132242640.png)
![250419132405927.png](https://fs.ssooai.com/default/250419132405927-20250419132406260.png)
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

# 访问 http://localhost:3300
```

### 使用 Docker 命令

```bash
# 构建镜像
docker build -t json-tools-next .

# 运行容器
docker run -d -p 3300:80 --name json-tools json-tools-next

# 访问 http://localhost:3300
```

## 🚀 快速开始

### AI 线路与服务端密钥

前端不再内置共享 API Key，也不会在未填写密钥时回退到共享凭据。
浏览器的「站点线路」访问同源 `/api/ai/v1`，由 Docker 容器中的 Nginx
附加服务端密钥。没有配置时返回明确的 503 错误，本地 JSON 工具不受影响。
纯静态部署、开发服务器和 uTools 用户可以在设置中使用自己的私有线路或 uTools AI。

Docker 部署可在容器运行时设置以下环境变量（不要使用 `VITE_*` 或构建参数传入密钥）：

两个 Compose 文件都已在 `environment` 中配置以下变量，无需 `.env`。
直接填写所用 Compose 文件中的 `OPENAI_API_KEY`，留空则关闭站点 AI 线路。
密钥由容器运行时读取，不要提交填写了真实密钥的 Compose 文件。
Compose 文件已从 Docker 构建上下文中排除，避免运行时密钥进入镜像层。

```bash
# 从当前源码构建并启动：
docker compose -f docker-compose-dev.yml up -d --build
```

使用已包含本次修复的发布镜像时，执行 `docker compose up -d`。
修改配置后重新执行对应的 `up -d` 命令使环境变量生效。

- `OPENAI_API_KEY`：OpenAI 兼容服务的 API Key，留空则关闭站点线路。
- `OPENAI_BASE_URL`：OpenAI 兼容 API 的 HTTPS 基础地址，默认 `https://api.ssooai.com/v1`。

代理仅开放聊天和模型列表接口，默认每个 IP 每分钟 6 次请求、突发 3 次、
最多 2 个并发连接，单次请求体限制 1 MiB，支持流式响应和客户端断开取消。
这是一条公开站点线路；部署者应在服务商后台为专用密钥限制可用模型和总额度，
或在入口增加自己的用户鉴权。反向代理部署时应按实际可信代理配置客户端 IP。
可在「设置 → AI 设置 → 站点线路」填写上游支持的模型名称。

**升级时必须在服务商后台撤销此前已公开的旧共享密钥，改用新密钥。**
删除源码中的密钥不会撤销服务商凭据，也不会清除旧构建产物和 Git 历史。

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

### 回归测试

```bash
pnpm test:regressions
```

覆盖格式转换、注释和排序、CSV/XLSX、AI 取消与凭据、服务端代理配置和发布触发逻辑。
可选设置 `TABLE_EXPORT_PYTHON` 为已安装 `openpyxl` 的 Python 路径，额外验证 XLSX 读取兼容性。

### 预览生产构建

```bash
pnpm preview
```


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


## 📈 Stargazers over time
[![Stargazers over time](https://starchart.cc/fevrax/json-tools.svg?variant=adaptive)](https://starchart.cc/fevrax/json-tools)

## 🙏 致谢

感谢以下优秀项目的支持：

- [Cursor](https://www.cursor.com/) - 强大的AI代码编辑器
- [uTools](https://u.tools/) - 高效的效率工具平台
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 专业的代码编辑器组件
- [svelte-jsoneditor](https://github.com/josdejong/svelte-jsoneditor/) - 多功能的代码编辑器组件

## 📜 许可证

[MIT License](LICENSE) © 2025 json-tools
