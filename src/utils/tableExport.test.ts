import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import { xml2js } from "xml-js";

import { parseJson } from "./json";
import {
  convertToCSV,
  convertToExcel,
  downloadTableExport,
  getTableExportData,
} from "./tableExport";

// Independent CSV reader: validate field boundaries, quotes and CRLF records.
function readCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];

    if (ch === '"') {
      if (quoted && csv[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (ch === "," || ch === "\r")) {
      row.push(cell);
      cell = "";
      if (ch === "\r") {
        assert.equal(csv[++i], "\n");
        rows.push(row);
        row = [];
      }
    } else cell += ch;
  }
  assert.equal(quoted, false);
  row.push(cell);
  rows.push(row);

  return rows;
}

function readWorkbook(buffer: ArrayBuffer): Record<string, string> {
  const bytes = Buffer.from(buffer);
  const end = bytes.length - 22;

  assert.equal(bytes.readUInt32LE(end), 0x06054b50);
  const count = bytes.readUInt16LE(end + 10);
  let directory = bytes.readUInt32LE(end + 16);

  assert.equal(directory + bytes.readUInt32LE(end + 12), end);
  const files: Record<string, string> = {};

  for (let i = 0; i < count; i++) {
    assert.equal(bytes.readUInt32LE(directory), 0x02014b50);
    const local = bytes.readUInt32LE(directory + 42);

    assert.equal(bytes.readUInt32LE(local), 0x04034b50);
    assert.equal(bytes.readUInt16LE(local + 8), 0); // stored, not CSV disguised as XLSX
    const size = bytes.readUInt32LE(directory + 24);
    const nameLength = bytes.readUInt16LE(directory + 28);
    const name = bytes
      .subarray(directory + 46, directory + 46 + nameLength)
      .toString();

    assert.equal(
      bytes.subarray(local + 30, local + 30 + nameLength).toString(),
      name,
    );
    const start =
      local +
      30 +
      bytes.readUInt16LE(local + 26) +
      bytes.readUInt16LE(local + 28);
    const payload = bytes.subarray(start, start + size);
    let crc = 0xffffffff;

    for (const byte of payload) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    assert.equal((crc ^ 0xffffffff) >>> 0, bytes.readUInt32LE(directory + 16));
    assert.equal(
      bytes.readUInt32LE(local + 14),
      bytes.readUInt32LE(directory + 16),
    );
    assert.equal(bytes.readUInt32LE(local + 18), size);
    files[name] = payload.toString();
    xml2js(files[name]); // independently parse every package XML part
    directory +=
      46 +
      nameLength +
      bytes.readUInt16LE(directory + 30) +
      bytes.readUInt16LE(directory + 32);
  }
  assert.equal(directory, end);

  return files;
}

function sheetCells(data: unknown, path?: string) {
  const files = readWorkbook(convertToExcel(data, path));
  const sheet = xml2js(files["xl/worksheets/sheet1.xml"], {
    compact: true,
  }) as any;
  const rows = [sheet.worksheet.sheetData.row].flat();

  return rows.map((row) => [row.c].flat());
}

function sheetValues(data: unknown, path?: string) {
  return sheetCells(data, path).map((row) =>
    row.map((cell) => {
      if (cell._attributes.t === "inlineStr")
        return String(cell.is.t._text ?? "");
      if (cell._attributes.t === "b")
        return cell.v._text === "1" ? "true" : "false";

      return String(cell.v._text);
    }),
  );
}

test("CSV escapes headers and nested JSON without modifying JSON punctuation", () => {
  const data = [
    {
      'a,"\r\n中文': { nested: ["a,b", '"', false, null] },
      text: "line1\r\nline2",
    },
  ];

  assert.deepEqual(readCSV(convertToCSV(data)), [
    ['a,"\r\n中文', "text"],
    ['{"nested":["a,b","\\"",false,null]}', "line1\r\nline2"],
  ]);
  assert.equal(convertToCSV({ '"': '"' }), '""""\r\n""""');
});

test("union headers, absent fields and own special keys", () => {
  const data = JSON.parse('[{"a":null,"__proto__":"own"},{"b":false,"a":0}]');

  assert.deepEqual(readCSV(convertToCSV(data)), [
    ["a", "__proto__", "b"],
    ["null", "own", ""],
    ["0", "", "false"],
  ]);
  assert.deepEqual(readCSV(convertToCSV([{ constructor: 1 }, {}])), [
    ["constructor"],
    ["1"],
    [""],
  ]);
});

