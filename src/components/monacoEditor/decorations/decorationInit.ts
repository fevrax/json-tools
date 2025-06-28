import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";

import { Json5LanguageDef } from "@/components/monacoEditor/MonacoLanguageDef.tsx";
import { decodeBase64Strict } from "@/utils/base64.ts";
import {decodeUnicode} from "@/utils/unicode.ts";

/**
 * Monaco编辑器全局初始化状态管理
 *
 * 这个模块负责Monaco编辑器的全局初始化，包括：
 * 1. Monaco编辑器核心初始化
 * 2. JSON5语言支持注册
 * 3. Base64和Unicode悬停提供者的全局注册
 *
 * 通过集中管理这些初始化逻辑，避免了在每个编辑器实例创建时重复注册，
 * 提高了性能并减少了内存占用。
 */

// 全局Monaco初始化状态
let isInitialized = false;
let baseProviderRegistered = false;

/**
 * 初始化Monaco编辑器全局配置
 * @returns 初始化后的Monaco实例
 */
export const initMonacoGlobally = async () => {
  if (isInitialized) return;

  console.log("Initializing Monaco editor globally");

  // 配置Monaco加载器
  loader.config({ monaco });

  // 初始化Monaco实例
  const monacoInstance = await loader.init();

  // 注册JSON5语言支持
  if (
    !monacoInstance.languages.getLanguages().some((lang) => lang.id === "json5")
  ) {
    monacoInstance.languages.register({ id: "json5" });
    monacoInstance.languages.setMonarchTokensProvider(
      "json5",
      Json5LanguageDef,
    );
  }

  isInitialized = true;

  return monacoInstance;
};

/**
 * 注册Base64和Unicode全局悬停提供者
 * 这些提供者将在所有JSON和JSON5编辑器中共享使用
 */
export const registerGlobalBase64Provider = () => {
  if (baseProviderRegistered) return;

  console.log("Registering global Base64 and Unicode hover providers");

  // 注册全局Base64悬停提供者
  monaco.languages.registerHoverProvider(["json", "json5"], {
    provideHover: (model, position) => {
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

  // 注册全局Unicode悬停提供者
  monaco.languages.registerHoverProvider(["json", "json5"], {
    provideHover: (model, position) => {
      // const lineContent = model.getLineContent(position.lineNumber);
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

  baseProviderRegistered = true;
};

