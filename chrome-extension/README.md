# JSON Tools Chrome 扩展

这是一个Chrome扩展，用于自动检测浏览器中的JSON数据并使用JSON Tools进行可视化展示。

## 功能特性

- 🔍 **自动检测**: 自动检测页面中的JSON数据
- 📊 **可视化展示**: 使用JSON Tools的强大功能展示JSON数据
- 🚀 **快速访问**: 通过浮动按钮或扩展弹窗快速打开JSON Tools
- 🔄 **实时同步**: 支持SPA应用的动态JSON内容检测
- 📱 **响应式**: 适配各种屏幕尺寸

## 安装方法

### 方法一：开发模式安装

1. 克隆项目到本地
2. 构建扩展：
   ```bash
   npm run build:extension
   ```
3. 打开Chrome浏览器，进入 `chrome://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择项目中的 `chrome-extension/dist` 目录

### 方法二：使用预构建版本

如果你有预构建的扩展包，可以直接在Chrome中加载。

## 使用方法

### 自动检测模式

1. 浏览包含JSON数据的网页
2. 扩展会自动检测JSON内容
3. 如果检测到JSON，会自动打开JSON Tools页面进行可视化

### 手动触发模式

1. 在任何页面上点击扩展图标
2. 点击"检查当前页面"按钮
3. 如果页面包含JSON数据，会自动在JSON Tools中打开

### 浮动按钮

当检测到页面包含JSON数据时，页面右上角会显示一个蓝色的"JSON Tools"浮动按钮，点击即可快速打开。

## 技术架构

### 文件结构

```
chrome-extension/
├── manifest.json          # 扩展清单文件
├── background.js           # 后台脚本
├── content.js             # 内容脚本
├── injected.js            # 注入脚本
├── popup.html             # 弹窗HTML
├── popup.js               # 弹窗脚本
├── build.js               # 构建脚本
├── icons/                 # 图标目录
├── dist/                  # 构建输出目录
└── README.md              # 说明文档
```

### 核心组件

#### Background Script (background.js)
- 监听标签页更新事件
- 检测页面JSON内容
- 管理JSON Tools标签页

#### Content Script (content.js)
- 在页面中注入脚本
- 添加浮动按钮
- 与background script通信

#### Injected Script (injected.js)
- 在页面上下文中运行
- 检测JSON数据变化
- 监听SPA应用的路由变化

#### Chrome Extension Listener (chromeExtensionListener.ts)
- 复用utoolsListener.ts的逻辑
- 处理来自扩展的消息
- 更新JSON Tools中的数据

## 开发说明

### 构建扩展

```bash
# 创建图标文件（可选）
npm run create:extension-icons

# 构建主应用和扩展
npm run build:extension

# 测试扩展功能
npm run test:extension
```

### 调试扩展

1. 在Chrome中加载扩展后，可以在以下位置查看日志：
   - Background Script: `chrome://extensions/` -> 扩展详情 -> "检查视图"
   - Content Script: 页面开发者工具的Console
   - JSON Tools页面: F12开发者工具

### 修改扩展代码

扩展的主要逻辑文件：
- `chrome-extension/background.js`: 后台逻辑
- `chrome-extension/content.js`: 页面交互
- `src/services/chromeExtensionListener.ts`: 与主应用的集成

修改后需要重新构建：
```bash
npm run build:extension
```

然后在Chrome扩展页面点击刷新按钮。

## 权限说明

扩展需要以下权限：

- `activeTab`: 访问当前活动标签页
- `storage`: 存储扩展设置
- `scripting`: 在页面中注入脚本
- `<all_urls>`: 访问所有网站以检测JSON内容

## 故障排除

### 扩展无法检测JSON

1. 确保页面内容确实是有效的JSON格式
2. 检查浏览器控制台是否有错误信息
3. 尝试手动点击"检查当前页面"按钮

### JSON Tools页面无法打开

1. 确保已正确构建扩展
2. 检查manifest.json中的路径是否正确
3. 查看background script的错误日志

### 浮动按钮不显示

1. 确保页面被识别为JSON页面
2. 检查content script是否正确注入
3. 查看页面控制台是否有JavaScript错误

## 贡献

欢迎提交Issue和Pull Request来改进这个扩展。

## 许可证

与主项目保持一致的许可证。