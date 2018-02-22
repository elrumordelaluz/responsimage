const fs = require('fs')
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

const processImage = async ({ source, outputFolder = './', name }) => {
  try {
    const re = /[^\\]*\.(\w+)$/
    const ext = source.match(re)[1]

    await createDirIfDoesntExists(outputFolder)
    const input = await getSource(source)
    spinner.info(source)
    const initImage = await sharp(input)
    
    spinner.start(`Processing 2x DEFAULT Images`)
    const fnDefaultRetina = `${outputFolder}/${name}_retina.${ext}`
    const fnDefaultRetinaWebp = `${outputFolder}/${name}_retina.webp`
    // const defaultRetinaResized = await initImage.clone().resize(1080, 940)
    const defaultRetinaResized = await initImage.clone().resize(960, 836)
    const defaultRetinaJpg = await defaultRetinaResized.toFile(fnDefaultRetina)
    const defaultRetinaWebp = await defaultRetinaResized
      .webp()
      .toFile(fnDefaultRetinaWebp)
    spinner.succeed(`2x DEFAULT images written`)
    spinner.info(fnDefaultRetina)
    spinner.info(fnDefaultRetinaWebp)

    spinner.start(`Processing 1x DEFAULT Images`)
    const fnDefault = `${outputFolder}/${name}.${ext}`
    const fnDefaultWebp = `${outputFolder}/${name}.webp`
    const defaultResized = await initImage.clone().resize(540, 470)
    const defaultJpg = await defaultResized.toFile(fnDefault)
    const defaultWebp = await defaultResized.webp().toFile(fnDefaultWebp)
    spinner.succeed(`1x DEFAULT images written `)
    spinner.info(fnDefault)
    spinner.info(fnDefaultWebp)

    spinner.start(`Processing 2x SMALL Images`)
    const fnSmallRetina = `./${outputFolder}/${name}_small_retina.${ext}`
    const fnSmallRetinaWebp = `./${outputFolder}/${name}_small_retina.webp`
    const smallRetinaResized = await initImage.clone().resize(750, 653)
    const smallRetinaJpg = await smallRetinaResized.toFile(fnSmallRetina)
    const smallRetinaWebp = await smallRetinaResized
      .webp()
      .toFile(fnSmallRetinaWebp)
    spinner.succeed(`2x SMALL images written`)
    spinner.info(fnSmallRetina)
    spinner.info(fnSmallRetinaWebp)

    spinner.start(`Processing 1x SMALL Images`)
    const fnSmall = `./${outputFolder}/${name}_small.${ext}`
    const fnSmallWebp = `./${outputFolder}/${name}_small.webp`
    const smallResized = await initImage.clone().resize(375, 326)
    const smallJpg = await smallResized.toFile(fnSmall)
    const smallWebp = await smallResized.webp().toFile(fnSmallWebp)
    spinner.succeed(`2x SMALL images written `)
    spinner.info(fnSmall)
    spinner.info(fnSmallWebp)
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
