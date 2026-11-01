import {build} from 'esbuild'
import {gzipSync} from 'node:zlib'
import {readFileSync} from 'node:fs'

await build({
  entryPoints: ['theme-pane/main.tsx'],
  outfile: 'theme-pane.js',
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2022',
  jsx: 'automatic',
  define: {'process.env.NODE_ENV': '"production"'},
  loader: {'.css': 'css'},
  legalComments: 'none',
})
for (const file of ['theme-pane.js', 'theme-pane.css']) {
  const bytes = readFileSync(file)
  console.log(file, bytes.length, 'bytes,', gzipSync(bytes).length, 'gzipped')
}
