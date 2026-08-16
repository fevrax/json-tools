import {
  convertJsonKeys,
  convertKey,
  convertKeysDeep,
  KeyNamingCollisionError,
  type NamingFormat,
} from "./keyNamingConverter";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(
      `${message}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

const formatExpectations: Record<NamingFormat, string> = {
  camel: "urlValue",
  pascal: "UrlValue",
  snake: "url_value",
  kebab: "url-value",
  constant: "URL_VALUE",
};

for (const [format, expected] of Object.entries(formatExpectations) as [
  NamingFormat,
  string,
][]) {
  assertEqual(convertKey("URLValue", format), expected, `${format} 缩写转换`);
  assertEqual(
    convertKey(expected, format),
    expected,
    `${format} 转换应保持幂等`,
  );
}

assertEqual(convertKey("user", "pascal"), "User", "单词应转换为大驼峰");
assertEqual(convertKey("URL", "camel"), "url", "单个缩写应规范化");
assertEqual(
  convertKey("first___name", "camel"),
  "firstName",
  "重复分隔符应合并",
);
assertEqual(
  convertKey("first-name.value label", "constant"),
  "FIRST_NAME_VALUE_LABEL",
  "常见分隔符应统一处理",
);
assertEqual(
  convertKey("version2Value", "snake"),
  "version2_value",
  "数字应保留在相邻单词中",
);
assertEqual(
  convertKey("HTTP2Server", "snake"),
  "http2_server",
  "缩写中的数字不应单独拆词",
);
assertEqual(
  convertKey("用户Name", "snake"),
  "用户_name",
  "Unicode 字母应保留并识别大小写边界",
);

for (const specialKey of ["$schema", "@context", "#text"]) {
  for (const format of Object.keys(formatExpectations) as NamingFormat[]) {
    assertEqual(
      convertKey(specialKey, format),
      specialKey,
      "协议字段应整键保留",
    );
  }
}

assertEqual(convertKey("", "snake"), "", "空键应保留");
assertEqual(convertKey("😀", "snake"), "😀", "无法分词的键应保留");

const nestedInput = {
  user_profile: [
    {
      first_name: "Ada",
      HTTP2Code: 200,
      $schema: "https://example.com/schema.json",
    },
  ],
  enabled: true,
};
const nestedOutput = convertKeysDeep(nestedInput, "camel") as Record<
  string,
  unknown
>;
const profile = (nestedOutput.userProfile as Record<string, unknown>[])[0];

assert(
  Object.getPrototypeOf(nestedOutput) === null,
  "输出对象应使用无原型字典",
);
assertEqual(profile.firstName, "Ada", "数组中的深层字段应转换");
assertEqual(profile.http2Code, 200, "深层缩写和数字应转换");
assertEqual(
  profile.$schema,
  "https://example.com/schema.json",
  "深层协议字段应保留",
);
assertEqual(nestedOutput.enabled, true, "普通值不得改变");

let collisionError: KeyNamingCollisionError | null = null;

try {
  convertKeysDeep(
    {
      items: [{ user_id: 1, userId: 2 }],
    },
    "camel",
  );
} catch (error) {
  if (error instanceof KeyNamingCollisionError) collisionError = error;
}

assert(collisionError !== null, "目标键冲突必须中止转换");
assertEqual(collisionError?.collisions.length, 1, "应聚合同一目标键的冲突");
assertEqual(collisionError?.collisions[0].path, "/items/0", "应报告原始路径");
assertEqual(collisionError?.collisions[0].targetKey, "userId", "应报告目标键");
assertEqual(
  collisionError?.collisions[0].sourceKeys.join(","),
  "user_id,userId",
  "应报告全部原键",
);

const longInteger = "900719925474099312345678901234567890";
const convertedJson = convertJsonKeys(
  `{"veryLongNumber":${longInteger},"nestedValue":{"first-name":"ok"}}`,
  "snake",
  2,
);

assert(convertedJson.includes(longInteger), "长整数精度必须保持不变");
assert(convertedJson.includes('"very_long_number"'), "JSON 文本入口应转换键名");
assert(convertedJson.includes('"first_name"'), "JSON 文本入口应递归转换");
