import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { RefObject } from "react";
import {UNICODE_REGEX} from "@/utils/unicode.ts";

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

/**
 * 更新Unicode下划线装饰器
 * @param editor 编辑器实例
 * @param state Unicode下划线装饰器状态
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
 * 处理编辑器内容变化时更新Unicode下划线装饰器
 * @param e 编辑器内容变化事件
 * @param state Unicode下划线装饰器状态
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
 * @param state Unicode下划线装饰器状态
 */
export const clearUnicodeCache = (state: UnicodeDecoratorState): void => {
  state.cacheRef.current = {};
};
