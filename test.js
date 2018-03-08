import fs from 'fs'
import path from 'path'
import test from 'ava'
import rimraf from 'rimraf'
import tempy from 'tempy'
import imageSize from 'image-size'
import processImage from './'
import { promisify } from 'util'

const primraf = promisify(rimraf)
const sizeOf = promisify(imageSize)
const pstat = promisify(fs.stat)

const localImg = 'img_example.jpg'
const dir = './test/out'
const name = 'test_image'

test('Generate output from local image', async t => {
  const input = path.resolve('./test/fixtures', localImg)
  const dir = tempy.directory()
  const name = 'test'
  const suffix = '_1'
  const steps = [
    {
      stepName: 'Test 1',
      size: [],
      suffix,
      name,
    },
  ]
  await processImage(input, { dir, steps })

  t.notThrows(
    async () => await pstat(path.resolve(dir, `${name}${suffix}.jpg`))
  )
})

test('Mantain size if empty Array provided', async t => {
  const input = path.resolve('./test/fixtures', localImg)
  const dir = tempy.directory()
  const name = 'test'
  const suffix = '_1'
  const steps = [
    {
      stepName: 'Test 1',
      size: [],
      suffix,
      name,
    },
  ]
  await processImage(input, { dir, steps })
  const sourceSize = await sizeOf(input)
  const processedSize = await sizeOf(
    path.resolve(dir, `${name}${suffix}.jpg`)
  )
  t.deepEqual(sourceSize, processedSize)
})
