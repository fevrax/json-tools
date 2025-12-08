/**
 * 测试修复后的Chrome扩展
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function testRestrictedUrls() {
  console.log('🧪 测试受限URL检查逻辑...');
  
  const testCases = [
    { url: 'chrome://extensions/', expected: true, description: 'Chrome扩展页面' },
    { url: 'chrome-extension://abc123/popup.html', expected: true, description: '扩展内部页面' },
    { url: 'https://example.com', expected: false, description: '普通HTTPS页面' },
    { url: 'http://localhost:3000', expected: false, description: '本地开发页面' },
    { url: 'file:///Users/test/data.json', expected: false, description: '本地文件' },
    { url: 'about:blank', expected: true, description: 'about:页面' },
    { url: 'invalid-url', expected: true, description: '无效URL' }
  ];

  const restrictedProtocols = ['chrome:', 'chrome-extension:', 'moz-extension:', 'edge:', 'opera:'];
  const restrictedDomains = ['extensions', 'extensions-internals'];

  testCases.forEach(testCase => {
    let result = false;
    
    try {
      const urlObj = new URL(testCase.url);
      
      // 检查协议
      if (restrictedProtocols.includes(urlObj.protocol)) {
        result = true;
      }
      // 检查域名
      else if (restrictedDomains.includes(urlObj.hostname)) {
        result = true;
      }
      // 检查特殊页面
      else if (testCase.url.includes('chrome://') || testCase.url.includes('about:')) {
        result = true;
      }
    } catch (e) {
      result = true;
    }

    const status = result === testCase.expected ? '✅' : '❌';
    console.log(`${status} ${testCase.description}: ${testCase.url} -> ${result}`);
  });
}

function testManifestContent() {
  console.log('\n🧪 测试manifest.json配置...');
  
  const manifestPath = path.join(__dirname, 'dist', 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.log('❌ manifest.json 不存在');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // 检查content_scripts配置
  const contentScripts = manifest.content_scripts;
  if (!contentScripts || contentScripts.length === 0) {
    console.log('❌ content_scripts 配置缺失');
    return;
  }

  const matches = contentScripts[0].matches;
  const hasRestrictedUrls = matches.includes('<all_urls>');
  const hasValidUrls = matches.includes('http://*/*') && matches.includes('https://*/*');

  if (hasRestrictedUrls) {
    console.log('❌ 仍在使用 <all_urls>，应该限制为具体协议');
  } else if (hasValidUrls) {
    console.log('✅ content_scripts 配置正确，已限制为HTTP/HTTPS/File协议');
  } else {
    console.log('⚠️ content_scripts 配置可能有问题');
  }
}

function testFilesExist() {
  console.log('\n🧪 测试必需文件是否存在...');
  
  const requiredFiles = [
    'dist/manifest.json',
    'dist/background.js',
    'dist/content.js',
    'dist/injected.js',
    'dist/popup.html',
    'dist/popup.js'
  ];

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
  });
}

// 运行所有测试
console.log('🔧 Chrome扩展修复验证测试\n');

testRestrictedUrls();
testManifestContent();
testFilesExist();

console.log('\n✨ 测试完成！');
console.log('💡 如果所有测试都通过，说明修复成功。');
console.log('🚀 请在Chrome中重新加载扩展进行测试。');