test("root falsy values and empty containers remain exportable", () => {
  for (const [value, expected] of [
    [null, "null"],
    [false, "false"],
    [0, "0"],
    ["", ""],
    [[], "[]"],
    [{}, "{}"],
  ] as const) {
    assert.deepEqual(readCSV(convertToCSV(value)), [[expected]]);
    assert.deepEqual(sheetValues(value), [[expected]]);
  }
});

test("mixed arrays and arrays of arrays retain every element", () => {
  for (const data of [
    [{ a: 1 }, null, false, 0, [1, 2], "x"],
    [null, { a: 1 }],
    [[1, 2], [3]],
    [{}, {}],
  ]) {
    const expected = data.map((value) => [
      typeof value === "string" ? value : JSON.stringify(value),
    ]);

    assert.deepEqual(readCSV(convertToCSV(data)), expected);
    assert.deepEqual(sheetValues(data), expected);
  }
});

test("LosslessNumber and BigInt, including nested values, preserve all digits", () => {
  const value = parseJson(
    '{"id":900719925474099312345,"nested":{"n":12345678901234567890},"decimal":0.1234567890123456789}',
  );
  const expected = [
    ["id", "nested", "decimal"],
    [
      "900719925474099312345",
      '{"n":12345678901234567890}',
      "0.1234567890123456789",
    ],
  ];

  assert.deepEqual(readCSV(convertToCSV(value)), expected);
  assert.deepEqual(sheetValues(value), expected);
  assert.equal(sheetCells(value)[1][0]._attributes.t, "inlineStr");
  assert.deepEqual(
    readCSV(
      convertToCSV([12345678901234567890n, { n: 12345678901234567890n }]),
    ),
    [["12345678901234567890"], ['{"n":12345678901234567890}']],
  );
  assert.deepEqual(sheetValues(parseJson("[1,900719925474099312345]")), [
    ["1"],
    ["900719925474099312345"],
  ]);
});

test("ordinary LosslessNumber values are numeric; precision and exponent extremes stay text", () => {
  const cells = sheetCells(
    parseJson(
      "[42,0,1.25,999999999999999,1234567890123456,0.1234567890123456,1e400,1e-400]",
    ),
  );

  for (const index of [0, 1, 2, 3])
    assert.equal(cells[index][0]._attributes.t, undefined);
  for (const index of [4, 5, 6, 7])
    assert.equal(cells[index][0]._attributes.t, "inlineStr");
});

test("selected falsy nodes, special keys and nested arrays are exported without comment rows", () => {
  const data = { rows: [null, false, 0, ""], "01": 5, "a.b": [9] };

  for (const [index, expected] of ["null", "false", "0", ""].entries()) {
    const path = `root.rows[${index}]`;

    assert.deepEqual(readCSV(convertToCSV(data, path)), [[expected]]);
    assert.deepEqual(sheetValues(data, path), [[expected]]);
  }
  assert.equal(getTableExportData(data, "root.01"), 5);
  assert.equal(getTableExportData(data, "root.a.b[0]"), 9);
  assert.throws(() => convertToCSV(data, "root.missing"), /路径/);
  assert.throws(() => convertToExcel(data, "root.rows[9]"), /路径/);
  assert.throws(
    () => getTableExportData({ "a.b": 1, a: { b: 2 } }, "root.a.b"),
    /歧义/,
  );
});

test("XLSX package relationships and content types point to real parts", () => {
  const files = readWorkbook(convertToExcel({ x: 1 }));

  assert.equal(Object.keys(files).length, 5);
  const root = xml2js(files["_rels/.rels"], { compact: true }) as any;

  assert.ok(files[root.Relationships.Relationship._attributes.Target]);
  const rels = xml2js(files["xl/_rels/workbook.xml.rels"], {
    compact: true,
  }) as any;

  assert.ok(files[`xl/${rels.Relationships.Relationship._attributes.Target}`]);
  const types = xml2js(files["[Content_Types].xml"], { compact: true }) as any;

  for (const part of types.Types.Override)
    assert.ok(files[part._attributes.PartName.slice(1)]);
  assert.match(files["xl/workbook.xml"], /r:id="rId1"/);
});

test("XLSX keeps booleans/numbers typed and strings literal, preserving whitespace and XML escapes", () => {
  const cells = sheetCells([
    false,
    0,
    1.25,
    "=1+1",
    '<tag>&" 中文😀\n\t ',
    "001",
    1234567890123456,
  ])[0];

  assert.equal(cells[0]._attributes.t, "b");
  const rows = sheetCells([
    false,
    0,
    1.25,
    "=1+1",
    '<tag>&" 中文😀\n\t ',
    "001",
    1234567890123456,
  ]);

  assert.equal(rows[1][0]._attributes.t, undefined);
  assert.equal(rows[2][0].v._text, "1.25");
  assert.equal(rows[3][0]._attributes.t, "inlineStr");
  assert.equal(rows[3][0].f, undefined);
  assert.equal(rows[4][0].is.t._text, '<tag>&" 中文😀\n\t ');
  assert.equal(rows[5][0].is.t._text, "001");
  assert.equal(rows[6][0]._attributes.t, "inlineStr");
});

