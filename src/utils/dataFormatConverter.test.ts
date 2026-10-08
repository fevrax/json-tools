import assert from "node:assert/strict";
import test from "node:test";

import { isLosslessNumber } from "lossless-json";

import {
  convertDataFormat as convert,
  formatDataFormat as format,
  parseDataFormat,
} from "./dataFormatConverter";

const sample =
  '{"n":9007199254740993,"negative":-9007199254740993,"nested":[1,9007199254740995],"fraction":0.1,"text":"9007199254740993","bool":true}';

for (const target of ["json", "json5", "yaml", "toml"]) {
  test(`JSON → ${target} → JSON preserves numeric values and types, including formatting`, () => {
    const output = convert(sample, "json", target);
    const formatted = format(output, target);
    const result = convert(formatted, target, "json");

    assert.equal(result, format(sample, "json"));
    assert.doesNotMatch(output, /isLosslessNumber|"value"|value:/);
    const parsed = parseDataFormat(formatted, target) as Record<
      string,
      unknown
    >;

    assert.ok(isLosslessNumber(parsed.n));
    assert.equal(parsed.text, "9007199254740993");
  });
}

test("JSON5 accepts extended syntax without rounding tokens or touching strings/comments/keys", () => {
  const input = `// 9999999999999999999999999999999999
  { unquoted: +9007199254740993, hex: -0x20000000000001,
    fraction: .123456789012345678901, trailing: 1., exponent: 1e400,
    '\\u006e': '9007199254740993 // 1e999', nested: [true, null,],
    \\u006b: +0x20000000000001, /* 1e999 */ }`;
  const output = convert(input, "json5", "json");

  assert.match(output, /"unquoted": 9007199254740993/);
  assert.match(output, /"hex": -9007199254740993/);
  assert.match(output, /"fraction": 0.123456789012345678901/);
  assert.match(output, /"trailing": 1.0/);
  assert.match(output, /"exponent": 1e400/);
  assert.match(output, /"k": 9007199254740993/);
  assert.match(output, /"n": "9007199254740993 \/\/ 1e999"/);
});

test("YAML preserves integer bases, explicit tags, decimal precision and huge exponents", () => {
  const input =
    'n: 9007199254740993\nhex: 0x20000000000001\nexplicit: !!int 9007199254740995\nf: 0.123456789012345678901\nhuge: 1e400\ntiny: 1e-400\ntext: "9007199254740993"';
  const output = convert(input, "yaml", "json");

  assert.match(output, /"hex": 9007199254740993/);
  assert.match(output, /"explicit": 9007199254740995/);
  assert.match(output, /"f": 0.123456789012345678901/);
  assert.match(output, /"huge": 1e400/);
  assert.match(output, /"tiny": 1e-400/);
  assert.equal(convert(format(input, "yaml"), "yaml", "json"), output);
});

test("TOML accepts exact 64-bit integers and does not inspect string/comment contents", () => {
  const input = `n = 9_007_199_254_740_993
min = -9223372036854775808
max = 9223372036854775807
hex = 0x20000000000001
text = """90071992547409999999999999999999
1.00000000000000000000000001"""
literal = '''1e999 9223372036854775808'''
# 1e999
90071992547409999999999999999999 = "key"
`;
  const output = convert(input, "toml", "json");

  assert.match(output, /"min": -9223372036854775808/);
  assert.match(output, /"max": 9223372036854775807/);
  assert.match(output, /"hex": 9007199254740993/);
  assert.equal(convert(format(input, "toml"), "toml", "json"), output);
});

test("TOML rejects integer wraparound, decimal truncation, overflow and underflow in both directions", () => {
  for (const raw of [
    "9223372036854775808",
    "-9223372036854775809",
    "0.123456789012345678901",
    "1e400",
    "1e-400",
  ]) {
    assert.throws(() => convert(`{"n":${raw}}`, "json", "toml"), /无法无损/);
    assert.throws(() => convert(`n = ${raw}`, "toml", "json"), /无法无损/);
    assert.throws(() => format(`n = ${raw}`, "toml"), /无法无损/);
  }
  assert.throws(
    () => convert("n = 0xffffffffffffffff", "toml", "json"),
    /64 位/,
  );
  assert.throws(() => convert('{"n":null}', "json", "toml"), /null/);
});

test("TOML mixed numeric arrays must not silently promote large integers to rounded floats", () => {
  assert.throws(
    () => convert('{"items":[9007199254740995,0.1]}', "json", "toml"),
    /无法无损/,
  );
  assert.equal(
    convert(convert('{"items":[1,0.1]}', "json", "toml"), "toml", "json"),
    format('{"items":[1,0.1]}', "json"),
  );
});

