import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { RefObject } from "react";
import { Base64 } from "js-base64";
import validator from "validator";

// 定义Base64装饰器接口
export interface Base64DecoratorState {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>;
  decorationsRef: RefObject<monaco.editor.IEditorDecorationsCollection | null>;
  hoverProviderId: RefObject<monaco.IDisposable | null>;
  cacheRef: RefObject<Record<string, boolean>>;
  updateTimeoutRef: RefObject<NodeJS.Timeout | null>;
  enabled: boolean;
}

const BASE64_REGEX =
  /(?:"([A-Za-z0-9+/\-_]{12,}={0,3})"|(?<!")([A-Za-z0-9+/\-_]{12,}={0,3})(?!"))(?=,|\s|$|:|]|})/g;

/**
 * 注册Base64装饰器的悬停提供者
 * @param editor 编辑器实例
 * @param state Base64装饰器状态
 */
export const registerBase64HoverProvider = (
  editor: editor.IStandaloneCodeEditor,
  state: Base64DecoratorState,
): void => {
  if (!state.enabled || state.hoverProviderId.current) {
    return;
  }

  // 注册悬停提供者
  state.hoverProviderId.current = monaco.languages.registerHoverProvider("*", {
    provideHover: (model, position) => {
      if (!state.enabled) return null;

      const lineContent = model.getLineContent(position.lineNumber);
      const wordInfo = editor.getModel()?.getWordAtPosition(position);

      if (!wordInfo) return null;

      // 获取当前词的范围
      const start = wordInfo.startColumn;
      const end = wordInfo.endColumn;
      const word = lineContent.substring(start - 1, end - 1);

      // 检查是否是Base64字符串
      if (!validator.isBase64(word)) {
        console.log("Not a valid Base64 string");

        return null;
      }

      const decoded = Base64.decode(word);

      if (!decoded) {
        return null;
      }

      // 如果解码成功，返回悬停信息
      return {
        contents: [
          { value: "**Base64 解码**" },
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
 * 更新Base64装饰器
 * @param editor 编辑器实例
 * @param state Base64装饰器状态
 */
export const updateBase64Decorations = (
  editor: editor.IStandaloneCodeEditor,
  state: Base64DecoratorState,
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

  const decorations: monaco.editor.IModelDeltaDecoration[] = [];

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

        console.log(`Line ${lineNumber}, found potential Base64:`, base64Str);

        // 如果字符串太短或格式明显不符，跳过
        if (!validator.isBase64(base64Str)) {
          console.log("Skipping invalid Base64 format");
          continue;
        }

        const startColumn = match.index + (match[0].startsWith('"') ? 2 : 1);
        const endColumn = startColumn + base64Str.length;

        decorations.push({
          range: new monaco.Range(
            lineNumber,
            startColumn,
            lineNumber,
            endColumn,
          ),
          options: {
            inlineClassName: "base64-decoration",
            // hoverMessage: { 这里使用悬停提供者，提高性能
            //   value: "**Base64 解码**：\n```\n" + decoded + "\n```",
            // },
          },
        });
      }
    }
  }

  console.log(`Found ${decorations.length} valid Base64 strings to decorate`);
  if (decorations.length > 0) {
    state.decorationsRef.current?.set(decorations);
  }
};

/**
 * 处理编辑器内容变化时更新Base64装饰器
 * @param e 编辑器内容变化事件
 * @param state Base64装饰器状态
 */
export const handleBase64ContentChange = (
  e: editor.IModelContentChangedEvent,
  state: Base64DecoratorState,
): void => {
  if (!state.enabled) {
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
 * @param state Base64装饰器状态
 */
export const clearBase64Cache = (state: Base64DecoratorState): void => {
  state.cacheRef.current = {};
};

/**
 * 切换Base64装饰器状态
 * @param editor 编辑器实例
 * @param state Base64装饰器状态
 * @param enabled 是否启用装饰器
 * @returns 是否成功切换
 */
export const toggleBase64Decorators = (
  editor: editor.IStandaloneCodeEditor | null,
  state: Base64DecoratorState,
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
    registerBase64HoverProvider(editor, state);
    clearBase64Cache(state);
    setTimeout(() => {
      updateBase64Decorations(editor, state);
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
    clearBase64Cache(state);
  }

  return true;
};
