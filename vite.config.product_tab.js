import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import alias from '@rollup/plugin-alias'
import path from 'path'
import liveReload from 'vite-plugin-live-reload'
import optimizer from 'vite-plugin-optimizer'

export default defineConfig({
  build: {
    emptyOutDir: true,
    minify: true,
    outDir: path.resolve(__dirname, 'js/dist_product_tab'),

    // watch: {
    //   include: 'js/src_product_tab/**',
    //   exclude: 'node_modules/**, .git/**, dist_product_tab/**, .vscode/**',
    // },

    rollupOptions: {
      input: 'js/src_product_tab/main.ts', // Optional, defaults to 'src/main.js'.
      output: {
        assetFileNames: 'assets/[ext]/index.[ext]',
        entryFileNames: 'index.js',
      },
    },
  },
  plugins: [
    alias(),
    tsconfigPaths(),
    liveReload([
      __dirname + '/**/*.php',
      __dirname + '/js/dist_product_tab/**/*',
      __dirname + '/js/src_product_tab/**/*.tsx',
    ]),
    optimizer({
      jquery: 'const $ = window.jQuery; export { $ as default }',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'js/src_product_tab'),
    },
  },
})
