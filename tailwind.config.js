/** @type {import('tailwindcss').Config} */
export default {
  important: true,
  corePlugins: {
    preflight: false,
  },
  prefix: "tw-",
  content: ["./**/*.{php, html, js, ts}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
