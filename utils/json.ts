// 用于匹配需要转义的字符的正则表达式

// eslint-disable-next-line no-control-regex,no-misleading-character-class
const rxEscapable =
  /[\\"\u0000-\u001F\u007F-\u009F\u00AD\u0600-\u0604\u070F\u17B4\u17B5\u200C-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF0-\uFFFF]/g;

// 转义字符映射表
const meta: { [key: string]: string } = {
  "\b": "\\b",
  "\t": "\\t",
  "\n": "\\n",
  "\f": "\\f",
  "\r": "\\r",
  '"': '\\"',
  "\\": "\\\\",
};

export function escapeJson(input: string): string {
  // 如果字符串不包含控制字符、引号字符和反斜杠字符，
  // 那么我们可以安全地在其周围加上引号。
  // 否则，我们还必须用安全的转义序列替换有问题的字符。
  try {
    const parsedJson = JSON.parse(input);
    const jsonString = JSON.stringify(parsedJson);

    rxEscapable.lastIndex = 0;

    return rxEscapable.test(jsonString)
      ? jsonString.replace(rxEscapable, (a: string) => {
          return meta[a];
        })
      : jsonString;
  } catch (error) {
    console.error("Invalid JSON string:", error);
    throw error;
  }
}

export function isJsonString(jsonString: string): boolean {
  try {
    // 首先尝试直接解析
    JSON.parse(jsonString);

    return true;
  } catch {
    return false;
  }
}

export interface JsonErrorInfo {
  error?: Error;
  message: string;
  line: number;
  column: number;
  context: string;
  errorToken?: string;
  errorContext?: string;
  position?: number;
}

// 解析JSON字符串并返回错误信息
export function jsonParseError(jsonString: string): JsonErrorInfo | undefined {
  try {
    JSON.parse(jsonString);

    return undefined;
  } catch (error: unknown) {
    if (!(error instanceof Error)) {
      return {
        message: `未知错误类型: ${error}`,
        line: 0,
        column: 0,
        context: "",
      };
    }
    const errorPatterns = [
      {
        regex: /at position (\d+) \(line (\d+) column (\d+)\)/,
        handler: (match: RegExpMatchArray) => ({
          position: Number.parseInt(match[1]),
          line: Number.parseInt(match[2]),
          column: Number.parseInt(match[3]),
          message: `JSON解析错误`,
        }),
      },
      {
        regex:
          // @ts-ignore
          /Unexpected token '?(.+?)'?,\s*["'](.+?)["'].*?is not valid JSON/s,
        handler: (match: RegExpMatchArray) => ({
          errorToken: match[1].trim(),
          errorContext: match[2].trim(),
          message: `JSON解析错误：意外的字符`,
        }),
      },
      {
        // Unexpected token 'a', ...""sdaasd": asdasd }" is not valid JSON
        regex:
          /Unexpected token '(.+)',[\s\S]*?"([^"]+)"[\s\S]*?is not valid JSON/,
        handler: (match: RegExpMatchArray) => ({
          errorToken: match[1],
          errorContext: match[2],
          message: `JSON解析错误：意外的字符`,
        }),
      },
      {
        regex: /.*JSON at position (\d+)/,
        handler: (match: RegExpMatchArray) => ({
          position: Number.parseInt(match[1]),
          message: `JSON解析错误：字符串中存在非法控制字符，`,
        }),
      },
    ];

    for (const pattern of errorPatterns) {
      if (!error) {
        continue;
      }
      const match = error.message.match(pattern.regex);

      if (match) {
        const result = pattern.handler(match);

        return getErrorInfo(error, jsonString, result);
      }
    }

    return {
      error,
      message: `未知JSON解析错误，无法定位到错误行。`,
      line: 0,
      column: 0,
      context: "",
    };
  }
}

