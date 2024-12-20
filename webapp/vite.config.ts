import {defineConfig, normalizePath} from 'vite';
import IstanbulPlugin from 'vite-plugin-istanbul';
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
        {
          src: normalizePath(resolve(__dirname, '../docs/*.png')),
          dest: 'docs'
        },
        {
          src: normalizePath(resolve(__dirname, '../assets/vertical/*.png')),
          dest: 'assets/vertical'
        },
        {
          src: normalizePath(resolve(__dirname, '../assets/horizontal/*.png')),
          dest: 'assets/horizontal'
        },
      ]
    }),
    ...(process.env.USE_BABEL_PLUGIN_ISTANBUL ? [IstanbulPlugin({
      include: 'src/*',
      exclude: ['node_modules', 'test/'],
      extension: [ '.js', '.ts','.tsx' ],
    })] : [])
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    sourcemap: false,
  },
});
