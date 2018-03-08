import fs from 'fs'
import path from 'path'
import test from 'ava'
import rimraf from 'rimraf'
import tmp from 'tmp'
import imageSize from 'image-size'
import processImage from './'
import { promisify } from 'util'

const primraf = promisify(rimraf)
const sizeOf = promisify(imageSize)
const pstat = promisify(fs.stat)
const tempDir = promisify(tmp.dir)

test.beforeEach(async t => {
  t.context.name = 'test'
  t.context.input = path.resolve(
    './test/fixtures',
    'marcelo-vaz-408595-unsplash.jpg'
  )
  t.context.dir = await tempDir({ unsafeCleanup: true })
})

test('Generate output', async t => {
  const { input, dir, name } = t.context
  const steps = [{ size: [], name }]
  await processImage(t.context.input, { dir, steps })
  t.notThrows(async () => await pstat(path.resolve(dir, `${name}.jpg`)))
})

test('Original size if empty Array provided', async t => {
  const { input, dir, name } = t.context
  const steps = [{ size: [], name }]

  await processImage(input, { dir, steps })
  const sourceSize = await sizeOf(input)
  const processedSize = await sizeOf(path.resolve(dir, `${name}.jpg`))

  t.deepEqual(sourceSize, processedSize)
})

test('Resize width and height', async t => {
  const { input, dir, name } = t.context
  const steps = [{ size: [250, 250], name }]

  await processImage(input, { dir, steps })
  const { width, height } = await sizeOf(path.resolve(dir, `${name}.jpg`))

  t.deepEqual({ width, height }, { width: 250, height: 250 })
})

test('Resize only width', async t => {
  const { input, dir, name } = t.context
  const newWidth = 256
  const steps = [{ size: [newWidth], name }]

  await processImage(input, { dir, steps })
  const { width: originalWidth, height: originalHeight } = await sizeOf(input)
  const { width, height } = await sizeOf(path.resolve(dir, `${name}.jpg`))
  const factor = originalWidth / newWidth
  t.deepEqual(
    { width, height },
    { width: newWidth, height: Math.round(originalHeight / factor) }
  )
})
