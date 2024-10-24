import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const indexPath = path.join(__dirname, 'dist', 'index.html')

// utools 使用的是路径访问
// 将编辑器的 workder 路径改为绝对路径
async function updateIndexHtmlWorkerDir() {
  try {
    // 读取 index.html 文件
    const data = await fs.readFile(indexPath, 'utf8')

    // 替换 MonacoEnvironment 脚本
    let result = data.replace(
      /<script>self\["MonacoEnvironment"\] = \(function \(paths\) \{/,
      '<script>\n    var currentHref = window.location.href;\n    var baseDir = currentHref.substring(0, currentHref.length - \'index.html\'.length)\n    self["MonacoEnvironment"] = (function (paths) {',
    )

    // 替换 worker 路径
    result = result.replace(
      /"editorWorkerService": "\.\/monacoeditorwork\/editor\.worker\.bundle\.js",\s*"json": "\.\/monacoeditorwork\/json\.worker\.bundle\.js"/g,
      '"editorWorkerService": baseDir+"/monacoeditorwork/editor.worker.bundle.js",\n  "json": baseDir+"/monacoeditorwork/json.worker.bundle.js"',
    )

    // 写入修改后的内容
    await fs.writeFile(indexPath, result, 'utf8')
    console.log('Successfully updated dist/index.html')
  }
  catch (err) {
    console.error('Error:', err)
  }
}

// 立即调用异步函数
updateIndexHtmlWorkerDir()
