/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // 仅在生产构建时添加相对路径前缀
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: './', // 仅在生产构建时添加相对路径前缀
  }),
  images: {
    unoptimized: true // 对于静态导出，需要禁用图片优化
  },
}

module.exports = nextConfig