function getErrorInfo(
  error: Error,
  jsonString: string,
  result: Partial<JsonErrorInfo>,
): JsonErrorInfo {
  const lines = jsonString.split("\n");
  let line = result.line;
  let column = result.column;

  if (result.position !== undefined && !line) {
    let currentPosition = 0;

    for (let i = 0; i < lines.length; i++) {
      if (currentPosition + lines[i].length >= result.position) {
        line = i + 1;
        column = result.position - currentPosition + 1;
        break;
      }
      currentPosition += lines[i].length + 1; // +1 for newline character
    }
  }

  if (result.errorContext && !line) {
    const errorLine = lines.findIndex((l) =>
      l.includes(result.errorContext as string),
    );

    if (errorLine !== -1) {
      line = errorLine + 1;
      column = lines[errorLine].indexOf(result.errorContext) + 1;
    }
  }

  const startLine = Math.max(0, (line || 1) - 5);
  const endLine = Math.min(lines.length, (line || 1) + 4);
  const context = lines.slice(startLine, endLine).join("\n");

  result.message = `${result.message}`;

  return {
    error,
    message: result.message || "未知错误",
    line: line || 0,
    column: column || 0,
    context,
    errorToken: result.errorToken,
    position: result.position,
  };
}

export function isArrayOrObject(value: unknown): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

// 递归地按键名排序对象
export function sortJson(data: any, order: "asc" | "desc" = "asc"): string {
  function sortValue(value: any): any {
    if (Array.isArray(value)) {
      return value.map(sortValue).sort((a, b) => {
        // 字符串排序
        if (typeof a === "string" && typeof b === "string") {
          return order === "asc" ? a.localeCompare(b) : b.localeCompare(a);
        }
        // 数字排序
        if (typeof a === "number" && typeof b === "number") {
          return order === "asc" ? a - b : b - a;
        }

        return 0;
      });
    } else if (typeof value === "object" && value !== null) {
      return sortObject(value);
    }

    return value;
  }

  function sortObject(obj: Record<string, any>): Record<string, any> {
    const sortedKeys = Object.keys(obj).sort((a, b) => {
      return order === "asc" ? a.localeCompare(b) : b.localeCompare(a);
    });

    const sortedObj: Record<string, any> = {};

    sortedKeys.forEach((key) => {
      sortedObj[key] = sortValue(obj[key]);
    });

    return sortedObj;
  }

  const sortedResult = sortValue(data);

  return JSON.stringify(sortedResult, null, 4);
}

/**
 * 检查JSON文本中是否包含注释
 * @param jsonText 要检查的JSON文本
 * @returns 如果包含注释返回true,否则返回false
 */
export function hasJsonComments(jsonText: string): boolean {
  // 检查多行注释
  const multiLineCommentRegex = /\/\*[\s\S]*?\*\//;

  if (multiLineCommentRegex.test(jsonText)) {
    return true;
  }

  // 检查单行注释
  const singleLineCommentRegex = /("(?:\\.|[^"\\])*")|\/\/.*$/gm;
  let hasComment = false;

  jsonText.replace(singleLineCommentRegex, (match, group) => {
    if (!group) {
      // 如果匹配到的不是引号内的内容,说明是注释
      hasComment = true;
    }

    return match; // 这里的返回值不重要,我们只是利用replace来遍历所有匹配
  });

  return hasComment;
}

/**
 * 删除 JSON 文本中的注释
 * @param jsonText 包含注释的 JSON 文本
 * @returns 删除注释后的 JSON 文本
 */
export function removeJsonComments(jsonText: string): string {
  // 移除多行注释
  jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, "");

  // 移除单行注释（考虑到可能在引号内的情况）
  const regex = /("(?:\\.|[^"\\])*")|\/\/.*$/gm;

  jsonText = jsonText.replace(regex, (match, group) => {
    if (group) {
      // 如果匹配到的是引号内的内容，保留它
      return group;
    }

    // 否则，它是一个注释，将其替换为空字符串
    return "";
  });

  // 移除可能剩余的空行
  jsonText = jsonText.replace(/^\s*[\r\n]/gm, "");

  return jsonText;
}

