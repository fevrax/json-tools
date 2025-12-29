import { useTabStore } from "@/store/useTabStore";

/**
 * Chrome扩展事件监听器管理
 * 
 * 这个类负责管理Chrome插件的监听事件，
 * 包括从background script接收JSON数据。
 * 复用utoolsListener.ts的逻辑结构，但适配Chrome扩展环境。
 */
class ChromeExtensionListener {
  private static instance: ChromeExtensionListener;
  private isInitialized: boolean = false;
  private editorRefs: Record<string, any> = {};

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ChromeExtensionListener {
    if (!ChromeExtensionListener.instance) {
      ChromeExtensionListener.instance = new ChromeExtensionListener();
    }

    return ChromeExtensionListener.instance;
  }

  /**
   * 设置编辑器引用
   */
  public setEditorRefs(editorRefs: Record<string, any>): void {
    this.editorRefs = editorRefs;
  }

  /**
   * 初始化监听器
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    if (typeof window !== "undefined") {
      // 监听来自Chrome扩展的消息
      this.setupMessageListener();
      this.isInitialized = true;
      console.log("Chrome扩展监听器已初始化");
    }
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener(): void {
    // 监听来自Chrome扩展的消息
    window.addEventListener('message', (event) => {
      // 确保消息来源可信
      if (event.source !== window) {
        return;
      }

      if (event.data && event.data.type === 'CHROME_EXTENSION_MESSAGE') {
        this.handleExtensionMessage(event.data.payload);
      }
    });

    // 如果是在Chrome扩展环境中，也监听chrome.runtime消息
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request.type === 'UPDATE_JSON_DATA') {
          this.handleExtensionMessage(request.payload);
          sendResponse({ success: true });
        }
        return true;
      });
    }
  }

  /**
   * 处理Chrome扩展消息
   */
  private handleExtensionMessage(data: any): void {
    try {
      console.log("Chrome扩展消息:", data);
      
      if (data.type === "regex" && data.payload != "") {
        const tabStore = useTabStore.getState();
        const { addTab, activeTab, updateTabContent } = tabStore;

        setTimeout(() => {
          const curTab = activeTab();

          // 当前tab1 且 nextKey 为 2 且tab1内容为空
          if (
            curTab &&
            curTab.key === "1" &&
            tabStore.nextKey === 2 &&
            curTab.content.trim() === ""
          ) {
            // 更新现有标签页内容
            updateTabContent(curTab.key, data.payload);

            // 调用编辑器的 updateValue 方法更新编辑器内容
            const editorRef = this.editorRefs[curTab.key];

            if (editorRef && editorRef.updateValue) {
              editorRef.updateValue(data.payload);
              setTimeout(() => {
                editorRef.format();
              }, 300);
            }
            console.log("Chrome扩展数据已更新到 tab1:", data.payload);
          } else {
            // 创建新标签页，包含来源信息
            const title = data.sourceUrl 
              ? `JSON - ${new URL(data.sourceUrl).hostname}`
              : data.title || "JSON数据";
              
            addTab(title, data.payload);
            console.log("Chrome扩展已创建新标签页:", data.payload);
          }
        }, 100);
      }
    } catch (error) {
      console.error("处理Chrome扩展消息时发生错误:", error);
    }
  }

  /**
   * 检查是否已初始化
   */
  public isListenerInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 检查是否在Chrome扩展环境中
   */
  public isChromeExtensionEnvironment(): boolean {
    return typeof chrome !== 'undefined' && 
           !!(chrome.runtime && chrome.runtime.id);
  }

  /**
   * 向Chrome扩展发送消息
   */
  public sendMessageToExtension(message: any): void {
    if (this.isChromeExtensionEnvironment()) {
      try {
        chrome.runtime.sendMessage(message);
      } catch (error) {
        console.error("发送消息到Chrome扩展失败:", error);
      }
    }
  }

  /**
   * 通知Chrome扩展页面已准备就绪
   */
  public notifyPageReady(): void {
    this.sendMessageToExtension({
      type: 'PAGE_READY',
      timestamp: Date.now()
    });
  }

  /**
   * 通知Chrome扩展当前JSON数据状态
   */
  public notifyJsonDataStatus(tabKey: string, hasValidJson: boolean): void {
    this.sendMessageToExtension({
      type: 'JSON_DATA_STATUS',
      payload: {
        tabKey,
        hasValidJson,
        timestamp: Date.now()
      }
    });
  }
}

export default ChromeExtensionListener;
export { ChromeExtensionListener };