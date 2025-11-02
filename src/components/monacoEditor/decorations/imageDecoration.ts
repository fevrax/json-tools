import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { RefObject } from "react";

import { DecorationManager } from "./decorationManager.ts";

// 图片URL正则表达式，支持多种图片格式
export const IMAGE_URL_REGEX =
  /(https?:\/\/\S*\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?\S*)?)/gi;

// 最大显示解码长度（图片URL）
const MAX_DISPLAY_URL_LENGTH = 60;

// 最大匹配数量限制
const MAX_MATCH_COUNT = 100;

// 定义图片装饰器接口
export interface ImageDecoratorState {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>;
  hoverProviderId: RefObject<monaco.IDisposable | null>;
  updateTimeoutRef: RefObject<NodeJS.Timeout | null>;
  decorationManagerRef: RefObject<DecorationManager | null>;
  cacheRef: RefObject<Record<string, boolean>>;
  enabled: boolean;
  theme: string;
  editorPrefix?: string; // 编辑器类型前缀，用于区分左右编辑器
}

// 主题检测工具函数
const getCurrentTheme = (): string => {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

// 全局启用状态控制
let isImageDecorationEnabled = true; // 下划线装饰器全局启用状态
let isImageProviderEnabled = true; // 全局图片悬停提供者启用状态

/**
 * 注册全局图片悬停提供者
 */
export const registerImageHoverProvider = () => {
  monaco.languages.registerHoverProvider(["json", "json5"], {
    provideHover: (model, position) => {
      // 如果提供者被禁用，直接返回null
      if (!isImageProviderEnabled) return null;

      const lineContent = model.getLineContent(position.lineNumber);
      const wordInfo = model?.getWordAtPosition(position);

      if (!wordInfo) return null;

      // 检查当前位置是否在图片URL中
      IMAGE_URL_REGEX.lastIndex = 0;
      const match = IMAGE_URL_REGEX.exec(lineContent);

      if (!match) return null;

      const imageUrl = match[0];
      const urlStart = match.index;
      const urlEnd = urlStart + imageUrl.length;

      // 检查光标位置是否在URL范围内
      const cursorPos = wordInfo.startColumn;

      if (cursorPos < urlStart + 1 || cursorPos > urlEnd) {
        return null;
      }

      // 返回悬停信息
      return {
        contents: [
          { value: "**图片预览**" },
          { value: "![图片](<点此在新窗口中打开>)\n\n" + imageUrl },
        ],
        range: new monaco.Range(
          position.lineNumber,
          urlStart + 1,
          position.lineNumber,
          urlEnd,
        ),
      };
    },
  });
};

// 图片预览弹窗管理器
class ImagePreviewManager {
  private static instance: ImagePreviewManager;
  private currentPreview: HTMLElement | null = null;
  private themeObserver: MutationObserver | null = null;

  static getInstance(): ImagePreviewManager {
    if (!ImagePreviewManager.instance) {
      ImagePreviewManager.instance = new ImagePreviewManager();
    }

    return ImagePreviewManager.instance;
  }

  private setupThemeObserver() {
    if (this.themeObserver) return;

    this.themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          // 如果有当前预览，重新渲染以应用新主题
          if (this.currentPreview) {
            const imageUrl = this.currentPreview.getAttribute("data-image-url");
            const positionStr =
              this.currentPreview.getAttribute("data-position");

            if (imageUrl && positionStr) {
              try {
                const position = JSON.parse(positionStr);
                const currentTheme = getCurrentTheme();

                this.hideImagePreview();
                setTimeout(() => {
                  this.showImagePreview(imageUrl, position, currentTheme);
                }, 100);
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      });
    });

    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  showImagePreview(
    imageUrl: string,
    position: { x: number; y: number },
    theme: string = "light",
  ) {
    this.hideImagePreview();

    // 设置主题监听器
    this.setupThemeObserver();

    const preview = document.createElement("div");
    const isDarkMode = theme === "dark";

    // 保存数据用于主题切换时重新渲染
    preview.setAttribute("data-image-url", imageUrl);
    preview.setAttribute("data-position", JSON.stringify(position));

    preview.className = "image-preview-container";
    preview.style.cssText = `
      position: fixed;
      background: ${isDarkMode ? "#1f2937" : "#ffffff"};
      border: 1px solid ${isDarkMode ? "#374151" : "#e5e7eb"};
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)"},
                  0 2px 4px -1px ${isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.06)"};
      padding: 16px;
      z-index: 100000;
      max-width: min(90vw, 650px);
      max-height: 85vh;
      overflow: hidden;
      cursor: pointer;
      backdrop-filter: blur(20px);
      animation: fadeInScale 0.2s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;

    const img = document.createElement("img");

    img.src = imageUrl;
    img.style.cssText = `
      max-width: 100%;
      max-height: 50vh;
      min-height: 120px;
      display: block;
      border-radius: 12px;
      object-fit: contain;
    `;

    const loading = document.createElement("div");

    const loadingBgColor = isDarkMode ? "#374151" : "#e5e7eb";
    const loadingAccentColor = isDarkMode ? "#60a5fa" : "#3b82f6";

    loading.innerHTML = `
      <div class="loading-content" style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 30px; color: ${isDarkMode ? "#9ca3af" : "#6b7280"};">
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, ${loadingAccentColor} 0deg 90deg, ${loadingBgColor} 90deg);
          animation: spin 1s linear infinite;
          position: relative;
        ">
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${isDarkMode ? "#1f2937" : "#ffffff"};
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          "></div>
        </div>
        <div style="font-size: 16px; font-weight: 500;">加载图片中...</div>
      </div>
      <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeInScale { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
      </style>
    `;

    const closeBtn = document.createElement("div");

    closeBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    closeBtn.style.cssText = `
      position: absolute; top: 12px; right: 12px; width: 28px; height: 28px;
      background: ${isDarkMode ? "rgba(239, 68, 68, 0.9)" : "rgba(220, 38, 38, 0.9)"};
      color: white; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      font-size: 12px; font-weight: bold; transition: all 0.2s ease; z-index: 10;
      backdrop-filter: blur(10px); border: 1px solid ${isDarkMode ? "rgba(239, 68, 68, 0.3)" : "rgba(220, 38, 38, 0.3)"};
    `;

    const displayUrl =
      imageUrl.length > MAX_DISPLAY_URL_LENGTH
        ? imageUrl.substring(0, MAX_DISPLAY_URL_LENGTH) + "..."
        : imageUrl;

    const linkInfo = document.createElement("div");

    const linkBgColor = isDarkMode ? "#374151" : "#f3f4f6";
    const linkTextColor = isDarkMode ? "#9ca3af" : "#6b7280";
    const linkBorderColor = isDarkMode ? "#4b5563" : "#e5e7eb";

    linkInfo.innerHTML = `
      <div style="margin-top: 16px; padding: 12px 16px; background: ${linkBgColor}; border-radius: 8px; font-size: 12px; color: ${linkTextColor}; word-break: break-all; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; cursor: pointer; transition: all 0.2s ease; border: 1px solid ${linkBorderColor};" title="${imageUrl}">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="flex: 1;">${displayUrl}</span>
        </div>
      </div>
    `;

    img.onerror = () => {
      img.style.display = "none";

      // 隐藏加载提示，但保留链接信息在底部
      const loadingContent = loading.querySelector(
        ".loading-content",
      ) as HTMLElement;

      if (loadingContent) {
        loadingContent.style.display = "none";
      }

      // 在loading容器内添加错误提示，这样不会影响底部链接的位置
      const errorText = document.createElement("div");

      const errorBgColor = isDarkMode ? "#1f2937" : "#f9fafb";
      const errorTextColor = isDarkMode ? "#9ca3af" : "#6b7280";
      const errorBorderColor = isDarkMode ? "#374151" : "#e5e7eb";
      const errorIconColor = isDarkMode ? "#6b7280" : "#9ca3af";

      errorText.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 30px; color: ${errorTextColor}; background: ${errorBgColor}; border-radius: 12px; margin: 8px 0; border: 1px solid ${errorBorderColor};">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${errorIconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <div style="font-size: 16px; font-weight: 500;">图片加载失败</div>
          <div style="font-size: 14px; opacity: 0.7;">请检查图片链接是否有效</div>
        </div>
      `;

      // 将错误提示添加到loading容器中，确保链接信息保持在底部
      loading.appendChild(errorText);
    };

    preview.appendChild(loading);
    preview.appendChild(img);
    preview.appendChild(closeBtn);
    preview.appendChild(linkInfo);

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const previewRect = { width: 400, height: 300 };

    let left = Math.min(
      Math.max(10, position.x + 10),
      viewportWidth - previewRect.width - 10,
    );
    let top = Math.min(
      Math.max(10, position.y + 10),
      viewportHeight - previewRect.height - 10,
    );

    preview.style.left = `${left}px`;
    preview.style.top = `${top}px`;

    const hidePreview = () => this.hideImagePreview();

    closeBtn.onclick = hidePreview;

    // 添加关闭按钮悬停效果
    closeBtn.onmouseenter = () => {
      closeBtn.style.transform = "scale(1.1)";
      closeBtn.style.background = isDarkMode
        ? "rgba(239, 68, 68, 1)"
        : "rgba(220, 38, 38, 1)";
    };

    closeBtn.onmouseleave = () => {
      closeBtn.style.transform = "scale(1)";
      closeBtn.style.background = isDarkMode
        ? "rgba(239, 68, 68, 0.9)"
        : "rgba(220, 38, 38, 0.9)";
    };

    img.onload = () => {
      // 隐藏加载提示内容
      const loadingContent = loading.querySelector(
        ".loading-content",
      ) as HTMLElement;

      if (loadingContent) {
        loadingContent.style.display = "none";
      }
      img.style.display = "block";

      const previewRect = preview.getBoundingClientRect();

      if (left + previewRect.width > viewportWidth) {
        left = Math.max(10, viewportWidth - previewRect.width - 10);
        preview.style.left = `${left}px`;
      }
      if (top + previewRect.height > viewportHeight) {
        top = Math.max(10, viewportHeight - previewRect.height - 10);
        preview.style.top = `${top}px`;
      }
    };

    const linkInfoElement = linkInfo.querySelector("div");

    if (linkInfoElement) {
      linkInfoElement.onclick = async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(imageUrl);
          const originalText = linkInfoElement.innerHTML;

          linkInfoElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span style="flex: 1;">已复制到剪贴板</span>
            </div>
          `;
          linkInfoElement.style.background = isDarkMode ? "#065f46" : "#10b981";
          linkInfoElement.style.color = "white";
          linkInfoElement.style.borderColor = isDarkMode
            ? "#047857"
            : "#059669";
          setTimeout(() => {
            linkInfoElement.innerHTML = originalText;
            linkInfoElement.style.background = isDarkMode
              ? "#374151"
              : "#f3f4f6";
            linkInfoElement.style.color = isDarkMode ? "#9ca3af" : "#6b7280";
            linkInfoElement.style.borderColor = isDarkMode
              ? "#4b5563"
              : "#e5e7eb";
          }, 2000);
        } catch (err) {
          console.error("复制失败:", err);
        }
      };

      // 添加悬停效果
      linkInfoElement.onmouseenter = () => {
        linkInfoElement.style.background = isDarkMode ? "#4b5563" : "#e5e7eb";
        linkInfoElement.style.transform = "translateY(-1px)";
      };

      linkInfoElement.onmouseleave = () => {
        if (!linkInfoElement.innerHTML.includes("已复制")) {
          linkInfoElement.style.background = isDarkMode ? "#374151" : "#f3f4f6";
          linkInfoElement.style.transform = "translateY(0)";
        }
      };
    }

    // 设置图片为可点击状态
    img.style.cursor = "zoom-in";

    preview.onclick = (e) => {
      if (e.target === preview || e.target === img) {
        window.open(imageUrl, "_blank", "noopener,noreferrer");
      }
    };

    // 移除预览盒子的悬停动画效果，保持静态显示

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hidePreview();
        document.removeEventListener("keydown", handleEsc);
        document.removeEventListener("click", handleOutsideClick);
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (preview && !preview.contains(e.target as Node)) {
        hidePreview();
        document.removeEventListener("keydown", handleEsc);
        document.removeEventListener("click", handleOutsideClick);
      }
    };

    document.addEventListener("keydown", handleEsc);
    setTimeout(
      () => document.addEventListener("click", handleOutsideClick),
      100,
    );

    document.body.appendChild(preview);
    this.currentPreview = preview;
  }

  hideImagePreview() {
    if (this.currentPreview) {
      document.body.removeChild(this.currentPreview);
      this.currentPreview = null;
    }
  }
}

// 添加图片按钮样式，支持编辑器类型前缀
export function addImageButtonStyles(
  className: string,
  editorPrefix: string = "",
) {
  const prefixedClassName = editorPrefix
    ? `${editorPrefix}-${className}`
    : className;
  const existingStyle = document.getElementById(prefixedClassName);

  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement("style");

  style.id = prefixedClassName;
  style.textContent = `
    .${prefixedClassName} {
      display: inline-block; width: 18px; height: 18px; margin-left: 4px;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>');
      background-repeat: no-repeat; background-position: center; background-size: contain;
      cursor: pointer; border-radius: 3px; vertical-align: middle;
      opacity: 0.8; transition: all 0.2s ease; color: transparent !important;
      font-size: 0 !important; line-height: 0 !important;
    }
    .${prefixedClassName}:hover { opacity: 1; background-color: rgba(16, 185, 129, 0.15); transform: scale(1.1); }
    .monaco-editor.vs-dark .${prefixedClassName}, .monaco-editor.hc-black .${prefixedClassName} {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="%2334d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>');
    }
    .monaco-editor.vs-dark .${prefixedClassName}:hover, .monaco-editor.hc-black .${prefixedClassName}:hover {
      background-color: rgba(52, 211, 153, 0.15);
    }
  `;
  document.head.appendChild(style);
}

/**
 * 更新图片装饰器
 * @param editor 编辑器实例
 * @param state 图片装饰器状态
 */
export const updateImageDecorations = (
  editor: editor.IStandaloneCodeEditor,
  state: ImageDecoratorState,
): void => {
  // 如果全局状态或组件状态禁用，则清除装饰器并退出
  if (!editor || !state.enabled || !isImageDecorationEnabled) {
    if (state.decorationManagerRef.current) {
      state.decorationManagerRef.current.clearAllDecorations(editor);
    }

    return;
  }

  // 初始化装饰器管理器
  if (!state.decorationManagerRef.current) {
    state.decorationManagerRef.current = new DecorationManager(5000);
  }

  const decorationManager = state.decorationManagerRef.current;

  // 获取可见范围内的文本
  const visibleRanges = editor.getVisibleRanges();

  if (!visibleRanges.length) return;

  const model = editor.getModel();

  if (!model) return;

  // 定期清理过期缓存
  decorationManager.cleanupExpiredCache();

  // 遍历可见范围内的每一行
  for (const range of visibleRanges) {
    for (
      let lineNumber = range.startLineNumber;
      lineNumber <= range.endLineNumber;
      lineNumber++
    ) {
      const lineContent = model.getLineContent(lineNumber);

      // 使用装饰器管理器检查是否需要处理此行
      if (!decorationManager.shouldProcessLine(lineNumber, lineContent, 1000)) {
        continue;
      }

      // 更新内容缓存
      decorationManager.updateContentCache(lineNumber, lineContent);

      // 复位正则表达式
      IMAGE_URL_REGEX.lastIndex = 0;

      let match;
      let matchCount = 0;
      const decorations: monaco.editor.IModelDeltaDecoration[] = [];
      const matchedUrls: {
        url: string;
        className: string;
        startColumn: number;
      }[] = [];

      while (
        (match = IMAGE_URL_REGEX.exec(lineContent)) !== null &&
        matchCount < MAX_MATCH_COUNT
      ) {
        matchCount++;

        const imageUrl = match[0];
        const startColumn = match.index + 1;
        const endColumn = startColumn + imageUrl.length;
        const editorPrefix = state.editorPrefix || "normal";
        const className = `image-btn-${lineNumber}-${startColumn}`;
        const prefixedClassName = `${editorPrefix}-${className}`;

        matchedUrls.push({
          url: imageUrl,
          className: prefixedClassName,
          startColumn,
        });
        addImageButtonStyles(className, editorPrefix);

        decorations.push({
          range: new monaco.Range(
            lineNumber,
            startColumn,
            lineNumber,
            endColumn + 3,
          ),
          options: {
            inlineClassName: `${prefixedClassName}-url`,
            after: { content: "🖼️", inlineClassName: prefixedClassName },
            zIndex: 3000, // 使用统一的z-index
          },
        });
      }

      // 清理旧行装饰器并应用新装饰器
      decorationManager.clearLineDecorations(editor, lineNumber);

      if (decorations.length > 0) {
        decorationManager.applyDecorations(editor, decorations);
        setTimeout(() => {
          matchedUrls.forEach((urlInfo) => {
            const buttonElement = document.querySelector(
              `.${urlInfo.className}`,
            );

            if (buttonElement) {
              buttonElement.addEventListener("mouseenter", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = buttonElement.getBoundingClientRect();

                ImagePreviewManager.getInstance().showImagePreview(
                  urlInfo.url,
                  {
                    x: rect.right,
                    y: rect.top,
                  },
                  state.theme,
                );
              });
            }
          });
        }, 300);
      }
    }
  }
};

/**
 * 处理编辑器内容变化时更新图片装饰器
 * @param e 编辑器内容变化事件
 * @param state 图片装饰器状态
 */
export const handleImageContentChange = (
  e: editor.IModelContentChangedEvent,
  state: ImageDecoratorState,
): void => {
  if (!isImageDecorationEnabled || !state.enabled) {
    return;
  }

  if (state.updateTimeoutRef.current) {
    clearTimeout(state.updateTimeoutRef.current);
  }

  state.updateTimeoutRef.current = setTimeout(() => {
    if (!state.editorRef.current || !state.decorationManagerRef.current) {
      return;
    }

    const editor = state.editorRef.current;
    const decorationManager = state.decorationManagerRef.current;
    const model = editor.getModel();

    // 检查是否为完全替换
    const isFullReplacement =
      model &&
      e.changes.some(
        (change) =>
          change.range.startLineNumber === 1 &&
          change.range.endLineNumber >= model.getLineCount(),
      );

    if (isFullReplacement) {
      decorationManager.clearAllDecorations(editor);
    } else if (e.changes && e.changes.length > 0) {
      const regex = new RegExp(e.eol, "g");

      e.changes.forEach((change) => {
        let startLineNumber = change.range.startLineNumber;
        let endLineNumber = change.range.endLineNumber;

        if (endLineNumber - startLineNumber === 0) {
          const matches = change.text.match(regex);

          if (matches) {
            endLineNumber = endLineNumber + matches.length;
          }
        }

        decorationManager.clearRangeDecorations(
          editor,
          startLineNumber,
          endLineNumber,
        );
      });
    }

    updateImageDecorations(editor, state);
  }, 300);
};

/**
 * 清理图片装饰器缓存
 * @param state 图片装饰器状态
 */
export const clearImageCache = (state: ImageDecoratorState): void => {
  state.cacheRef.current = {};
  if (state.editorRef.current && state.decorationManagerRef.current) {
    state.decorationManagerRef.current.clearAllDecorations(
      state.editorRef.current,
    );
  }

  // 关闭所有预览弹窗
  ImagePreviewManager.getInstance().hideImagePreview();
};

/**
 * 切换图片装饰器状态
 * @param editor 编辑器实例
 * @param state 图片装饰器状态
 * @param enabled 是否启用装饰器
 * @returns 是否成功切换
 */
export const toggleImageDecorators = (
  editor: editor.IStandaloneCodeEditor | null,
  state: ImageDecoratorState,
  enabled?: boolean,
): boolean => {
  if (!editor) {
    return false;
  }

  // 如果没有提供参数，则切换状态
  const newState = enabled !== undefined ? enabled : !state.enabled;

  // 更新状态
  state.enabled = newState;

  // 立即应用更改
  if (newState) {
    // 启用装饰器时，立即更新
    clearImageCache(state);
    setTimeout(() => {
      updateImageDecorations(editor, state);
    }, 0);
  } else {
    // 禁用装饰器时，清除现有装饰
    if (state.decorationManagerRef.current) {
      state.decorationManagerRef.current.clearAllDecorations(editor);
    }
    clearImageCache(state);
  }

  return true;
};

/**
 * 获取图片装饰器的全局启用状态
 */
export const getImageDecorationEnabled = (): boolean => {
  return isImageDecorationEnabled;
};

/**
 * 设置图片装饰器的全局启用状态
 * @param enabled 是否启用
 */
export const setImageDecorationEnabled = (enabled: boolean): void => {
  isImageDecorationEnabled = enabled;
  if (!enabled) {
    ImagePreviewManager.getInstance().hideImagePreview();
  }
};

/**
 * 设置图片悬停提供者的启用状态
 * @param enabled 是否启用
 */
export const setImageProviderEnabled = (enabled: boolean) => {
  isImageProviderEnabled = enabled;
};

/**
 * 获取图片悬停提供者的当前启用状态
 */
export const getImageProviderEnabled = (): boolean => {
  return isImageProviderEnabled;
};
