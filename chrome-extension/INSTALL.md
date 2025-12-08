# Chrome扩展安装和使用指南

## 快速开始

### 1. 构建扩展

在项目根目录执行以下命令：

```bash
# 安装依赖（如果还没有安装）
npm install

# 构建Chrome扩展
npm run build:extension
```

### 2. 安装到Chrome

1. 打开Chrome浏览器
2. 在地址栏输入 `chrome://extensions/` 并回车
3. 打开右上角的"开发者模式"开关
4. 点击"加载已解压的扩展程序"按钮
5. 选择项目中的 `chrome-extension/dist` 目录
6. 扩展安装完成，会在扩展列表中看到"JSON Tools"

### 3. 测试扩展

#### 方法一：使用测试页面

1. 在浏览器中打开 `chrome-extension/test-pages/test.html`
2. 点击页面上的"加载JSON数据"按钮
3. 扩展应该会自动检测到JSON并打开JSON Tools

#### 方法二：访问真实的JSON API

1. 访问任何返回JSON数据的API端点，例如：
   - `https://jsonplaceholder.typicode.com/posts/1`
   - `https://api.github.com/users/octocat`
2. 扩展应该会自动检测并打开JSON Tools

#### 方法三：手动触发

1. 在任何页面上点击扩展图标
2. 在弹窗中点击"检查当前页面"
3. 如果页面包含JSON数据，会自动在JSON Tools中打开

## 功能说明

### 自动检测模式

扩展会自动检测以下情况：
- 页面内容是有效的JSON格式
- URL包含 `.json`、`api` 或 `json` 关键词
- 页面标题包含"json"关键词
- Content-Type为 `application/json`

### 浮动按钮

当检测到页面包含JSON数据时，会在页面右上角显示蓝色的"JSON Tools"浮动按钮，点击即可快速打开。

### 多标签页管理

- 如果JSON Tools已经打开，会在现有标签页中更新数据
- 如果没有打开，会创建新的标签页
- 支持同时处理多个JSON数据源

## 故障排除

### 扩展无法加载

1. 确保已正确构建扩展：`npm run build:extension`
2. 检查 `chrome-extension/dist` 目录是否存在
3. 在Chrome扩展页面查看错误信息

### 无法检测JSON

1. 确保页面内容是有效的JSON格式
2. 检查浏览器控制台是否有错误
3. 尝试手动点击扩展图标中的"检查当前页面"

### JSON Tools页面无法打开

1. 确保主应用已正确构建
2. 检查manifest.json中的路径配置
3. 查看background script的错误日志

## 开发调试

### 查看日志

1. **Background Script日志**：
   - 进入 `chrome://extensions/`
   - 找到JSON Tools扩展
   - 点击"检查视图" -> "Service Worker"

2. **Content Script日志**：
   - 在目标页面按F12打开开发者工具
   - 查看Console面板

3. **JSON Tools页面日志**：
   - 在JSON Tools页面按F12
   - 查看Console面板

### 重新加载扩展

修改代码后：
1. 在 `chrome://extensions/` 页面点击扩展的刷新按钮
2. 或者重新运行构建命令：`npm run build:extension`

### 测试不同场景

使用提供的测试页面 `chrome-extension/test-pages/test.html` 来测试：
- 简单JSON数据
- 复杂嵌套JSON
- API响应模拟
- 无效JSON数据

## 文件结构说明

```
chrome-extension/
├── manifest.json          # 扩展配置文件
├── background.js           # 后台脚本，处理标签页监听
├── content.js             # 内容脚本，注入到网页
├── injected.js            # 注入脚本，在页面上下文中运行
├── popup.html             # 扩展弹窗界面
├── popup.js               # 弹窗交互逻辑
├── build.js               # 构建脚本
├── test-extension.js      # 测试脚本
├── create-icons.js        # 图标生成脚本
├── icons/                 # 扩展图标
├── test-pages/            # 测试页面
├── dist/                  # 构建输出目录
├── README.md              # 详细说明文档
└── INSTALL.md             # 本安装指南
```

## 权限说明

扩展请求的权限：

- **activeTab**: 访问当前活动标签页内容
- **storage**: 存储扩展设置和状态
- **scripting**: 在页面中注入脚本
- **<all_urls>**: 访问所有网站以检测JSON内容

所有权限仅用于JSON检测和展示功能，不会收集或传输用户数据。

## 联系支持

如果遇到问题：

1. 查看GitHub Issues
2. 检查浏览器控制台错误信息
3. 确保使用最新版本的扩展
4. 提供详细的错误信息和复现步骤

---

**注意**: 这是一个开发版本的扩展，建议在生产环境使用前进行充分测试。