// 计算文本行数
export function countLines(text: string): number {
  if (!text) {
    return 0;
  }

  return text.split("\n").length;
}

const autoFixFuncArr = [
  unEscapeJson, // 移除转义字符
  removeComments, // 移除注释
  fixChineseColon, // 修复中文冒号
  fixBrackets, // 修复括号
  fixQuotes, // 修复引号
  fixCommas, // 修复逗号
];

// 自动修复 JSON
export function repairJson(input: string): string {
  let result = input.trim();

  try {
    JSON.parse(result);

    return result;
  } catch (e) {
    console.error("原始文本解析失败", e);
  }
  for (const func of autoFixFuncArr) {
    result = func(result);
    console.log("func", func.name, result);
    try {
      const obj = JSON.parse(result);

      return JSON.stringify(obj, null, 4);
    } catch (e) {
      // console.error('修复后文本解析失败', e.message)
    }
  }
  throw new Error("Unable to repair JSON string");
}

// 解码 JSON 处理转义
function unEscapeJson(jsonText: string): string {
  if (jsonText === "") {
    return jsonText;
  }
  const jsonStr = `"${jsonText}"`;

  try {
    // 第一次将解析结果为去除转移后字符串
    const unescapedJson = JSON.parse(jsonStr);
    // 去除转义后的字符串解析为对象
    const unescapedJsonObject = JSON.parse(unescapedJson);

    // 判断是否为对象或数组
    if (!isArrayOrObject(unescapedJsonObject)) {
      return jsonText;
    }

    return JSON.stringify(unescapedJsonObject, null, 4);
  } catch (error) {
    return jsonText;
  }
}

// 移除注释
function removeComments(input: string): string {
  if (hasJsonComments(input) && countLines(input) > 2) {
    return removeJsonComments(input);
  }

  return input;
}

// 修复中文冒号
function fixChineseColon(jsonStr: string): string {
  // 匹配JSON中的键值对模式
  // (?<=") 使用后行断言匹配引号后面
  // [^"\n]+ 匹配除引号和换行符之外的字符
  // (?=") 使用先行断言匹配引号前面
  // \s*：\s* 匹配冒号及其前后的空格
  const pattern = /(?<=")([^"\n]+)"\s*：\s*/g;

  return jsonStr.replace(pattern, '$1": ');
}

// 修复引号、冒号
function fixQuotes(input: string): string {
  const TEMP_MARKER = "__QUOTED_CONTENT__";
  let result = input;

  // 1. 临时保存带引号的值的键值对
  const quotedContents: Record<string, string> = {};

  result = result.replace(/"([^"]+)"\s*:/g, (match, key) => {
    const value = result.substring(match.indexOf(":") + 1).trim();

    quotedContents[key] = value;

    return `${TEMP_MARKER}${key}`;
  });

  // 2. 将所有单引号和双引号替换为英文双引号
  result = result.replace(/['‘’“”]/g, () => '"');

  // 3. 恢复受保护的键值对
  result = result.replace(new RegExp(`${TEMP_MARKER}(\\w+)`, "g"), (_, key) => {
    return `"${key}": ${quotedContents[key]}`;
  });

  // 修复键名的引号问题
  input = input.replace(
    /(\s*)("?)(\w+)("?)(\s*:)/g,
    (match, before, openQuote, key, closeQuote, after) => {
      if (openQuote && closeQuote) {
        return match; // 已经有正确的引号
      }
      if (openQuote && !closeQuote) {
        return `${before}${openQuote}${key}${openQuote}${after}`;
      }
      if (!openQuote && closeQuote) {
        return `${before}${closeQuote}${key}${closeQuote}${after}`;
      }

      return match;
    },
  );

  // 修复值的引号问题
  // input = input.replace(/:\s*("?)([^",:}\]]*|"[^"]*")("?)(\s*[,}\]])/g, (match, openQuote, value, closeQuote, after) => {
  input = input.replace(
    /:\s*("?)([^",:{}[\]]*|"[^"]*")("?)(.*[,}\]])/g,
    (match, openQuote, value, closeQuote, after) => {
      console.log(
        "math",
        `openQuote: ${openQuote} | value: ${value} | closeQuote: ${closeQuote}`,
      );
      value = value.trim();
      if (/[[\]{}]/.test(value)) {
        return match;
      }
      if (
        /^true|false|null|\d+\.\d+$/.test(value) &&
        !openQuote &&
        !closeQuote
      ) {
        return `: ${value}${after}`; // 未被引号包裹的数字、布尔值或null不需要引号
      }
      if (openQuote && closeQuote) {
        return match; // 已经有正确的引号
      }
      if (openQuote && !closeQuote) {
        return `: ${openQuote}${value}${openQuote}${after}`;
      }
      if (!openQuote && closeQuote) {
        return `: ${closeQuote}${value}${closeQuote}${after}`;
      }

      return match;
    },
  );

  // 移除多余的逗号
  input = input.replace(/,(\s*[}\]])/g, "$1");

  return input;
}

