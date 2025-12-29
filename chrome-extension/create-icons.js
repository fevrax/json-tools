/**
 * 创建Chrome扩展图标
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建简单的SVG图标
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#007acc" rx="12"/>
  <text x="64" y="75" font-family="Consolas, Monaco, monospace" font-size="32" fill="white" text-anchor="middle" font-weight="bold">{}</text>
  <text x="64" y="95" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">JSON</text>
</svg>`;

// 创建icons目录
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// 保存SVG图标（作为占位符）
['16', '32', '48', '128'].forEach(size => {
  const svgPath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(svgPath, svgIcon);
});

console.log('图标文件已创建（SVG格式）');
console.log('注意：实际使用时需要转换为PNG格式');
console.log('可以使用在线工具或ImageMagick等工具进行转换');