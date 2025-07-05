import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { RefObject } from "react";

import { decodeUnicode, UNICODE_STRING_REGEX } from "@/utils/unicode.ts";

// 定义Unicode下划线装饰器接口
export interface UnicodeDecoratorState {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>;
  decorationsRef: RefObject<monaco.editor.IEditorDecorationsCollection | null>;
  decorationIdsRef: RefObject<Record<string, string[]>>;
  hoverProviderId: RefObject<monaco.IDisposable | null>;
  cacheRef: RefObject<Record<string, boolean>>;
  updateTimeoutRef: RefObject<NodeJS.Timeout | null>;
  enabled: boolean;
}

// 全局启用状态控制
let isUnicodeDecorationEnabled = true; // 下划线装饰器全局启用状态
let isUnicodeProviderEnabled = true; // 全局悬浮提供者启用状态

const MAXShowDecodeLength = 100; // 最大显示解码长度

// 注册全局Unicode 悬停提供者
export const registerUnicodeHoverProvider = () => {
  monaco.languages.registerHoverProvider(["json", "json5"], {
    provideHover: (model, position) => {
      // 如果提供者被禁用，直接返回null
      if (!isUnicodeProviderEnabled) return null;

      const lineContent = model.getLineContent(position.lineNumber);
      const wordInfo = model?.getWordAtPosition(position);

      if (!wordInfo) return null;

      // 获取当前行的文本并检查是否包含Unicode序列
      const currentWordRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: Math.max(1, wordInfo.startColumn), // 扩展范围以捕获\u前缀
        endColumn: wordInfo.endColumn, // 扩展范围以捕获可能的后续字符
      };

      const currentWordText = model.getValueInRange(currentWordRange);

      // 尝试直接解码当前单词
      let decoded = decodeUnicode(currentWordText);

      if (!decoded) {
        // 如果直接解码失败，尝试检查当前位置是否在 ": "{unicode内容}" 格式内
        const start = wordInfo.startColumn;
        const end = wordInfo.endColumn;

        // 检查该位置是否在引号内的内容中
        UNICODE_STRING_REGEX.lastIndex = 0;
        let stringMatch;

        while (
          (stringMatch = UNICODE_STRING_REGEX.exec(lineContent)) !== null
        ) {
          const matchStart = stringMatch.index + 3; // ": " 后面的引号位置
          const matchEnd = matchStart + stringMatch[1].length + 1; // 加上引号

          if (start >= matchStart && end <= matchEnd) {
            decoded = decodeUnicode(stringMatch[1]);
            break;
          }
        }

        if (!decoded) {
          return null;
        }
      }

      // 如果解码成功，返回悬停信息
      return {
        contents: [{ value: "**Unicode 解码器**" }, { value: decoded }],
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
 * 更新Unicode下划线装饰器
 * @param editor 编辑器实例
 * @param state Unicode下划线装饰器状态
 */
export const updateUnicodeDecorations = (
  editor: editor.IStandaloneCodeEditor,
  state: UnicodeDecoratorState,
): void => {
  // 如果全局状态或组件状态禁用，则清除装饰器并退出
  if (!editor || !state.enabled || !isUnicodeDecorationEnabled) {
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
      UNICODE_STRING_REGEX.lastIndex = 0;

      // 使用正则表达式查找Unicode转义序列
      let match;
      let matchCount = 0;
      const decorations: monaco.editor.IModelDeltaDecoration[] = [];

      // 处理 ": "{unicode内容}" 格式的内容
      UNICODE_STRING_REGEX.lastIndex = 0;
      matchCount = 0;

      while (
        (match = UNICODE_STRING_REGEX.exec(lineContent)) !== null &&
        matchCount < 100
      ) {
        matchCount++;
        const unicodeStr = match[1];

        const decoded = decodeUnicode(unicodeStr);

        if (!decoded) {
          continue;
        }

        const startColumn = match.index + 3; // ": " 后面的位置
        const endColumn = startColumn + unicodeStr.length;

        const decoration: monaco.editor.IModelDeltaDecoration = {
          range: new monaco.Range(
            lineNumber,
            startColumn,
            lineNumber,
            endColumn + 3,
          ),
          options: {
            inlineClassName: "unicode-decoration",
            zIndex: 3000,
            after: {
              content: `(${decoded})`,
              inlineClassName: "timestamp-decoration",
            },
          },
        };

        // 如果解码后内容太长，不显示after装饰
        if (decoded.length > MAXShowDecodeLength) {
          decoration.options.after = null;
          decoration.range = new monaco.Range(
            lineNumber,
            startColumn,
            lineNumber,
            endColumn,
          );
        }

        decorations.push(decoration);
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
 * 处理编辑器内容变化时更新Unicode下划线装饰器
 * @param e 编辑器内容变化事件
 * @param state Unicode下划线装饰器状态
 */
export const handleUnicodeContentChange = (
  e: editor.IModelContentChangedEvent,
  state: UnicodeDecoratorState,
): void => {
  // 如果装饰器全局禁用，则直接返回
  if (!isUnicodeDecorationEnabled || !state.enabled) {
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
      updateUnicodeDecorations(state.editorRef.current, state);
    }
  }, 200);
};

/**
 * 清理Unicode缓存
 * @param state Unicode下划线装饰器状态
 */
export const clearUnicodeCache = (state: UnicodeDecoratorState): void => {
  state.cacheRef.current = {};
};

/**
 * 获取Unicode下划线装饰器的全局启用状态
 */
export const getUnicodeDecorationEnabled = (): boolean => {
  return isUnicodeDecorationEnabled;
};

/**
 * 设置Unicode下划线装饰器的全局启用状态
 * @param enabled 是否启用
 */
export const setUnicodeDecorationEnabled = (enabled: boolean): void => {
  isUnicodeDecorationEnabled = enabled;
};

/**
 * 设置Unicode悬停提供者的启用状态
 * @param enabled 是否启用
 */
export const setUnicodeProviderEnabled = (enabled: boolean) => {
  isUnicodeProviderEnabled = enabled;
};

/**
 * 获取Unicode悬停提供者的当前启用状态
 */
export const getUnicodeProviderEnabled = (): boolean => {
  return isUnicodeProviderEnabled;
};