test("XLSX escapes control codes, CR, literal OOXML escapes and lone surrogates", () => {
  assert.deepEqual(sheetValues(["a\r\nb\u0000_x000A_\ud800"]), [
    ["a\r\nb_x0000__x005F_x000A__xD800_"],
  ]);
});

test("column references cross Z and Excel limits fail explicitly", () => {
  const record = Object.fromEntries(
    Array.from({ length: 28 }, (_, i) => [`key${i}`, i]),
  );

  assert.equal(sheetCells(record)[1][26]._attributes.r, "AA2");
  assert.equal(sheetCells(record)[1][27]._attributes.r, "AB2");
  assert.throws(() => convertToExcel("x".repeat(32768)), /32767/);
  assert.throws(
    () =>
      convertToExcel(
        Object.fromEntries(Array.from({ length: 16385 }, (_, i) => [i, i])),
      ),
    /列数/,
  );
});

test("downloads use correct extensions, MIME types, CSV BOM and URL cleanup", async () => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const originalCreate = URL.createObjectURL,
    originalRevoke = URL.revokeObjectURL;
  const blobs: Blob[] = [],
    names: string[] = [],
    revoked: string[] = [];
  let removed = 0;

  URL.createObjectURL = (blob) => {
    blobs.push(blob as Blob);

    return `blob:${blobs.length}`;
  };
  URL.revokeObjectURL = (url) => {
    revoked.push(url);
  };
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      body: { appendChild() {} },
      createElement() {
        return {
          href: "",
          download: "",
          click() {
            names.push(this.download);
          },
          remove() {
            removed++;
          },
        };
      },
    },
  });
  try {
    downloadTableExport("中文", "csv");
    downloadTableExport(convertToExcel(null), "xlsx");
    assert.deepEqual(names, ["data.csv", "data.xlsx"]);
    assert.equal(blobs[0].type, "text/csv;charset=utf-8");
    assert.deepEqual(
      [...new Uint8Array(await blobs[0].arrayBuffer()).slice(0, 3)],
      [239, 187, 191],
    );
    assert.equal(
      blobs[1].type,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    readWorkbook(await blobs[1].arrayBuffer());
    assert.equal(removed, 2);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    assert.deepEqual(revoked, ["blob:1", "blob:2"]);
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    if (originalDocument)
      Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
});

// Opt-in independent reader regression (no Python dependency for normal Node runs):
// TABLE_EXPORT_PYTHON=/path/to/python node --import tsx src/utils/tableExport.test.ts
test(
  "openpyxl independently reads actual XLSX values and types",
  {
    skip: !process.env.TABLE_EXPORT_PYTHON,
  },
  () => {
    const data = parseJson(
      '[{"small":42,"zero":0,"no":false,"nil":null,"big":900719925474099312345,"decimal":0.1234567890123456789,"nested":{"a":[1,2,null]},"text":" <&中文😀> ","formula":"=1+1"}]',
    );

    data[0].newline = "a\r\nb";
    const result = spawnSync(
      process.env.TABLE_EXPORT_PYTHON!,
      [
        "-c",
        `
import io, sys, zipfile
from openpyxl import load_workbook
raw = sys.stdin.buffer.read()
with zipfile.ZipFile(io.BytesIO(raw)) as archive:
    assert archive.testzip() is None
sheet = load_workbook(io.BytesIO(raw)).active
actual = {sheet.cell(1, i).value: (sheet.cell(2, i).value, sheet.cell(2, i).data_type) for i in range(1, sheet.max_column + 1)}
expected = {'small': (42, 'n'), 'zero': (0, 'n'), 'no': (False, 'b'), 'nil': ('null', 's'), 'big': ('900719925474099312345', 's'), 'decimal': ('0.1234567890123456789', 's'), 'nested': ('{"a":[1,2,null]}', 's'), 'text': (' <&中文😀> ', 's'), 'formula': ('=1+1', 's'), 'newline': ('a' + chr(13) + chr(10) + 'b', 's')}
assert actual == expected, (actual, expected)
print('openpyxl round-trip passed')
`,
      ],
      { input: Buffer.from(convertToExcel(data)) },
    );

    assert.equal(
      result.status,
      0,
      result.stderr.toString() || String(result.error),
    );
    assert.match(result.stdout.toString(), /round-trip passed/);
  },
);
