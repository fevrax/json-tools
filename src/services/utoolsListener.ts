import { useTabStore } from "@/store/useTabStore";

/**
 * Utools 事件监听器管理
 *
 * 这个类负责管理 utools 插件的监听事件，
 * 包括插件进入时的数据处理。
 */
class UtoolsListener {
  private static instance: UtoolsListener;
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): UtoolsListener {
    if (!UtoolsListener.instance) {
      UtoolsListener.instance = new UtoolsListener();
    }

    return UtoolsListener.instance;
  }

  /**
   * 初始化监听器
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    if (typeof window !== "undefined" && (window as any).utools) {
      (window as any).utools.onPluginEnter((data: any) => {
        this.handlePluginEnter(data);
      });
      this.isInitialized = true;
      console.log("Utools 监听器已初始化");
    }
  }

  /**
   * 处理插件进入事件
   */
  private handlePluginEnter(data: any): void {
    try {
      if (data.type === "regex") {
        // 使用 useTabStore 的 addTab 方法
        const { addTab } = useTabStore.getState();

        setTimeout(() => {
          addTab(undefined, data.payload);
        }, 100);
        console.log("Utools 插件进入事件已处理:", data);
      }
    } catch (error) {
      console.error("处理 Utools 插件进入事件时发生错误:", error);
    }
  }

  /**
   * 检查是否已初始化
   */
  public isListenerInitialized(): boolean {
    return this.isInitialized;
  }
}

export default UtoolsListener;
export { UtoolsListener };
