/* eslint-disable quote-props */
/* eslint-disable prettier/prettier */
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import alias from '@rollup/plugin-alias'
import path from 'path'
import liveReload from 'vite-plugin-live-reload'
import { v4wp } from '@kucrut/vite-for-wp'
import jotaiDebugLabel from 'jotai/babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai/babel/plugin-react-refresh'

export default {
  plugins: [
    alias(),
    react({
      babel: {
        plugins: [
          jotaiDebugLabel,
          jotaiReactRefresh,
        ],
      },
    }),
    tsconfigPaths(),
    liveReload(__dirname + '/**/*.php'),
    v4wp({
      input: 'js/src/main.tsx', // Optional, defaults to 'src/main.js'.
      outDir: 'js/dist', // Optional, defaults to 'dist'.
    }),

    // {
    //   name: 'debug-resolve',
    //   configureServer(server) {
    //     server.middlewares.use((req, res, next) => {
    //       next()
    //     })
    //   },
    // },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'js/src'),
    },
  },
}
