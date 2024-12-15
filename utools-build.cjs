const fs = require("fs").promises;
const path = require("path");

// 定义要处理的文件类型
const VALID_EXTENSIONS = new Set([".js", ".txt", ".html", ".css"]);

/**
 * 替换CSS文件中的路径
 * @param {string} filePath 文件路径
 */
async function replaceCssInFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const result = data.replace(/\/_next\/static\/media\//g, "../media/");

    await fs.writeFile(filePath, result, "utf8");
    console.log(`Successfully replaced _next/static/media in ${filePath}`);
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
  }
}

/**
 * 替换文件中的所有_next路径
 * @param {string} filePath 文件路径
 */
async function replaceOutAllInFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const result = data.replace(/\/_next\//g, "./_next/");

    await fs.writeFile(filePath, result, "utf8");
    console.log(`Successfully replaced ./_next/ in ${filePath}`);
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
  }
}

/**
 * 递归处理目录
 * @param {string} dirPath 目录路径
 * @param {Function} processor 处理函数
 */
async function processDirectory(dirPath, processor) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // 递归处理子目录
        await processDirectory(fullPath, processor);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);

        if (VALID_EXTENSIONS.has(ext)) {
          await processor(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(`Error processing directory ${dirPath}:`, err);
  }
}

/**
 * 主函数
 */
async function main() {
  const cssDir = path.join(__dirname, "out", "_next", "static", "css");
  const outDir = path.join(__dirname, "out");

  try {
    // 处理CSS文件
    await processDirectory(cssDir, replaceCssInFile);

    // 处理out目录下的所有文件
    await processDirectory(outDir, replaceOutAllInFile);

    console.log("All files processed successfully");
  } catch (err) {
    console.error("Error in main process:", err);
  }
}

// 执行主函数
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
