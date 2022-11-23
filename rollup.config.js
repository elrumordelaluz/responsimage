import babel from '@rollup/plugin-babel'
import pkg from './package.json'

export default [
  {
    input: 'src/index.js',
    external: [
      'fs',
      'path',
      'util',
      'sharp',
      'isomorphic-unfetch',
      'colorthief',
      'ora',
      'mkdirp',
      'image-type',
      'read-chunk',
    ],
    plugins: [
      babel({
        exclude: ['node_modules/**'],
      }),
    ],
    output: [
      { file: pkg.main, format: 'cjs', exports: 'named' },
      { file: pkg.module, format: 'es', exports: 'named' },
    ],
  },
]
