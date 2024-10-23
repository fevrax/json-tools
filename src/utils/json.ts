// 用于匹配需要转义的字符的正则表达式
// eslint-disable-next-line no-control-regex,no-misleading-character-class
const rxEscapable = /[\\"\u0000-\u001F\u007F-\u009F\u00AD\u0600-\u0604\u070F\u17B4\u17B5\u200C-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF0-\uFFFF]/g

// 转义字符映射表
const meta: { [key: string]: string } = {
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\f': '\\f',
  '\r': '\\r',
  '"': '\\"',
  '\\': '\\\\',
}

export function escapeJson(input: string): string {
  // 如果字符串不包含控制字符、引号字符和反斜杠字符，
  // 那么我们可以安全地在其周围加上引号。
  // 否则，我们还必须用安全的转义序列替换有问题的字符。
  try {
    const parsedJson = JSON.parse(input)
    const jsonString = JSON.stringify(parsedJson)

    rxEscapable.lastIndex = 0
    return rxEscapable.test(jsonString)
      ? jsonString.replace(rxEscapable, (a: string) => {
        return meta[a]
      })
      : jsonString
  }
  catch (error) {
    console.error('Invalid JSON string:', error)
    throw error
  }
}

export function isJsonString(jsonString: string): boolean {
  try {
    // 首先尝试直接解析
    JSON.parse(jsonString)
    return true
  }
  catch {
    return false
  }
}

export interface JsonErrorInfo {
  position: string
  message: string
  line: number
  column: number
  context: string
}

export function jsonParseError(jsonString: string): JsonErrorInfo | undefined {
  try {
    JSON.parse(jsonString)
    return undefined
  }
  catch (error) {
    const match = error.message.match(/at position (\d+) \(line (\d+) column (\d+)\)/)
    if (!match) {
      return {
        message: '未知JSON解析错误',
        line: 0,
        column: 0,
        context: '',
      }
    }

    const position = Number.parseInt(match[1])
    const line = Number.parseInt(match[2])
    const column = Number.parseInt(match[3])

    const lines = jsonString.split('\n')
    const startLine = Math.max(0, line - 3)
    const endLine = Math.min(lines.length, line + 2)
    const context = lines.slice(startLine, endLine).join('\n')

    return {
      position,
      message: `JSON解析错误：第${line}行，第${column}列`,
      line,
      column,
      context,
    }
  }
}

/**
 * 安全地解析 JSON 字符串
 * @param jsonString 要解析的 JSON 字符串
 * @returns 解析后的 JavaScript 对象，如果解析失败则返回 null
 */
export function safeJsonParseUnescaped(jsonString: string): any | null {
  try {
    // 首先尝试直接解析
    return JSON.parse(jsonString)
  }
  catch (error) {
    // 直接解析失败，尝试处理可能的转义字符串
    try {
      // 替换转义字符
      const unescapedString = jsonString.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      return JSON.parse(unescapedString)
    }
    catch (innerError) {
      // 如果还是失败，则返回 null
      console.error('JSON parsing failed:', innerError)
      return null
    }
  }
}
