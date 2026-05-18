import { defineConfig } from '@nova/cli';

export default defineConfig({
  root: '.',
  entry: 'src/main.tsx',
  outDir: 'dist',
  ssr: true,
  server: {
    port: 3000,
    hmr: true,
  },
  plugins: [],
});
