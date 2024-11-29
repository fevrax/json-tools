/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  assetPrefix: './', // 设置资源前缀为相对路径
  images: {
    unoptimized: true // 对于静态导出，需要禁用图片优化
  },
}

module.exports = nextConfig
