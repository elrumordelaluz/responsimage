const processImage = require('./index')
const { retina } = processImage
retina('./img_example.jpg', [100, 100], { name: 'yup' })
