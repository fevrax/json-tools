import assert from "node:assert/strict";
import test from "node:test";

import JSON5 from "json5";

import { parseJson, removeJsonComments, sortJson, stringifyJson } from "./json";

test("保留单双引号字符串中的 URL、注释标记和另一种引号", () => {
  const input = `{"url":"https://example.com/*path*/",'text':'/*keep*/ // "quoted"',"quote":"'//keep"}`;

  assert.equal(removeJsonComments(input), input);
});

test("正确区分奇偶数量反斜杠后的引号及真正的注释", () => {
  for (const quote of ['"', "'"]) {
    for (let count = 0; count <= 5; count++) {
      const literal =
        quote +
        "\\".repeat(count) +
        quote +
        (count % 2 ? "/*inside*/ //inside" + quote : "");
      const input = `[${literal}/*outside*/]//tail`;
      const output = removeJsonComments(input);

      assert.equal(output, `[${literal}${" ".repeat(11)}]${" ".repeat(6)}`);
      assert.deepEqual(JSON5.parse(output), [JSON5.parse(literal)]);
    }
  }
});

test("删除真实注释且忽略注释内部的引号和其他注释标记", () => {
  const input = `/* " ' // */{"a":1,// ' " /*\n"b":2/* // ' " */}//end`;
  const output = removeJsonComments(input);

  assert.deepEqual(JSON.parse(output), { a: 1, b: 2 });
  assert.equal(output.length, input.length);
});

for (const newline of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
  test(`保留换行 ${JSON.stringify(newline)}，并在此结束单行注释`, () => {
    const input = `//head${newline}{/*a${newline}b*/"x":1}${newline}${newline}`;

    assert.equal(
      removeJsonComments(input),
      `      ${newline}{   ${newline}   "x":1}${newline}${newline}`,
    );
  });
}

test("保留字符串内的转义换行和空行", () => {
  for (const quote of ['"', "'"]) {
    for (const newline of ["\n", "\r", "\r\n"]) {
      const literal = `${quote}before\\${newline}/*keep*/ //keep${quote}`;

      assert.equal(removeJsonComments(literal), literal);
      assert.equal(JSON5.parse(literal), "before/*keep*/ //keep");
    }
  }
  const input = '"before\n\n/*keep*/ //keep"\n\n';

  assert.equal(removeJsonComments(input), input);
  assert.equal(removeJsonComments(""), "");
});

test("注释作为空白保留，避免将非法的分隔数字拼接成合法数字", () => {
  const output = removeJsonComments("[1/*gap*/2]");

  assert.equal(output, "[1       2]");
  assert.throws(() => JSON.parse(output));
});

for (const order of ["asc", "desc"] as const) {
  test(`${order} 排序保留顶层、嵌套和数组对象的 __proto__ 自有键`, () => {
    // JSON.parse 创建真正的自有键，避免对象字面量的 __proto__ 特殊语义。
    const input = JSON.parse(
      '{"z":1,"__proto__":{"z":2,"a":3},"a":[{"z":4,"__proto__":null,"a":5},{"__proto__":"value"},{"nested":{"__proto__":[3,1,2]}}]}',
    );
    const before = JSON.stringify(input);
    const output = JSON.parse(sortJson(input, order));
    const keys = ["z", "__proto__", "a"].sort((a, b) =>
      order === "asc" ? a.localeCompare(b) : b.localeCompare(a),
    );

    assert.deepEqual(output, input);
    assert.equal(
      Object.prototype.hasOwnProperty.call(output, "__proto__"),
      true,
    );
    assert.deepEqual(Object.keys(output), keys);
    assert.deepEqual(Object.keys(output.a[0]), keys);
    assert.deepEqual(
      Object.keys(output.__proto__),
      order === "asc" ? ["a", "z"] : ["z", "a"],
    );
    assert.equal(JSON.stringify(input), before);
  });

  test(`${order} 排序保留各类顶层数组顺序和长整数精度`, () => {
    for (const input of [
      [3, 1, 2, 1],
      ["z", "a", "m", "a"],
      [null, true, false, "z", "a", 3, 1, 2],
      [],
      parseJson("[9007199254740995,9007199254740993,9007199254740994]"),
    ]) {
      assert.equal(sortJson(input, order), stringifyJson(input, 4));
    }
  });

  test(`${order} 递归排序数组中对象的键，同时保留嵌套数组顺序和输入`, () => {
    const input = {
      z: [
        { z: 3, a: { z: [3, 1, 2], a: null } },
        { z: 1, a: false },
      ],
      a: [["z", "a", "m"], [{ z: 2, a: true }]],
    };
    const before = JSON.stringify(input);
    const output = JSON.parse(sortJson(input, order));
    const keys = order === "asc" ? ["a", "z"] : ["z", "a"];

    assert.deepEqual(output, input);
    assert.deepEqual(Object.keys(output), keys);
    assert.deepEqual(Object.keys(output.z[0]), keys);
    assert.deepEqual(Object.keys(output.z[0].a), keys);
    assert.deepEqual(Object.keys(output.z[1]), keys);
    assert.deepEqual(Object.keys(output.a[1][0]), keys);
    assert.equal(JSON.stringify(input), before);
  });
}

test("默认升序且保留标量值", () => {
  assert.equal(sortJson({ z: 1, a: 2 }), '{\n    "a": 2,\n    "z": 1\n}');
  for (const value of [null, true, false, 42, "/*literal*/ //literal"]) {
    assert.equal(sortJson(value), stringifyJson(value, 4));
  }
});
