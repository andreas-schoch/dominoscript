import {defineConfig, normalizePath} from 'vite';
import {resolve} from 'path';
import solidPlugin from 'vite-plugin-solid';
import {viteStaticCopy} from 'vite-plugin-static-copy';

export default defineConfig({
  base: './',
  plugins: [
    /* 
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    // devtools(),
    solidPlugin(),
    viteStaticCopy({
      targets: [
        {
          // makes the examples from outside available to the webapp
          src: normalizePath(resolve(__dirname, '../examples/*{.ds,.md}')),
          dest: 'examples'
        },
      ]
    })
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
