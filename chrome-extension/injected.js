/**
 * Injected Script - 在页面上下文中运行
 * 用于检测JSON数据变化和处理页面交互
 */

(function() {
  // 避免重复注入
  if (window.__jsonToolsInjected) {
    return;
  }
  window.__jsonToolsInjected = true;

  class JsonPageDetector {
    constructor() {
      this.originalContent = null;
      this.observer = null;
      this.isJsonPage = false;
    }

    /**
     * 初始化检测器
     */
    initialize() {
      this.checkPageType();
      this.setupObserver();
      this.setupEventListeners();
      
      console.log('JSON Tools 页面检测器已初始化');
    }

    /**
     * 检查页面类型
     */
    checkPageType() {
      const content = document.body.innerText || document.body.textContent;
      
      if (!content || content.trim().length === 0) {
        this.isJsonPage = false;
        return;
      }

      try {
        const trimmedContent = content.trim();
        if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
          JSON.parse(trimmedContent);
          this.isJsonPage = true;
          this.originalContent = trimmedContent;
          this.notifyPageTypeChange(true);
        }
      } catch (e) {
        this.isJsonPage = false;
      }
    }

    /**
     * 设置MutationObserver监听页面变化
     */
    setupObserver() {
      if (!window.MutationObserver) {
        return;
      }

      this.observer = new MutationObserver((mutations) => {
        let shouldRecheck = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.target === document.body) {
            shouldRecheck = true;
          }
        });

        if (shouldRecheck) {
          // 延迟检查，避免频繁触发
          setTimeout(() => {
            const wasJsonPage = this.isJsonPage;
            this.checkPageType();
            
            if (wasJsonPage !== this.isJsonPage) {
              this.notifyPageTypeChange(this.isJsonPage);
            }
          }, 500);
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
      // 监听URL变化（适用于SPA应用）
      let currentUrl = window.location.href;
      setInterval(() => {
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          setTimeout(() => this.checkPageType(), 1000);
        }
      }, 1000);

      // 监听页面可见性变化
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          setTimeout(() => this.checkPageType(), 500);
        }
      });
    }

    /**
     * 通知页面类型变化
     */
    notifyPageTypeChange(isJsonPage) {
      // 通过自定义事件通知content script
      const event = new CustomEvent('jsonToolsPageTypeChange', {
        detail: { isJsonPage, url: window.location.href }
      });
      document.dispatchEvent(event);
    }

    /**
     * 获取当前JSON数据
     */
    getCurrentJsonData() {
      if (!this.isJsonPage) {
        return null;
      }

      try {
        const content = document.body.innerText || document.body.textContent;
        const cleanedContent = content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
        const jsonData = JSON.parse(cleanedContent);
        
        return {
          data: jsonData,
          rawContent: cleanedContent,
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('获取JSON数据失败:', error);
        return null;
      }
    }

    /**
     * 清理资源
     */
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }
  }

  // 创建并初始化检测器
  const detector = new JsonPageDetector();
  
  // 等待页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      detector.initialize();
    });
  } else {
    detector.initialize();
  }

  // 暴露接口到全局，供content script调用
  window.__jsonToolsDetector = detector;

})();