// 修复逗号
function fixCommas(input: string): string {
  // 去除字符串两端的空白
  const result = input.trim();

  let inString = false;
  let escaped = false;
  let output = "";

  for (let i = 0; i < result.length; i++) {
    const char = result[i];

    if (inString) {
      if (char === '"' && !escaped) {
        inString = false;
      } else if (char === "\\" && !escaped) {
        escaped = true;
      } else {
        escaped = false;
      }
      output += char;
    } else {
      if (char === '"') {
        inString = true;
        output += char;
      } else if (char === "，") {
        // 检查前一个非空白字符
        let j = i - 1;

        while (j >= 0 && /\s/.test(result[j])) {
          j--;
        }
        if (j >= 0 && /["\]}0-9a-z]/i.test(result[j])) {
          output += ",";
        } else {
          output += char;
        }
      } else {
        output += char;
      }
    }
  }

  // 修复缺失的逗号（在 } 或 ] 之前）
  output = output.replace(/([}\]])\s*([{[])/g, "$1,$2");

  // 修复缺失的逗号（在非逗号、}、] 之后，{ 或 [ 之前）
  output = output.replace(/([^,}\]]\s*)([{[])/g, "$1,$2");

  // 修复缺失的逗号（在属性值之后，属性名之前）
  // output = output.replace(/([}\]"'\w])(\s*)(?="(?:\\.|[^"\\])*"\s*:)/g, '$1,$2')
  //
  // // 移除对象和数组最后一个元素后的多余逗号
  output = output.replace(/,(\s*[}\]])/g, "$1");

  return output;
}

// 修复括号
function fixBrackets(input: string): string {
  const stack: { char: string; index: number }[] = [];
  const result = input.split("");

  for (let i = 0; i < result.length; i++) {
    const char = result[i];

    if (char === "{" || char === "[") {
      stack.push({ char, index: i });
    } else if (char === "}" || char === "]") {
      if (stack.length === 0) {
        // 忽略多余的右括号
        result[i] = "";
        continue;
      }
      const lastOpen = stack.pop();

      if (lastOpen === undefined) {
        continue;
      }

      if (
        (lastOpen.char === "{" && char !== "}") ||
        (lastOpen.char === "[" && char !== "]")
      ) {
        // 括号不匹配，使用正确的闭合括号
        result[i] = lastOpen.char === "{" ? "}" : "]";
      }
    }
  }

  // 处理未闭合的左括号
  while (stack.length > 0) {
    const lastOpen = stack.pop();

    if (lastOpen === undefined) {
      continue;
    }
    result.push(lastOpen.char === "{" ? "}" : "]");
  }

  return result.join("");
}
