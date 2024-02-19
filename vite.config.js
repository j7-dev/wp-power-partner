import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import alias from "@rollup/plugin-alias";
import path from "path";
import liveReload from "vite-plugin-live-reload";
import optimizer from "vite-plugin-optimizer";

export default defineConfig({
  build: {
    emptyOutDir: true,
    minify: true,
    outDir: path.resolve(__dirname, "js/dist"),
    watch: {
      include: "js/src/**",
      exclude: "node_modules/**, .git/**, dist/**, .vscode/**",
    },
    rollupOptions: {
      input: "js/src/main.tsx", // Optional, defaults to 'src/main.js'.
      output: {
        assetFileNames: "assets/[ext]/index.[ext]",
        entryFileNames: "index.js",
      },
    },
  },
  plugins: [
    alias(),
    tsconfigPaths(),
    liveReload([
      __dirname + "/**/*.php",
      __dirname + "/js/dist/**/*",
      __dirname + "/js/src/**/*.tsx",
    ]),
    optimizer({
      jquery: `const $ = window.jQuery; export { $ as default }`,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "js/src"),
    },
  },
});
