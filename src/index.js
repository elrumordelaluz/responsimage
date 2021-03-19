import { stat } from 'fs'
import { resolve } from 'path'
import { promisify } from 'util'
import sharp from 'sharp'
import fetch from 'isomorphic-unfetch'
import ColorThief from 'colorthief'
import ora from 'ora'
import mkdirp from 'mkdirp'
const statAsync = promisify(stat)

const spinner = ora()

async function createDirIfDoesntExists(dir, quiet) {
  if (!quiet) {
    spinner.start(`Checking ${dir} directory`)
  }
  try {
    await statAsync(dir)
    if (!quiet) {
      spinner.succeed(`Directory ${dir} already exists`)
    }
    return Promise.resolve()
  } catch (err) {
    if (!quiet) {
      spinner.succeed(`Directory ${dir} created`)
    }
    return mkdirp(dir)
  }
}

const urlRe = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/
const getSource = async (source, quiet) => {
  if (!quiet) {
    spinner.start(`Getting Source Image`)
  }
  if (urlRe.test(source)) {
    return await fetch(source)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
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

const processStep = async (image, step, options, jpegOptions) => {
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
      if (ext === 'jpg') {
        await init.jpeg(jpegOptions).toFile(filename)
      } else {
        await init.toFile(filename)
      }
      if (webp) {
        const filenameWebp = resolve(dir, `${name}${suffix}.webp`)
        await init.webp().toFile(filenameWebp)
      }
      if (!options.quiet) {
        spinner.succeed(
          `${stepName} [${step.size[0] || 'auto'}, ${
            step.size[1] || 'auto'
          }] (${ext}${webp ? ' + webp' : ''})`
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
    jpegOptions = {},
  } = {}
) => {
  try {
    let processedSteps = []
    const ext = fileType || source.match(re)[1]
    const input = await getSource(source, quiet)
    const { hex, rgb, hsl } = await getColor(input, {
      bypassSourceCheck: true,
      quiet,
    })

    if (!noWrite) {
      if (!quiet) {
        spinner.info(`Source: ${source}`)
        spinner.info(`Destination: ${dir}`)
      }
      const initImage = await sharp(input)
      await createDirIfDoesntExists(dir, quiet)
      const options = { webp, dir, name, ext, quiet }

      for (let step of steps) {
        const f = await processStep(initImage, step, options, jpegOptions)
        processedSteps.push(f)
      }
    }

    return Promise.resolve({
      images: processedSteps,
      color: { rgb, hex, hsl },
    })
  } catch (err) {
    if (!quiet) {
      spinner.fail(err.stack)
    }
    throw err
  }
}

export default processImage

export async function getColor(
  source,
  { bypassSourceCheck = false, quiet = true } = {}
) {
  let input
  if (bypassSourceCheck) {
    input = source
  } else {
    input = await getSource(source, quiet)
  }
  const rgb = await ColorThief.getColor(input)
  const hex = rgbToHex(...rgb)
  const hsl = rgbToHsl(...rgb)

  return { hex, rgb, hsl }
}

export async function retinify(source, size, options) {
  const opts = Object.assign({}, options, {
    steps: [
      {
        stepName: '2x Image',
        size: size.map((s) => s * 2),
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

function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0

  // No difference
  if (delta == 0) h = 0
  // Red is max
  else if (cmax == r) h = ((g - b) / delta) % 6
  // Green is max
  else if (cmax == g) h = (b - r) / delta + 2
  // Blue is max
  else h = (r - g) / delta + 4

  h = Math.round(h * 60)

  // Make negative hues positive behind 360°
  if (h < 0) h += 360

  l = (cmax + cmin) / 2

  // Calculate saturation
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  // Multiply l and s by 100
  s = +(s * 100).toFixed(1)
  l = +(l * 100).toFixed(1)

  return [h, s, l]
}
