import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { RefObject } from "react";

// URL编码正则表达式 - 匹配%xx形式的编码
export const URL_REGEX = /%(?:[0-9a-fA-F]{2})+/g;

// URL解码函数
export const decodeUrl = (text: string): string | null => {
  try {
    if (!text || !text.match(URL_REGEX)) {
      return null;
    }

    return decodeURIComponent(text);
  } catch (e) {
    return null;
  }
};

// 定义URL下划线装饰器接口
export interface UrlDecoratorState {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>;
  decorationsRef: RefObject<monaco.editor.IEditorDecorationsCollection | null>;
  decorationIdsRef: RefObject<Record<string, string[]>>;
  hoverProviderId: RefObject<monaco.IDisposable | null>;
  cacheRef: RefObject<Record<string, boolean>>;
  updateTimeoutRef: RefObject<NodeJS.Timeout | null>;
  enabled: boolean;
}

// 全局启用状态控制
let isUrlDecorationEnabled = true; // 下划线装饰器全局启用状态
let isUrlProviderEnabled = true; // 全局悬浮提供者启用状态

// 注册全局URL解码悬停提供者
export const registerUrlHoverProvider = () => {
  monaco.languages.registerHoverProvider(["json", "json5"], {
    provideHover: (model, position) => {
      // 如果提供者被禁用，直接返回null
      if (!isUrlProviderEnabled) return null;
      const wordInfo = model?.getWordAtPosition(position);

      if (!wordInfo) return null;

      // 获取当前行的文本并检查是否包含URL编码序列
      const currentWordRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: Math.max(1, wordInfo.startColumn), // 扩展范围以捕获%前缀
        endColumn: wordInfo.endColumn, // 扩展范围以捕获可能的后续字符
      };

      const currentWordText = model.getValueInRange(currentWordRange);

      const decoded = decodeUrl(currentWordText);

      if (!decoded) {
        return null;
      }

      // 如果解码成功，返回悬停信息
      return {
        contents: [{ value: "**URL 解码器**" }, { value: decoded }],
        range: new monaco.Range(
          position.lineNumber,
          currentWordRange.startColumn,
          position.lineNumber,
          currentWordRange.endColumn,
        ),
      };
    },
  });
};

/**
 * 更新URL下划线装饰器
 * @param editor 编辑器实例
 * @param state URL下划线装饰器状态
 */
export const updateUrlDecorations = (
  editor: editor.IStandaloneCodeEditor,
  state: UrlDecoratorState,
): void => {
  // 如果全局状态或组件状态禁用，则清除装饰器并退出
  if (!editor || !state.enabled || !isUrlDecorationEnabled) {
    if (state.decorationsRef.current) {
      state.decorationsRef.current.clear();
    }

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

      // 超过长度的代码跳过以提高性能
      if (lineContent.length > 1000) {
        continue;
      }

      // 复位正则表达式的lastIndex
      URL_REGEX.lastIndex = 0;

      // 使用正则表达式查找URL编码序列
      let match;
      let matchCount = 0;
      const decorations: monaco.editor.IModelDeltaDecoration[] = [];

      while (
        (match = URL_REGEX.exec(lineContent)) !== null &&
        matchCount < 100
      ) {
        matchCount++;

        const startColumn = match.index + 1;
        const endColumn = startColumn + match[0].length;

        decorations.push({
          range: new monaco.Range(
            lineNumber,
            startColumn,
            lineNumber,
            endColumn,
          ),
          options: {
            inlineClassName: "url-decoration",
            zIndex: 3000,
          },
        });
      }

      if (decorations.length > 0) {
        let lineDecorations =
          state.editorRef.current?.getLineDecorations(lineNumber);

        // 删除之前的装饰器
        if (lineDecorations) {
          for (let i = lineDecorations.length - 1; i >= 0; i--) {
            let lineDecoration = lineDecorations[i];

            if (lineDecoration.options.zIndex === 3000) {
              state.editorRef.current?.removeDecorations([lineDecoration.id]);
            }
          }
        }

        let ids = state.decorationIdsRef.current[lineNumber];

        if (ids && ids.length > 0) {
          state.editorRef.current?.removeDecorations(ids);
        }

        state.decorationIdsRef.current[lineNumber] =
          state.decorationsRef.current?.append(decorations);
      }
    }
  }
};

/**
 * 处理编辑器内容变化时更新URL下划线装饰器
 * @param e 编辑器内容变化事件
 * @param state URL下划线装饰器状态
 */
export const handleUrlContentChange = (
  e: editor.IModelContentChangedEvent,
  state: UrlDecoratorState,
): void => {
  // 如果装饰器全局禁用，则直接返回
  if (!isUrlDecorationEnabled || !state.enabled) {
    return;
  }

  if (state.updateTimeoutRef.current) {
    clearTimeout(state.updateTimeoutRef.current);
  }

  state.updateTimeoutRef.current = setTimeout(() => {
    // 内容发生变化时需要重新计算
    if (e.changes && e.changes.length > 0) {
      const regex = new RegExp(e.eol, "g");

      for (let i = 0; i < e.changes.length; i++) {
        let startLineNumber = e.changes[i].range.startLineNumber;
        let endLineNumber = e.changes[i].range.endLineNumber;

        // 当只有变化一行时，判断一下更新的内容是否有 \n
        if (endLineNumber - startLineNumber == 0) {
          const matches = e.changes[i].text.match(regex);

          if (matches) {
            endLineNumber = endLineNumber + matches?.length;
          }
        }

        for (let sLine = startLineNumber; sLine <= endLineNumber; sLine++) {
          // 设置行需要重新检测
          state.cacheRef.current[sLine] = false;
        }
      }
    }

    if (state.editorRef.current) {
      updateUrlDecorations(state.editorRef.current, state);
    }
  }, 200);
};

/**
 * 清理URL缓存
 * @param state URL下划线装饰器状态
 */
export const clearUrlCache = (state: UrlDecoratorState): void => {
  state.cacheRef.current = {};
};

/**
 * 获取URL下划线装饰器的全局启用状态
 */
export const getUrlDecorationEnabled = (): boolean => {
  return isUrlDecorationEnabled;
};

/**
 * 设置URL下划线装饰器的全局启用状态
 * @param enabled 是否启用
 */
export const setUrlDecorationEnabled = (enabled: boolean): void => {
  isUrlDecorationEnabled = enabled;
};

/**
 * 设置URL悬停提供者的启用状态
 * @param enabled 是否启用
 */
export const setUrlProviderEnabled = (enabled: boolean) => {
  isUrlProviderEnabled = enabled;
};

/**
 * 获取URL悬停提供者的当前启用状态
 */
export const getUrlProviderEnabled = (): boolean => {
  return isUrlProviderEnabled;
};
