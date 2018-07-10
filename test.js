import fs from 'fs'
import path from 'path'
import test from 'ava'
import tmp from 'tmp'
import imageSize from 'image-size'
import processImage, { retinify } from './dist/responsimage.cjs'
import { promisify } from 'util'

const sizeOf = promisify(imageSize)
const pstat = promisify(fs.stat)
const tempDir = promisify(tmp.dir)

test.beforeEach(async t => {
  t.context.name = 'test'
  t.context.input = path.resolve(
    './fixtures',
    'marcelo-vaz-408595-unsplash.jpg'
  )
  t.context.externalUrl =
    'https://images.unsplash.com/photo-1507667522877-ad03f0c7b0e0'
  t.context.dir = await tempDir({ unsafeCleanup: true })
})

test('Generate output', async t => {
  const { input, dir, name } = t.context
  const steps = [{ size: [], name }]
  await processImage(input, { dir, steps })
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

test('URL input', async t => {
  const { dir, name, externalUrl: input } = t.context
  const steps = [{ size: [250, 250], name }]

  await processImage(input, { dir, steps })
  const { width, height } = await sizeOf(path.resolve(dir, `${name}.jpg`))
  t.deepEqual({ width, height }, { width: 250, height: 250 })
})

test('Retina', async t => {
  const { dir, name, input } = t.context
  await retinify(input, [250, 250], { name, dir })
  const { width, height } = await sizeOf(path.resolve(dir, `${name}.jpg`))
  const { width: retinaWidth, height: retinaHeight } = await sizeOf(
    path.resolve(dir, `${name}_retina.jpg`)
  )
  t.deepEqual({ width, height }, { width: 250, height: 250 })
  t.deepEqual(
    { width: retinaWidth, height: retinaHeight },
    { width: 500, height: 500 }
  )
})
