# responsimage

Create an array of images from a single input

### Example
```js

;(async function() {
  const source = 'http://lorempixel.com/1200/600/'
  const name = 'my-image'
  await responsimage(source, { name })
})()

```

### API

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
