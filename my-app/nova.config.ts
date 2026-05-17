import { defineConfig } from '@nova/cli';
import { seoOptimizePlugin } from './plugins/seo-optimize';
import { bundleGuardPlugin } from './plugins/bundle-guard';

export default defineConfig({
  root: '.',
  entry: 'src/main.tsx',
  outDir: 'dist',
  ssr: true,
  server: {
    port: 3000,
    hmr: true,
  },
  customPipes: ['exclaim', 'mask'],
  plugins: [
    // 1. Plugin tối ưu hóa SEO & Minify HTML
    seoOptimizePlugin({
      title: 'Ứng Dụng Nova Siêu Tốc 🚀',
      description: 'Đây là ứng dụng Web thế hệ mới sử dụng Signals-based reactivity, tải trang siêu tốc được tối ưu hóa SEO hoàn hảo bằng Nova Plugin Engine.',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=630&q=80',
      url: 'https://my-awesome-nova-app.vercel.app'
    }),
    
    // 2. Plugin phân tích & giới hạn kích thước Bundle (Giới hạn: 4 KB)
    bundleGuardPlugin({
      maxSizeKb: 4.0,
      failOnError: false // Báo lỗi hoặc cảnh báo trực quan nhưng không làm sập build
    })
  ],
});
