/**
 * Chrome扩展测试脚本
 * 用于验证扩展功能是否正常工作
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ExtensionTester {
  constructor() {
    this.extensionDir = path.resolve(__dirname);
    this.distDir = path.join(this.extensionDir, 'dist');
  }

  /**
   * 运行所有测试
   */
  async runTests() {
    console.log('开始测试Chrome扩展...\n');

    const tests = [
      this.testManifestExists,
      this.testRequiredFiles,
      this.testManifestStructure,
      this.testContentScript,
      this.testBackgroundScript,
      this.testPopupFiles
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        await test.call(this);
        passed++;
        console.log('✅ 通过');
      } catch (error) {
        failed++;
        console.log(`❌ 失败: ${error.message}`);
      }
      console.log('');
    }

    console.log(`\n测试完成: ${passed} 通过, ${failed} 失败`);

    if (failed > 0) {
      console.log('\n请修复失败的测试后重试');
      process.exit(1);
    } else {
      console.log('\n所有测试通过！扩展已准备就绪。');
    }
  }

  /**
   * 测试manifest.json是否存在
   */
  testManifestExists() {
    console.log('测试 manifest.json 是否存在...');
    
    const manifestPath = path.join(this.distDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('manifest.json 文件不存在');
    }
  }

  /**
   * 测试必需文件是否存在
   */
  testRequiredFiles() {
    console.log('测试必需文件是否存在...');
    
    const requiredFiles = [
      'manifest.json',
      'background.js',
      'content.js',
      'injected.js',
      'popup.html',
      'popup.js'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.distDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`必需文件缺失: ${file}`);
      }
    }
  }

  /**
   * 测试manifest.json结构
   */
  testManifestStructure() {
    console.log('测试 manifest.json 结构...');
    
    const manifestPath = path.join(this.distDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // 检查必需字段
    const requiredFields = ['manifest_version', 'name', 'version', 'permissions'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        throw new Error(`manifest.json 缺少必需字段: ${field}`);
      }
    }

    // 检查manifest版本
    if (manifest.manifest_version !== 3) {
      throw new Error('manifest_version 应该是 3');
    }

    // 检查权限
    const requiredPermissions = ['activeTab', 'storage', 'scripting'];
    for (const permission of requiredPermissions) {
      if (!manifest.permissions.includes(permission)) {
        throw new Error(`缺少必需权限: ${permission}`);
      }
    }
  }

  /**
   * 测试content script
   */
  testContentScript() {
    console.log('测试 content script...');
    
    const contentScriptPath = path.join(this.distDir, 'content.js');
    const content = fs.readFileSync(contentScriptPath, 'utf8');

    // 检查关键函数
    const requiredFunctions = [
      'ContentScriptManager',
      'initialize',
      'checkIsJsonPage',
      'addFloatingButton'
    ];

    for (const func of requiredFunctions) {
      if (!content.includes(func)) {
        throw new Error(`content.js 缺少关键函数: ${func}`);
      }
    }
  }

  /**
   * 测试background script
   */
  testBackgroundScript() {
    console.log('测试 background script...');
    
    const backgroundScriptPath = path.join(this.distDir, 'background.js');
    const content = fs.readFileSync(backgroundScriptPath, 'utf8');

    // 检查关键函数
    const requiredFunctions = [
      'ChromeExtensionListener',
      'initialize',
      'checkPageForJson',
      'extractJsonFromPage',
      'openJsonToolsWithJson'
    ];

    for (const func of requiredFunctions) {
      if (!content.includes(func)) {
        throw new Error(`background.js 缺少关键函数: ${func}`);
      }
    }
  }

  /**
   * 测试popup文件
   */
  testPopupFiles() {
    console.log('测试 popup 文件...');
    
    // 检查popup.html
    const popupHtmlPath = path.join(this.distDir, 'popup.html');
    const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
    
    if (!popupHtml.includes('popup.js')) {
      throw new Error('popup.html 未引用 popup.js');
    }

    // 检查popup.js
    const popupJsPath = path.join(this.distDir, 'popup.js');
    const popupJs = fs.readFileSync(popupJsPath, 'utf8');
    
    const requiredFunctions = ['PopupManager', 'initialize', 'openJsonTools'];
    for (const func of requiredFunctions) {
      if (!popupJs.includes(func)) {
        throw new Error(`popup.js 缺少关键函数: ${func}`);
      }
    }
  }
}

// 如果直接运行此脚本
if (process.argv[1] && process.argv[1].endsWith('test-extension.js')) {
  const tester = new ExtensionTester();
  tester.runTests().catch(console.error);
}

export default ExtensionTester;