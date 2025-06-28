import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { RefObject } from "react";

import {
  BASE64_REGEX,
  checkBase64Strict,
  decodeBase64Strict,
} from "@/utils/base64.ts";

// 定义Base64下划线装饰器接口
export interface Base64DecoratorState {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>;
  decorationsRef: RefObject<monaco.editor.IEditorDecorationsCollection | null>;
  decorationIdsRef: RefObject<Record<string, string[]>>;
  hoverProviderId: RefObject<monaco.IDisposable | null>;
  cacheRef: RefObject<Record<string, boolean>>;
  updateTimeoutRef: RefObject<NodeJS.Timeout | null>;
  enabled: boolean;
}

// 全局启用状态控制
let isBase64DecorationEnabled = true; // 下划线装饰器状态
let isBase64ProviderEnabled = true; // 全局Base64悬停提供者状态

// 注册全局Base64悬停提供者
export const registerBase64HoverProvider = () => {
  monaco.languages.registerHoverProvider(["json", "json5"], {
    provideHover: (model, position) => {
      // 如果提供者被禁用，直接返回null
      if (!isBase64ProviderEnabled) return null;

      const lineContent = model.getLineContent(position.lineNumber);
      const wordInfo = model?.getWordAtPosition(position);

      if (!wordInfo) return null;

      // 获取当前词的范围
      const start = wordInfo.startColumn;
      const end = wordInfo.endColumn;
      const word = lineContent.substring(start - 1, end - 1);

      const decoded = decodeBase64Strict(word);

      if (!decoded) {
        return null;
      }

      // 如果解码成功，返回悬停信息
      return {
        contents: [
          { value: "**Base64 解码器**" },
          { value: "```\n" + decoded + "\n```" },
        ],
        range: new monaco.Range(
          position.lineNumber,
          start,
          position.lineNumber,
          end,
        ),
      };
    },
  });
};

/**
 * 更新Base64下划线装饰器
 * @param editor 编辑器实例
 * @param state Base64下划线装饰器状态
 */
export const updateBase64Decorations = (
  editor: editor.IStandaloneCodeEditor,
  state: Base64DecoratorState,
): void => {
  // 如果全局状态或组件状态禁用，则清除装饰器并退出
  if (!editor || !state.enabled || !isBase64DecorationEnabled) {
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
      BASE64_REGEX.lastIndex = 0;

      // 使用正则表达式查找可能的Base64字符串
      let match;
      let matchCount = 0;

      while (
        (match = BASE64_REGEX.exec(lineContent)) !== null &&
        matchCount < 100
      ) {
        matchCount++;
        const base64Str = match[1] || match[2];

        if (base64Str.length < 8 || base64Str.length > 2000) {
          continue;
        }

        if (!checkBase64Strict(base64Str)) {
          continue;
        }

        const startColumn = match.index + (match[0].startsWith(": ") ? 4 : 1);
        const endColumn = startColumn + base64Str.length;
        const decorations: monaco.editor.IModelDeltaDecoration[] = [
          {
            range: new monaco.Range(
              lineNumber,
              startColumn,
              lineNumber,
              endColumn,
            ),
            options: {
              inlineClassName: "base64-decoration",
              zIndex: 2999,
            },
          },
        ];

        let lineDecorations =
          state.editorRef.current?.getLineDecorations(lineNumber);

        // 删除重新设置装饰器
        if (lineDecorations) {
          for (let i = lineDecorations.length - 1; i >= 0; i--) {
            let lineDecoration = lineDecorations[i];

            if (lineDecoration.options.zIndex === 2999) {
              state.editorRef.current?.removeDecorations([lineDecoration.id]);
              break;
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
 * 处理编辑器内容变化时更新Base64下划线装饰器
 * @param e 编辑器内容变化事件
 * @param state Base64下划线装饰器状态
 */
export const handleBase64ContentChange = (
  e: editor.IModelContentChangedEvent,
  state: Base64DecoratorState,
): void => {
  // 如果装饰器全局禁用，则直接返回
  if (!isBase64DecorationEnabled || !state.enabled) {
    return;
  }

  if (state.updateTimeoutRef.current) {
    clearTimeout(state.updateTimeoutRef.current);
  }

  state.updateTimeoutRef.current = setTimeout(() => {
    // 内容发生变化则base64需要重新计算
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
      updateBase64Decorations(state.editorRef.current, state);
    }
  }, 200);
};

/**
 * 清理Base64缓存
 * @param state Base64下划线装饰器状态
 */
export const clearBase64Cache = (state: Base64DecoratorState): void => {
  state.cacheRef.current = {};
};

/**
 * 切换Base64下划线装饰器状态
 * @param editor 编辑器实例
 * @param state Base64下划线装饰器状态
 * @param enabled 是否启用装饰器
 * @returns 操作是否成功
 */
export const toggleBase64Decorators = (
  editor: editor.IStandaloneCodeEditor | null,
  state: Base64DecoratorState,
  enabled: boolean,
): boolean => {
  if (!editor) return false;

  // 更新状态
  state.enabled = enabled;

  if (enabled) {
    // 启用时，清空缓存并重新计算装饰器
    clearBase64Cache(state);
    updateBase64Decorations(editor, state);
  } else {
    // 禁用时清除所有装饰器
    if (state.decorationsRef.current) {
      state.decorationsRef.current.clear();
    }
  }

  return true;
};

/**
 * 获取Base64下划线装饰器的全局启用状态
 */
export const getBase64DecorationEnabled = (): boolean => {
  return isBase64DecorationEnabled;
};

/**
 * 设置Base64下划线装饰器的全局启用状态
 * @param enabled 是否启用
 */
export const setBase64DecorationEnabled = (enabled: boolean): void => {
  isBase64DecorationEnabled = enabled;
};

/**
 * 设置Base64悬停提供者的启用状态
 * @param enabled 是否启用
 */
export const setBase64ProviderEnabled = (enabled: boolean) => {
  isBase64ProviderEnabled = enabled;
};

/**
 * 获取Base64悬停提供者的当前启用状态
 */
export const getBase64ProviderEnabled = (): boolean => {
  return isBase64ProviderEnabled;
};
