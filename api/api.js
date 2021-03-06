const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const consola = require('consola')

// export the server middleware
module.exports = {
  path: '/api',
  handler: app
}
// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// Parse application/json
app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
// Fixes body being an array when coming from MTASA. Needs further investigation.
app.use('/', (req, res, next) => {
  if (req.body instanceof Array && req.body.length === 1) { req.body = req.body[0] }

  next()
})

app.use((error, req, res, next) => {
  if (!error.status) error.status = 500

  res.status(error.status)
  res.json({
    error: error.status,
    generated: new Date()
  })
})

// Cors
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With'
  )

  // intercepts OPTIONS method
  if (req.method === 'OPTIONS') {
    // respond with 200
    res.send(200)
  } else {
    next()
  }
})
app.options('/*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With'
  )
  res.send(200)
})

// Root api
app.post('/', function (req, res, next) {
  res.json({
    helloWorld: 'Hi!',
    generated: new Date()
  })
})

app.get('/', (req, res, next) => {
  res.json({
    helloWorld: 'Hi!',
    generated: new Date()
  })
})

// Handle paypal's IPN posts
app.post('/ipn', async function (req, res, next) {
  // Paypal Instand Payment Notification
  res.status(200).send('OK')
  res.end()

  const body = req.body || {}

  // Validate IPN message with PayPal
  const PayPalService = require('../server/payment/paypal-ipn')
  try {
    const isValidated = await PayPalService.validate(body)
    if (!isValidated) {
      consola.error('Error validating IPN message.')
      return
    }
  } catch (err) {
    consola.error(err)
    return
  }
  // Handle the IPN message
  PayPalService.handle(body)
})

// Routes
app.use('/web', require('./web/web'))
app.use('/mapupload', require('./web/mapupload'))
app.use('/admin', require('./web/admin'))
app.use('/account', require('./account/account'))
app.use('/users', require('./account/users'))

// Catch all for 404 error
app.all('*', (req, res) => {
  const errorStatusCode = 404
  res.status(errorStatusCode)
  res.json({
    error: errorStatusCode,
    generated: new Date()
  })
})
