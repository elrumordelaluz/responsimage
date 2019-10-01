import { stat } from 'fs'
import { resolve } from 'path'
import { promisify } from 'util'
import sharp from 'sharp'
import fetch from 'isomorphic-unfetch'
import ora from 'ora'
import mkdirp from 'mkdirp'
import ColorThief from 'color-thief'
const statAsync = promisify(stat)
const mkdirAsync = promisify(mkdirp)

const spinner = ora()
const colorThief = new ColorThief()

const createDirIfDoesntExists = (dir, quiet) => {
  if (!quiet) {
    spinner.start(`Checking ${dir} directory`)
  }
  return statAsync(dir)
    .then(a => {
      if (!quiet) {
        spinner.succeed(`Directory ${dir} already exists`)
      }
      return Promise.resolve()
    })
    .catch(err => {
      if (!quiet) {
        spinner.succeed(`Directory ${dir} created`)
      }
      return mkdirAsync(dir)
    })
}

const urlRe = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/
const getSource = async (source, quiet) => {
  if (!quiet) {
    spinner.start(`Getting Source Image`)
  }
  if (urlRe.test(source)) {
    return await fetch(source)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        if (!quiet) {
          spinner.succeed(`Source image fetched successfully`)
        }
        return toBuffer(arrayBuffer)
      })
  }
  return Promise.resolve(source)
}

function toBuffer(ab) {
  const buf = Buffer.alloc(ab.byteLength)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i]
  }
  return buf
}

const defaultSteps = [
  {
    stepName: '2x BIG Images',
    size: [960, 836],
    suffix: '_retina',
  },
  {
    stepName: '1x BIG Images',
    size: [540, 470],
  },
  {
    stepName: '2x SMALL Images',
    size: [750, 653],
    suffix: '_small_retina',
  },
  {
    stepName: '1x SMALL Images',
    size: [375, 326],
    suffix: '_small',
  },
]

const processStep = async (image, step, options) => {
  const suffix = step.suffix || ''
  const name = step.name || options.name
  const webp = step.webp || (step.webp === undefined && options.webp)
  const ext = step.ext || options.ext || 'jpg'
  const stepName = step.stepName || 'Image step'
  const hasSize = step.size && Array.isArray(step.size)
  try {
    if (!options.quiet) {
      spinner.start(`Processing ${step.stepName || 'step'}`)
    }
    if (hasSize && name) {
      let dir = options.dir
      if (step.folder) {
        dir = `${dir}/${step.folder}`
        await createDirIfDoesntExists(dir, options.quiet)
      }
      const init = await image.clone().resize(step.size[0], step.size[1])
      const filename = resolve(dir, `${name}${suffix}.${ext}`)
      await init.toFile(filename)
      if (webp) {
        const filenameWebp = resolve(dir, `${name}${suffix}.webp`)
        await init.webp().toFile(filenameWebp)
      }
      if (!options.quiet) {
        spinner.succeed(
          `${stepName} [${step.size[0] || 'auto'}, ${step.size[1] ||
            'auto'}] (${ext}${webp ? ' + webp' : ''})`
        )
      }
      return Promise.resolve(filename)
    } else {
      if (!options.quiet) {
        spinner.fail(`${stepName} needs a valid 'size' and 'name' values`)
      }
      throw `${stepName} needs a valid 'size' and 'name' values`
    }
  } catch (err) {
    Promise.reject(err)
  }
}

const re = /[^\\]*\.(\w+)$/

const processImage = async (
  source,
  {
    dir = './',
    webp,
    name = 'out',
    fileType = 'jpg',
    steps = defaultSteps,
    quiet = false,
    noWrite = false,
  } = {}
) => {
  try {
    let processedSteps = []
    const ext = fileType || source.match(re)[1]
    const input = await getSource(source, quiet)
    const color = await colorThief.getColor(input)

    if (!noWrite) {
      if (!quiet) {
        spinner.info(`Source: ${source}`)
        spinner.info(`Destination: ${dir}`)
      }
      const initImage = await sharp(input)
      await createDirIfDoesntExists(dir, quiet)
      const options = { webp, dir, name, ext, quiet }

      for (let step of steps) {
        const f = await processStep(initImage, step, options)
        processedSteps.push(f)
      }
    }

    return Promise.resolve({
      images: processedSteps,
      rgb: color,
      hex: RGBToHex(color),
    })
  } catch (err) {
    if (!quiet) {
      spinner.fail(err.stack)
    }
    throw err
  }
}

function RGBToHex(rgb) {
  let r = rgb[0].toString(16)
  let g = rgb[1].toString(16)
  let b = rgb[2].toString(16)

  if (r.length == 1) r = '0' + r
  if (g.length == 1) g = '0' + g
  if (b.length == 1) b = '0' + b

  return '#' + r + g + b
}

export default processImage

export async function retinify(source, size, options) {
  const opts = Object.assign({}, options, {
    steps: [
      {
        stepName: '2x Image',
        size: size.map(s => s * 2),
        suffix: '_retina',
      },
      {
        stepName: '1x Image',
        size,
      },
    ],
  })
  return await processImage(source, opts)
}
