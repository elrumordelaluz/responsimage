import { stat } from 'fs'
import { resolve } from 'path'
import { promisify } from 'util'
import sharp from 'sharp'
import axios from 'axios'
import ora from 'ora'
import mkdirp from 'mkdirp'

const statAsync = promisify(stat)
const mkdirAsync = promisify(mkdirp)

const spinner = ora()

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
    return await axios({
      method: 'get',
      url: source,
      responseType: 'arraybuffer',
    }).then(res => {
      if (!quiet) {
        spinner.succeed(`Source image fetched successfully`)
      }
      return res.data
    })
  }
  return Promise.resolve(source)
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
  } else {
    if (!options.quiet) {
      spinner.fail(`${stepName} needs a valid 'size' and 'name' values`)
    }
  }
  return Promise.resolve()
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
  } = {}
) => {
  try {
    const ext = fileType || source.match(re)[1]
    const input = await getSource(source, quiet)
    if (!quiet) {
      spinner.info(`Source: ${source}`)
      spinner.info(`Destination: ${dir}`)
    }
    const initImage = await sharp(input)
    const options = { webp, dir, name, ext, quiet }
    await Promise.all(
      steps.map(async step => await processStep(initImage, step, options))
    )
  } catch (err) {
    if (!quiet) {
      spinner.fail(err.stack)
    }
  }
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
