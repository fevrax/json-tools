// Unicode编码模式，匹配如 \u0041 或 \u{1F600} 的格式
export const UNICODE_REGEX = /\\u([0-9a-fA-F]{4})|\\u\{([0-9a-fA-F]{1,6})}/g;

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
