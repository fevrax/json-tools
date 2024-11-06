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
  error: Error
  message: string
  line: number
  column: number
  context: string
  errorToken?: string
  position?: number
}

export function jsonParseError(jsonString: string): JsonErrorInfo | undefined {
  try {
    JSON.parse(jsonString)
    return undefined
  }
  catch (error) {
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
        regex: /Unexpected token '(.+)',[\s\S]*?"(.+)"[\s\S]*?is not valid JSON/,
        handler: (match: RegExpMatchArray) => ({
          errorToken: match[1],
          errorContext: match[2],
          message: `JSON解析错误：意外的标记`,
        }),
      },
      {
        regex: /.*JSON at position (\d+)/,
        handler: (match: RegExpMatchArray) => ({
          position: Number.parseInt(match[1]),
          message: `JSON解析错误：字符串中存在非法控制字符，`,
        }),
      },
    ]

    for (const pattern of errorPatterns) {
      const match = error.message.match(pattern.regex)
      if (match) {
        const result = pattern.handler(match)
        return getErrorInfo(error, jsonString, result)
      }
    }

    return {
      error,
      message: `未知JSON解析错误，无法定位到错误行。`,
      line: 0,
      column: 0,
      context: '',
    }
  }
}

function getErrorInfo(error: Error, jsonString: string, result: Partial<JsonErrorInfo>): JsonErrorInfo {
  const lines = jsonString.split('\n')
  let line = result.line
  let column = result.column

  if (result.position !== undefined && !line) {
    let currentPosition = 0
    for (let i = 0; i < lines.length; i++) {
      if (currentPosition + lines[i].length >= result.position) {
        line = i + 1
        column = result.position - currentPosition + 1
        break
      }
      currentPosition += lines[i].length + 1 // +1 for newline character
    }
  }

  if (result.errorContext && !line) {
    const errorLine = lines.findIndex(l => l.includes(result.errorContext))
    if (errorLine !== -1) {
      line = errorLine + 1
      column = lines[errorLine].indexOf(result.errorContext) + 1
    }
  }

  const startLine = Math.max(0, (line || 1) - 5)
  const endLine = Math.min(lines.length, (line || 1) + 4)
  const context = lines.slice(startLine, endLine).join('\n')

  result.message = `${result.message}`
  return {
    error,
    message: result.message || '未知错误',
    line: line || 0,
    column: column || 0,
    context,
    errorToken: result.errorToken,
    position: result.position,
  }
}

export function isArrayOrObject(value: unknown): boolean {
  return Array.isArray(value) || (typeof value === 'object' && value !== null)
}

export function sortJson(obj: Record<object>, order: 'asc' | 'desc' = 'asc') {
  const sortedKeys = Object.keys(obj).sort((a, b) => {
    if (order === 'asc') {
      return a.localeCompare(b)
    } else {
      return b.localeCompare(a)
    }
  })

  const sortedObj: Record<string, any> = {}
  sortedKeys.forEach((key) => {
    sortedObj[key] = obj[key]
  })

  return JSON.stringify(sortedObj, null, 4)
}