test("negative zero survives conversion and formatting", () => {
  for (const target of ["json", "json5", "yaml", "toml"]) {
    const output = convert('{"n":-0}', "json", target);
    const parsed = parseDataFormat(format(output, target), target) as {
      n: { value: string };
    };

    assert.ok(Object.is(Number(parsed.n.value), -0), target);
  }
  assert.throws(() => convert("n = -0", "toml", "json"), /负零/);
});

test("nonfinite values cannot silently become null or strings", () => {
  for (const input of ["{n:NaN}", "{n:Infinity}", "{n:-Infinity}"]) {
    assert.throws(() => convert(input, "json5", "json"), /非有限/);
  }
  assert.throws(() => convert("n: .inf", "yaml", "json"), /非有限/);
  assert.throws(() => convert("n = nan", "toml", "json"), /非有限/);
});

test("XML uses compact _text/_attributes strings, never numeric wrapper elements", () => {
  const input =
    '{"root":{"_attributes":{"id":9007199254740993},"value":{"_text":9007199254740995},"fraction":{"_text":0.123456789012345678901}}}';
  const xml = convert(input, "json", "xml");

  assert.match(xml, /id="9007199254740993"/);
  assert.match(xml, /<value>9007199254740995<\/value>/);
  assert.match(xml, /<fraction>0.123456789012345678901<\/fraction>/);
  const reverse = JSON.parse(convert(format(xml, "xml"), "xml", "json"));

  assert.equal(reverse.root._attributes.id, "9007199254740993");
  assert.equal(reverse.root.value._text, "9007199254740995");
  assert.throws(
    () => convert('{"root":{"value":9007199254740993}}', "json", "xml"),
    /_text/,
  );
});

test("unsupported types, cycles, invalid syntax, and unsupported formats fail explicitly", () => {
  assert.throws(() => convert("a: &a [*a]", "yaml", "json"), /循环引用/);
  assert.throws(
    () => convert("d = 1979-05-27T07:32:00Z", "toml", "json"),
    /特殊类型/,
  );
  assert.throws(() => convert("", "yaml", "json"), /空文档/);
  assert.throws(() => format("{n:}", "json5"));
  assert.throws(() => convert("{}", "csv", "json"), /不支持的输入/);
  assert.throws(() => convert("{}", "json", "csv"), /不支持的输出/);
});

test("TOML numeric table headers and array table headers are keys, not integer values", () => {
  for (const header of [
    "[92233720368547758089999]",
    "[[92233720368547758089999]]",
    "[1e400]",
    "[-0]",
  ]) {
    assert.doesNotThrow(() => convert(`${header}\nn = 1`, "toml", "json"));
  }
  assert.throws(
    () =>
      convert("d = 1979-05-27T07:32:00.123456789123456789Z", "toml", "json"),
    /特殊类型/,
  );
  assert.throws(
    () => convert("d = 1979-05-27 07:32:00.123456789123456789", "toml", "json"),
    /特殊类型/,
  );
  assert.throws(
    () => convert("a = [\n9223372036854775808\n]", "toml", "json"),
    /64 位/,
  );
});

test("YAML digit separators retain numeric type and exact digits", () => {
  const result = convert(
    'n: 9_007_199_254_740_993\nf: 0.123_456_789_012_345_678_901\nhex: 0x20_0000_0000_0001\ns: "9_007_199_254_740_993"',
    "yaml",
    "json",
  );

  assert.match(result, /"n": 9007199254740993/);
  assert.match(result, /"f": 0.123456789012345678901/);
  assert.match(result, /"hex": 9007199254740993/);
  assert.match(result, /"s": "9_007_199_254_740_993"/);
});

test("XML rejects ordinary scalar object fields instead of silently omitting them", () => {
  for (const input of [
    '{"root":{"n":"text"}}',
    '{"root":{"n":true}}',
    '{"root":{"n":null}}',
  ]) {
    assert.throws(() => convert(input, "json", "xml"), /_text/);
  }
});

test("XML compact processing instructions roundtrip through JSON and formatting", () => {
  const xml =
    '<?xml version="1.0"?><?xml-stylesheet href="x"?><root data.id="9007199254740993"><?app.config mode="x"?><value>42</value></root>';
  const json = convert(xml, "xml", "json");
  const data = JSON.parse(json);

  assert.equal(data._instruction["xml-stylesheet"], 'href="x"');
  assert.equal(data.root._instruction["app.config"], 'mode="x"');
  assert.equal(convert(convert(json, "json", "xml"), "xml", "json"), json);
  assert.equal(convert(format(xml, "xml"), "xml", "json"), json);
  assert.match(
    convert(
      '{"root":{"_attributes":{"data.id":9007199254740993}}}',
      "json",
      "xml",
    ),
    /data.id="9007199254740993"/,
  );
  // A dot in an ordinary element name must not impersonate compact context.
  assert.throws(
    () => convert('{"root":{"fake._text":"x"}}', "json", "xml"),
    /_text/,
  );
});
