# responsimage

Create an array of images from a single input

### Example

```js

;(async function() {
  const source = 'http://lorempixel.com/1200/600/'
  const options = {
    name: 'my-image'
  }
  await responsimage(source, options)
})()

```

## API

### source

Can be:
- a `Buffer` containing JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data
- a `String` containing the path to an JPEG, PNG, WebP, GIF, SVG or TIFF image file
- an `URL` pointing to an image resource

### 

_wip_

### defaultSteps
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
