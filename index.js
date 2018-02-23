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
  spinner.start(`Checking ${outputFolder} directory`)
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
    stepName: '2x DEFAULT Images',
    size: [960, 836],
    suffix: '_retina',
    // webp: true,
  },
  {
    stepName: '1x DEFAULT Images',
    size: [540, 470],
    // webp: true,
  },
  {
    stepName: '2x SMALL Images',
    size: [750, 653],
    suffix: '_small_retina',
    // webp: true,
  },
  {
    stepName: '1x SMALL Images',
    size: [375, 326],
    suffix: '_small',
    // webp: true,
  },
]



const re = /[^\\]*\.(\w+)$/

const processImage = async ({
  source,
  outputFolder = './',
  name,
  steps = defaultSteps,
}) => {
  try {
    // const re = /[^\\]*\.(\w+)$/
    const ext = source.match(re)[1]

    const dir = await createDirIfDoesntExists(outputFolder)
    const input = await getSource(source)
    spinner.info(`Source: ${source}`)

    const initImage = await sharp(input)
    const processSteps = await Promise.all(
      steps.map(async step => {
        const suffix = step.suffix || ''
        spinner.start(`Processing ${step.stepName || 'step'}`)
        const init = await initImage.clone().resize(step.size[0], step.size[1])
        const filename = path.resolve(outputFolder, `${name}${suffix}.${ext}`)
        await init.toFile(filename)
        if (step.webp) {
          const filenameWebp = path.resolve(
            outputFolder,
            `${name}${suffix}.webp`
          )
          await init.webp().toFile(filenameWebp)
        }
        spinner.succeed(`${step.stepName || 'step'} done`)
        return await Promise.resolve(step.stepName)
      })
    )
  } catch (err) {
    console.log(err.stack)
  }
}

const source = process.argv[2]
const outputFolder = process.argv[3]
const name = process.argv[4]

if (source && name) {
  processImage({ source, name, outputFolder })
}

module.exports = processImage
