import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { RefObject } from "react";

// 定义时间戳转换黑名单关键字
export const TIMESTAMP_BLACKLIST = ["id", "url", "size", "count", "length"];

// 时间戳装饰器接口
export interface TimestampDecoratorState {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>;
  decorationsRef: RefObject<monaco.editor.IEditorDecorationsCollection | null>;
  decorationIdsRef: RefObject<Record<string, string[]>>;
  updateTimeoutRef: RefObject<NodeJS.Timeout | null>;
  cacheRef: RefObject<Record<string, boolean>>;
  enabled: boolean;
}

/**
 * 更新时间戳装饰器
 * @param editor 编辑器实例
 * @param state 时间戳装饰器状态
 */
export const updateTimestampDecorations = (
  editor: editor.IStandaloneCodeEditor,
  state: TimestampDecoratorState,
): void => {
  if (!editor || !state.enabled) {
    return;
  }

  // 获取可见范围内的文本
  const visibleRanges = editor.getVisibleRanges();

  if (!visibleRanges.length) return;

  const model = editor.getModel();

  if (!model) return;

  const cache = state.cacheRef.current;

  if (!state.decorationsRef.current) {
    state.decorationsRef.current = editor.createDecorationsCollection();
  }

  // 遍历可见范围内的每一行
  for (const range of visibleRanges) {
    for (
      let lineNumber = range.startLineNumber;
      lineNumber <= range.endLineNumber;
      lineNumber++
    ) {
      const lineContent = model.getLineContent(lineNumber);

      // 当前行已处理则跳过
      if (cache[lineNumber]) {
        continue;
      } else {
        cache[lineNumber] = true;
      }

      // 超过长度或折叠的代码
      if (lineContent.length > 800) {
        continue;
      }

      // 检查该行是否包含黑名单中的字段
      const hasBlacklistedField = TIMESTAMP_BLACKLIST.some((keyword) => {
        const pattern = new RegExp(`"\\s*\\w*${keyword}\\w*\\s*"\\s*:`, "i");

        return pattern.test(lineContent);
      });

      // 如果包含黑名单中的字段，则跳过时间戳转换
      if (hasBlacklistedField) {
        continue;
      }

      // 使用正则表达式查找可能的时间戳
      const regex =
        /(?:"(\d{10}|\d{13})"|(?<!\d)(\d{10}|\d{13})(?!\d))(?=,|\s|$|:|]|})/g;
      let match;

      while ((match = regex.exec(lineContent)) !== null) {
        const timestamp = match[1] || match[2];

        const humanReadableTime = timestampToHumanReadable(timestamp);

        if (humanReadableTime) {
          const startColumn = match.index + match[0].indexOf(timestamp) + 1;
          const endColumn = startColumn + timestamp.length;

          const decoration: monaco.editor.IModelDeltaDecoration[] = [
            {
              range: new monaco.Range(
                lineNumber,
                startColumn,
                lineNumber,
                endColumn + 1,
              ),
              options: {
                after: {
                  content: `(${humanReadableTime}) `,
                  inlineClassName: "timestamp-decoration",
                },
              },
            },
          ];
          const ids = state.decorationIdsRef.current[lineNumber];
          if (ids && ids.length > 0) {
            state.editorRef.current?.removeDecorations(ids);
          }

          state.decorationIdsRef.current[lineNumber] =
            state.decorationsRef.current?.append(decoration);
        }
      }
    }
  }
};

/**
 * 将时间戳转换为人类可读的时间
 * @param timestamp 时间戳字符串
 * @returns 格式化的日期时间字符串
 */
export const timestampToHumanReadable = (timestamp: string): string => {
  try {
    const ts = parseInt(timestamp);
    // 处理10位(秒)和13位(毫秒)时间戳
    const date = new Date(ts.toString().length === 10 ? ts * 1000 : ts);

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return "";
    }

    // 检查日期是否在1970年到2199年之间
    const year = date.getFullYear();

    if (year < 1970 || year > 2199) {
      return "";
    }

    return date.toLocaleString();
  } catch (e) {
    return "";
  }
};

/**
 * 清理时间戳缓存
 * @param state 时间戳装饰器状态
 */
export const clearTimestampCache = (state: TimestampDecoratorState): void => {
  state.cacheRef.current = {};
};

/**
 * 切换时间戳装饰器状态
 * @param editor 编辑器实例
 * @param state 时间戳装饰器状态
 * @param enabled 是否启用装饰器
 * @returns 是否成功切换
 */
export const toggleTimestampDecorators = (
  editor: editor.IStandaloneCodeEditor | null,
  state: TimestampDecoratorState,
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
    clearTimestampCache(state);
    setTimeout(() => {
      updateTimestampDecorations(editor, state);
    }, 0);
  } else {
    // 禁用装饰器时，清除现有装饰
    if (state.decorationsRef.current) {
      state.decorationsRef.current.clear();
    }
    clearTimestampCache(state);
  }

  return true;
};

/**
 * 添加时间戳装饰器样式
 */
export const addTimestampDecorationStyles = (): HTMLStyleElement => {
  const styleElement = document.createElement("style");

  styleElement.className = "timestamp-decoration-style";
  styleElement.textContent = `
    .timestamp-decoration {
      font-size: 0.85em;
      margin-left: 4px;
      opacity: 0.7;
      color: #0a84ff;
    }
    .monaco-editor.vs-dark .timestamp-decoration,
    .monaco-editor.hc-black .timestamp-decoration {
      color: #7eb9ff;
    }
  `;

  document.head.appendChild(styleElement);

  return styleElement;
};

/**
 * 移除时间戳装饰器样式
 */
export const removeTimestampDecorationStyles = (): void => {
  const styleElement = document.querySelector(
    "style.timestamp-decoration-style",
  );

  if (styleElement) {
    document.head.removeChild(styleElement);
  }
};
