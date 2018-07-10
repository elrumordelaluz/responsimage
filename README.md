# responsimage

Create an array of images from a single input

## Install

```zsh
yarn add responsimage
```

## Usage

```js
const responsimage = require('responsimage')

responsimage('http://lorempixel.com/1200/600/', {
  name: 'my-image',
  dir: './out',
})
```

## API

responsimage(input, [options])

#### input

Type: `String|Buffer`

* a `Buffer` containing JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data
* a `String` containing the path to an JPEG, PNG, WebP, GIF, SVG or TIFF image file
* an `URL` pointing to an image resource

#### options

Type: `Object`

* `dir` output folder (`String`) default: `./`
* `webp` add `.webp` files (`Boolean`) default: `false`
* `name` output images name (`String`) default: `out`
* `fileType` output images type (`String`) default: `jpg`
* `steps` (`[Object]`) default `defaultSteps`\*

  Step shape

  * `stepName` shown in verbose console (`String`)
  * `size` size to process (`[width, height]`)
  * `suffix` to add to `name` (`String`)

  ##### \*defaultSteps

  ```js
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
  ```

## Extras

```js
const { retinify } = require('responsimage')

retinify(input, size, [options])
```

## License

MIT © [Lionel T](https://lionel.tzatzk.in)
