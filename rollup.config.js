import babel from '@rollup/plugin-babel'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')

export default [
  {
    input: 'src/index.js',
    external: [
      'fs',
      'path',
      'util',
      'sharp',
      'isomorphic-unfetch',
      'ora',
      'mkdirp',
      'image-type',
      'read-chunk',
    ],
    plugins: [
      babel({
        babelHelpers: 'bundled',
        exclude: ['node_modules/**'],
      }),
    ],
    output: [
      { file: pkg.main, format: 'cjs', exports: 'named' },
      { file: pkg.module, format: 'es', exports: 'named' },
    ],
  },
]
