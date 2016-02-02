#!/usr/bin/env node

var ssbClient = require('ssb-client')
var ssbify = require('./index.js')

if (!process.argv[2]) {
  console.error('usage: ssbify <url>')
  process.exit(1)
}

ssbClient(function (err, sbot) {
  if (err) throw err
  ssbify(sbot, process.argv[2], function (err, res) {
    if (err) throw err
    console.log(res)
    process.exit(0)
  })
})
