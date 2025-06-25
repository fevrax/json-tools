import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { RefObject } from "react";

// 定义Unicode装饰器接口
export interface UnicodeDecoratorState {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>;
  decorationsRef: RefObject<monaco.editor.IEditorDecorationsCollection | null>;
  decorationIdsRef: RefObject<Record<string, string[]>>;
  hoverProviderId: RefObject<monaco.IDisposable | null>;
  cacheRef: RefObject<Record<string, boolean>>;
  updateTimeoutRef: RefObject<NodeJS.Timeout | null>;
  enabled: boolean;
}

// Unicode编码模式，匹配如 \u0041 或 \u{1F600} 的格式
const UNICODE_REGEX = /\\u([0-9a-fA-F]{4})|\\u\{([0-9a-fA-F]{1,6})\}/g;

/**
 * 解码Unicode字符串
 * @param text 包含Unicode编码的字符串
 * @returns 解码后的字符串，如果无法解码则返回null
 */
export const decodeUnicode = (text: string): string | null => {
  try {
    // 替换所有Unicode转义序列
    const decoded = text.replace(
      UNICODE_REGEX,
      (_match, fourDigits, variableDigits) => {
        const codePoint = parseInt(fourDigits || variableDigits, 16);

        return String.fromCodePoint(codePoint);
      },
    );

    // 如果解码后没有变化，返回null
    if (decoded === text) {
      return null;
    }

    return decoded;
  } catch (e) {
    console.error("Unicode decode error:", e);

    return null;
  }
};

/**
 * 检查字符串是否包含Unicode转义序列
 * @param text 要检查的字符串
 * @returns 是否包含Unicode转义序列
 */
export const containsUnicode = (text: string): boolean => {
  UNICODE_REGEX.lastIndex = 0;

  return UNICODE_REGEX.test(text);
};

/**
 * 注册Unicode装饰器的悬停提供者
 * @param editor 编辑器实例
 * @param state Unicode装饰器状态
 */
export const registerUnicodeHoverProvider = (
  editor: editor.IStandaloneCodeEditor,
  state: UnicodeDecoratorState,
): void => {
  if (!state.enabled || state.hoverProviderId.current) {
    return;
  }

  // 注册悬停提供者
  state.hoverProviderId.current = monaco.languages.registerHoverProvider("*", {
    provideHover: (model, position) => {
      if (!state.enabled) return null;

      // const lineContent = model.getLineContent(position.lineNumber);
      const wordInfo = editor.getModel()?.getWordAtPosition(position);

      if (!wordInfo) return null;

      // 获取当前行的文本并检查是否包含Unicode序列
      const currentWordRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: Math.max(1, wordInfo.startColumn - 2), // 扩展范围以捕获\u前缀
        endColumn: wordInfo.endColumn + 2, // 扩展范围以捕获可能的后续字符
      };

      const currentWordText = model.getValueInRange(currentWordRange);

      const decoded = decodeUnicode(currentWordText);

      if (!decoded) {
        return null;
      }

      // 如果解码成功，返回悬停信息
      return {
        contents: [{ value: "**Unicode 解码**" }, { value: decoded }],
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
 * 更新Unicode装饰器
 * @param editor 编辑器实例
 * @param state Unicode装饰器状态
 */
export const updateUnicodeDecorations = (
  editor: editor.IStandaloneCodeEditor,
  state: UnicodeDecoratorState,
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

      // 超过长度的代码跳过以提高性能
      if (lineContent.length > 1000) {
        continue;
      }

      // 复位正则表达式的lastIndex
      UNICODE_REGEX.lastIndex = 0;

      // 使用正则表达式查找Unicode转义序列
      let match;
      let matchCount = 0;
      const decorations: monaco.editor.IModelDeltaDecoration[] = [];

      while (
        (match = UNICODE_REGEX.exec(lineContent)) !== null &&
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
            inlineClassName: "unicode-decoration",
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
 * 处理编辑器内容变化时更新Unicode装饰器
 * @param e 编辑器内容变化事件
 * @param state Unicode装饰器状态
 */
export const handleUnicodeContentChange = (
  e: editor.IModelContentChangedEvent,
  state: UnicodeDecoratorState,
): void => {
  if (!state.enabled) {
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
 * @param state Unicode装饰器状态
 */
export const clearUnicodeCache = (state: UnicodeDecoratorState): void => {
  state.cacheRef.current = {};
};

/**
 * 切换Unicode装饰器状态
 * @param editor 编辑器实例
 * @param state Unicode装饰器状态
 * @param enabled 是否启用装饰器
 * @returns 是否成功切换
 */
export const toggleUnicodeDecorators = (
  editor: editor.IStandaloneCodeEditor | null,
  state: UnicodeDecoratorState,
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
    // 启用装饰器时，注册悬停提供者和更新装饰器
    registerUnicodeHoverProvider(editor, state);
    clearUnicodeCache(state);
    setTimeout(() => {
      updateUnicodeDecorations(editor, state);
    }, 0);
  } else {
    // 禁用装饰器时，清除现有装饰和注销悬停提供者
    if (state.decorationsRef.current) {
      state.decorationsRef.current.clear();
    }
    if (state.hoverProviderId.current) {
      state.hoverProviderId.current.dispose();
      state.hoverProviderId.current = null;
    }
    clearUnicodeCache(state);
  }

  return true;
};
