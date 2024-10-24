export function validateAndFormatJSON<T>(data: unknown, schema: JSONSchemaType<T>): T {
  const validate = ajv.compile(schema)
  if (validate(data)) {
    return data as T
  }
  else {
    console.error('Validation errors:', validate.errors)
    throw new Error('JSON validation failed')
  }
}

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

interface JsonErrorInfo {
  message: string
  line: number
  column: number
  context: string
  errorToken?: string
}

export function jsonParseError(jsonString: string): JsonErrorInfo | undefined {
  try {
    JSON.parse(jsonString)
    return undefined
  }
  catch (error) {
    const match = error.message.match(/at position (\d+) \(line (\d+) column (\d+)\)/)
    const unexpectedTokenMatch = error.message.match(/Unexpected token '(.+)',[\s\S]*?"(.+)"[\s\S]*?is not valid JSON/)

    if (match) {
      const position = Number.parseInt(match[1])
      const line = Number.parseInt(match[2])
      const column = Number.parseInt(match[3])

      const lines = jsonString.split('\n')
      const startLine = Math.max(0, line - 4)
      const endLine = Math.min(lines.length, line + 2)
      const context = lines.slice(startLine, endLine).join('\n')
      console.log(context)

      return {
        position,
        message: `JSON解析错误：第${line}行，第${column}列 \n${error.message}`,
        line,
        column,
        context,
      }
    }
    else if (unexpectedTokenMatch) {
      const errorToken = unexpectedTokenMatch[1]
      const errorContext = unexpectedTokenMatch[2]

      const lines = jsonString.split('\n')
      const errorLine = lines.findIndex(line => line.includes(errorContext))

      if (errorLine !== -1) {
        const line = errorLine + 1
        const column = lines[errorLine].indexOf(errorContext) + 1
        const startLine = Math.max(0, errorLine - 4)
        const endLine = Math.min(lines.length, errorLine + 2)

        // TODO 高亮
        const context = lines.slice(startLine, endLine).join('\n')

        return {
          message: `JSON解析错误：第${line}行，第${column}列，意外的标记 '${errorToken}'`,
          line,
          column,
          context,
          errorToken,
        }
      }
    }
    return {
      message: `未知JSON解析错误，无法定位到错误行。 \n${error.message}`,
      line: 0,
      column: 0,
      context: '',
    }
  }
}
