/**
 * Chrome Extension Build Script
 * 用于构建Chrome扩展版本
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ChromeExtensionBuilder {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.extensionDir = __dirname;
    this.distDir = path.join(this.extensionDir, 'dist');
  }

  /**
   * 构建Chrome扩展
   */
  async build() {
    console.log('开始构建Chrome扩展...');
    console.log(`项目根目录: ${this.projectRoot}`);
    console.log(`扩展目录: ${this.extensionDir}`);

    try {
      // 1. 构建主应用
      console.log('步骤1: 构建主应用...');
      await this.buildMainApp();

      // 2. 复制构建产物到扩展目录
      console.log('步骤2: 复制构建产物...');
      await this.copyBuildAssets();

      // 3. 创建扩展特定的文件
      console.log('步骤3: 创建扩展特定文件...');
      await this.createExtensionFiles();

      // 4. 更新manifest.json
      console.log('步骤4: 更新manifest.json...');
      await this.updateManifest();

      console.log('✅ Chrome扩展构建完成！');
      console.log(`📁 扩展目录: ${this.distDir}`);
      console.log('🚀 请在Chrome中加载此目录作为未打包的扩展程序');

    } catch (error) {
      console.error('❌ 构建失败:', error);
      process.exit(1);
    }
  }

  /**
   * 构建主应用
   */
  async buildMainApp() {
    console.log('构建主应用...');
    
    // 切换到项目根目录并执行构建
    process.chdir(this.projectRoot);
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      throw new Error('主应用构建失败: ' + error.message);
    }

    console.log('主应用构建完成');
  }

  /**
   * 复制构建产物
   */
  async copyBuildAssets() {
    console.log('复制构建产物...');

    const sourceDir = path.join(this.projectRoot, 'dist');
    
    // 确保目标目录存在
    if (!fs.existsSync(this.distDir)) {
      fs.mkdirSync(this.distDir, { recursive: true });
    }

    // 复制所有构建产物
    await this.copyDirectory(sourceDir, this.distDir);

    console.log('构建产物复制完成');
  }

  /**
   * 创建扩展特定的文件
   */
  async createExtensionFiles() {
    console.log('创建扩展特定文件...');

    // 处理现有的index.html文件
    await this.processIndexHtml();

    // 复制扩展文件到dist目录
    const extensionFiles = [
      'manifest.json',
      'background.js',
      'content.js',
      'injected.js'
    ];

    for (const file of extensionFiles) {
      const sourcePath = path.join(this.extensionDir, file);
      const targetPath = path.join(this.distDir, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }

    // 复制图标文件
    const sourceIconsDir = path.join(this.extensionDir, 'icons');
    const targetIconsDir = path.join(this.distDir, 'icons');
    
    if (fs.existsSync(sourceIconsDir)) {
      if (!fs.existsSync(targetIconsDir)) {
        fs.mkdirSync(targetIconsDir);
      }
      await this.copyDirectory(sourceIconsDir, targetIconsDir);
    }

    console.log('扩展特定文件创建完成');
  }

  /**
   * 处理现有的index.html文件
   */
  async processIndexHtml() {
    console.log('处理index.html文件...');

    const indexPath = path.join(this.distDir, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    // 提取Monaco环境配置的script标签内容
    const monacoScriptMatch = indexContent.match(/<script>self\[\"MonacoEnvironment\"[\s\S]*?<\/script>/);
    if (monacoScriptMatch) {
      const monacoScriptContent = monacoScriptMatch[0];
      const monacoJsContent = monacoScriptContent.replace(/<\/?script>/g, '');
      
      // 创建main.js文件
      const mainJsPath = path.join(this.distDir, 'main.js');
      fs.writeFileSync(mainJsPath, monacoJsContent + '\n');
      
      // 从index.html中移除Monaco script标签
      indexContent = indexContent.replace(monacoScriptMatch[0], '');
      
      // 在head中添加对main.js的引用
      const headEndMatch = indexContent.match(/<\/head>/);
      if (headEndMatch) {
        indexContent = indexContent.replace(
          headEndMatch[0],
          '    <script type="module" src="./main.js"></script>\n  </head>'
        );
      }
      
      // 重写处理后的index.html
      fs.writeFileSync(indexPath, indexContent);
      
      console.log('✅ 成功提取Monaco配置到main.js并更新index.html');
    } else {
      console.log('⚠️  未找到Monaco环境配置script标签');
    }
  }

  /**
   * 更新manifest.json
   */
  async updateManifest() {
    console.log('更新manifest.json...');

    const manifestPath = path.join(this.distDir, 'manifest.json');
    let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // 更新manifest中的路径引用
    if (manifest.web_accessible_resources) {
      manifest.web_accessible_resources[0].resources.push('main.js', 'assets/*');
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log('manifest.json更新完成');
  }

  /**
   * 递归复制目录
   */
  async copyDirectory(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);

    for (const item of items) {
      const sourcePath = path.join(source, item);
      const targetPath = path.join(target, item);

      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }
}

// 如果直接运行此脚本
if (process.argv[1] && process.argv[1].endsWith('build.js')) {
  const builder = new ChromeExtensionBuilder();
  builder.build().catch(console.error);
}

export default ChromeExtensionBuilder;