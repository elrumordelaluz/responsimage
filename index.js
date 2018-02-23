const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const sharp = require('sharp')
const axios = require('axios')
const ora = require('ora')
const mkdirp = require('mkdirp')

const statAsync = promisify(fs.stat)
const mkdirAsync = promisify(mkdirp)

const spinner = ora()

const createDirIfDoesntExists = dir => {
  spinner.start(`Checking ${dir} directory`)
  return statAsync(dir)
    .then(a => {
      spinner.succeed(`Directory ${dir} alreay exists`)
      return Promise.resolve()
    })
    .catch(err => {
      spinner.succeed(`Directory ${dir} created`)
      return mkdirAsync(dir)
    })
}

const urlRe = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/
const getSource = async source => {
  spinner.start(`Getting Source Image`)
  if (urlRe.test(source)) {
    return await axios({
      method: 'get',
      url: source,
      responseType: 'arraybuffer',
    }).then(res => {
      spinner.succeed(`Source image fetched successfully`)
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
  const dir = options.dir
  const ext = step.ext || options.ext || 'jpg'
  const stepName = step.stepName || 'Image step'
  const hasSize = step.size && Array.isArray(step.size)
  spinner.start(`Processing ${step.stepName || 'step'}`)
  if (hasSize && name) {
    const init = await image.clone().resize(step.size[0], step.size[1])
    const filename = path.resolve(dir, `${name}${suffix}.${ext}`)
    await init.toFile(filename)
    if (webp) {
      const filenameWebp = path.resolve(dir, `${name}${suffix}.webp`)
      await init.webp().toFile(filenameWebp)
    }
    spinner.succeed(
      `${stepName} [${step.size[0]}, ${step.size[1]}] (${ext} ${
        webp ? '+ webp' : ''
      })`
    )
  } else {
    spinner.fail(`${stepName} needs a valid 'size' and 'name' values`)
  }
  return Promise.resolve()
}

const re = /[^\\]*\.(\w+)$/

const processImage = async (
  source,
  { dir = './', webp, name, steps = defaultSteps } = {}
) => {
  try {
    const ext = source.match(re)[1]
    const output = await createDirIfDoesntExists(dir)
    const input = await getSource(source)
    spinner.info(`Source: ${source}`)
    spinner.info(`Destination: ${dir}`)
    const initImage = await sharp(input)
    const options = { webp, dir, name, ext }
    const processSteps = await Promise.all(
      steps.map(async step => await processStep(initImage, step, options))
    )
  } catch (err) {
    console.log(err.stack)
  }
}

module.exports = processImage
