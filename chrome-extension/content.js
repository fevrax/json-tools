/**
 * Chrome Extension Content Script
 * 在页面中注入脚本以检测和处理JSON数据
 */

class ContentScriptManager {
  constructor() {
    this.isInjected = false;
  }

  /**
   * 初始化content script
   */
  initialize() {
    if (this.isInjected) return;

    // 检查是否在受限页面中
    if (this.isRestrictedPage()) {
      console.log('Content Script 跳过受限页面:', window.location.href);
      return;
    }

    // 注入脚本到页面
    this.injectScript();

    this.isInjected = true;
    console.log('Content Script 已初始化');
  }

  /**
   * 注入脚本到页面
   */
  injectScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  /**
   * 检查是否为受限页面
   */
  isRestrictedPage() {
    const url = window.location.href;
    const restrictedProtocols = ['chrome:', 'chrome-extension:', 'moz-extension:', 'edge:', 'opera:'];
    const restrictedDomains = ['extensions', 'extensions-internals'];
    
    try {
      const urlObj = new URL(url);
      
      // 检查协议
      if (restrictedProtocols.includes(urlObj.protocol)) {
        return true;
      }
      
      // 检查域名
      if (restrictedDomains.includes(urlObj.hostname)) {
        return true;
      }
      
      // 检查特殊页面
      if (url.includes('chrome://') || url.includes('about:')) {
        return true;
      }
      
      return false;
    } catch (e) {
      // 如果URL解析失败，认为是受限页面
      return true;
    }
  }
}

// 初始化Content Script
const contentScriptManager = new ContentScriptManager();

// 等待DOM加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    contentScriptManager.initialize();
  });
} else {
  contentScriptManager.initialize();
}