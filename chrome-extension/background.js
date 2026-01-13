/**
 * Chrome Extension Background Script
 * 负责监听标签页更新和检测JSON内容
 */

class ChromeExtensionListener {
  constructor() {
    this.isInitialized = false;
    this.jsonToolsUrl = null;
  }

  /**
   * 初始化后台脚本
   */
  async initialize() {
    if (this.isInitialized) return;

    // 获取插件的JSON Tools页面URL
    this.jsonToolsUrl = chrome.runtime.getURL('index.html');

    // 监听标签页更新事件
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 保持消息通道开放以支持异步响应
    });

    // 监听插件图标点击事件
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });

    this.isInitialized = true;
    console.log('Chrome Extension Listener 已初始化');
  }

  /**
   * 处理标签页更新事件
   */
  async handleTabUpdate(tabId, changeInfo, tab) {
    // 只在页面加载完成时处理
    if (changeInfo.status !== 'complete') return;

    try {
      // 检查是否为受限页面
      if (this.isRestrictedUrl(tab.url)) {
        console.log(`跳过受限页面: ${tab.url}`);
        return;
      }

      // 检查页面是否包含JSON数据
      const hasJson = await this.checkPageForJson(tabId);
      
      if (hasJson) {
        console.log(`检测到JSON数据: ${tab.url}`);
        
        // 获取页面JSON数据
        const jsonData = await this.extractJsonFromPage(tabId);
        
        if (jsonData) {
          // 在当前标签页中打开JSON Tools页面并传递数据
          await this.openJsonToolsWithJson(jsonData, tab.url, tabId);
        }
      }
    } catch (error) {
      console.error('处理标签页更新时发生错误:', error);
    }
  }

  /**
   * 检查页面是否包含JSON数据
   */
  async checkPageForJson(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // 检查页面内容是否为JSON
          const content = document.body.innerText || document.body.textContent;
          
          if (!content || content.trim().length === 0) {
            return false;
          }

          // 尝试解析JSON
          try {
            const trimmedContent = content.trim();
            // 简单检查是否以 { 或 [ 开头
            if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
              JSON.parse(trimmedContent);
              return true;
            }
          } catch (e) {
            // 不是有效的JSON
          }

          // 检查Content-Type header
          const contentType = document.querySelector('meta[http-equiv="content-type"]')?.getAttribute('content');
          if (contentType && contentType.includes('application/json')) {
            return true;
          }

          // 检查页面标题或URL是否暗示这是JSON
          const title = document.title.toLowerCase();
          const url = window.location.href.toLowerCase();
          
          if (title.includes('json') || url.includes('.json') || url.includes('api')) {
            // 再次尝试解析，这次更宽松一些
            try {
              const cleanedContent = content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
              if (cleanedContent.startsWith('{') || cleanedContent.startsWith('[')) {
                JSON.parse(cleanedContent);
                return true;
              }
            } catch (e) {
              // 仍然不是有效的JSON
            }
          }

          return false;
        }
      });

      return results[0]?.result || false;
    } catch (error) {
      console.error('检查页面JSON时发生错误:', error);
      return false;
    }
  }

  /**
   * 从页面提取JSON数据
   */
  async extractJsonFromPage(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const content = document.body.innerText || document.body.textContent;
          
          try {
            // 清理内容并尝试解析
            const cleanedContent = content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
            const jsonData = JSON.parse(cleanedContent);
            
            return {
              data: jsonData,
              rawContent: cleanedContent,
              url: window.location.href,
              title: document.title
            };
          } catch (error) {
            console.error('解析JSON失败:', error);
            return null;
          }
        }
      });

      return results[0]?.result;
    } catch (error) {
      console.error('提取JSON数据时发生错误:', error);
      return null;
    }
  }

  /**
   * 在当前标签页中打开JSON Tools页面并传递数据
   */
  async openJsonToolsWithJson(jsonData, sourceUrl, tabId) {
    try {
      const jsonString = typeof jsonData.data === 'string' 
        ? jsonData.data 
        : JSON.stringify(jsonData.data, null, 2);

      // 直接在当前标签页中打开JSON Tools页面
      await chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL('index.html'),
        active: true
      });

      // 等待页面加载完成后发送数据
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {
          type: 'UPDATE_JSON_DATA',
          payload: {
            type: 'regex',
            payload: jsonString,
            sourceUrl: sourceUrl,
            title: jsonData.title
          }
        });
      }, 2000);
    } catch (error) {
      console.error('打开JSON Tools页面时发生错误:', error);
    }
  }

  /**
   * 检查是否为受限URL
   */
  isRestrictedUrl(url) {
    if (!url) return true;
    
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

  /**
   * 处理插件图标点击事件
   */
  async handleActionClick(tab) {
    try {
      // 在新标签页中打开JSON Tools主页
      await chrome.tabs.create({
        url: chrome.runtime.getURL('index.html'),
        active: true
      });
      
      console.log('插件图标被点击，已打开JSON Tools主页');
    } catch (error) {
      console.error('打开JSON Tools主页时发生错误:', error);
    }
  }

  /**
   * 处理来自content script的消息
   */
  async handleMessage(request, sender, sendResponse) {
    // 检查是否为受限页面
    if (sender.tab && this.isRestrictedUrl(sender.tab.url)) {
      sendResponse({ success: false, message: '受限页面，无法操作' });
      return;
    }

    switch (request.type) {
      case 'CHECK_JSON':
        // 手动检查当前页面是否为JSON
        if (!sender.tab) {
          sendResponse({ success: false, message: '无法获取页面信息' });
          return;
        }

        const hasJson = await this.checkPageForJson(sender.tab.id);
        if (hasJson) {
          const jsonData = await this.extractJsonFromPage(sender.tab.id);
          if (jsonData) {
            await this.openJsonToolsWithJson(jsonData, sender.tab.url, sender.tab.id);
            sendResponse({ success: true, message: 'JSON数据已加载到JSON Tools' });
          } else {
            sendResponse({ success: false, message: '无法解析JSON数据' });
          }
        } else {
          sendResponse({ success: false, message: '当前页面不包含有效的JSON数据' });
        }
        break;



      case 'GET_EXTENSION_STATUS':
        sendResponse({ 
          initialized: this.isInitialized,
          jsonToolsUrl: this.jsonToolsUrl 
        });
        break;

      default:
        sendResponse({ success: false, message: '未知消息类型' });
    }
  }
}

// 初始化Chrome扩展监听器
const chromeExtensionListener = new ChromeExtensionListener();
chromeExtensionListener.initialize();