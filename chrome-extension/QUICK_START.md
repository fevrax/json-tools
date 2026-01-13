# Chrome扩展快速开始指南

## 🚀 快速安装和测试

### 1. 构建扩展
```bash
npm run build:extension
```

### 2. 安装到Chrome
1. 打开Chrome浏览器
2. 地址栏输入：`chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 `chrome-extension/dist` 目录
6. 扩展安装成功！

### 3. 验证安装
```bash
npm run test:extension
```
应该看到：`所有测试通过！扩展已准备就绪。`

### 4. 测试功能

#### 方法一：使用测试页面
1. 在浏览器中打开：`chrome-extension/test-pages/test.html`
2. 点击"加载JSON数据"按钮
3. 扩展应该自动检测并打开JSON Tools

#### 方法二：访问真实API
1. 访问：`https://jsonplaceholder.typicode.com/posts/1`
2. 扩展应该自动检测JSON并打开JSON Tools

#### 方法三：手动触发
1. 在任何页面点击扩展图标
2. 点击"检查当前页面"

## ✅ 预期行为

- **自动检测**：页面包含JSON时自动打开JSON Tools
- **浮动按钮**：检测到JSON时显示蓝色"JSON Tools"按钮
- **智能管理**：重用已打开的JSON Tools标签页
- **错误处理**：无效JSON被自动忽略

## 🛠️ 故障排除

### 扩展无法加载
```bash
# 重新构建
npm run build:extension

# 检查测试
npm run test:extension
```

### 无法检测JSON
1. 检查页面内容是否为有效JSON
2. 打开开发者工具查看控制台错误
3. 尝试手动点击扩展图标

### 构建失败
```bash
# 清理并重新构建
rm -rf dist
npm run build:extension
```

## 📁 重要文件

- `chrome-extension/dist/` - 构建完成的扩展文件
- `chrome-extension/test-pages/test.html` - 功能测试页面
- `chrome-extension/manifest.json` - 扩展配置文件
- `src/services/chromeExtensionListener.ts` - 核心集成逻辑

## 🎯 下一步

1. 在Chrome中测试各种JSON数据源
2. 体验自动检测功能
3. 尝试不同的JSON格式和大小
4. 根据需要自定义扩展配置

---

🎉 **恭喜！Chrome扩展已成功构建并准备使用！**