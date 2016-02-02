var readability = require('node-readability')
var tomd = require('to-markdown')
var striptags = require('striptags')
var request = require('request')
var pull = require('pull-stream')
var createHash = require('crypto').createHash
var cheerio = require('cheerio')
var async = require('async')

var addBlob = function (sbot, buf, cb) {
  var hash = createHash('sha256')
  hash.update(buf)
  var blobId = '&' + hash.digest('base64') + '.sha256'
  pull(pull.values([buf]),
       sbot.blobs.add(blobId, function (err, res) {
         if (err) return cb(err)
         cb(null, blobId)
       }))
}

var waitUntilHas = function (sbot, hash, cb) {
  // i could not get this to work reliably
  // in any other way. The add command seems to
  // callback before the blob has actually been written.
  pull(
    sbot.blobs.get(hash),
    pull.collect(function (errIgnore, res) {
      // here we ignore the error of the blob not being
      // found in the filesystem.
      if (!res[0]) {
        setTimeout(function () {
          waitUntilHas(sbot, hash, cb)
        }, 100)
      } else {
        cb(null, hash)
      }
    }))
}

module.exports = function (sbot, opts, cb) {
  if (typeof opts === 'string') opts = { url: opts }
  readability(opts.url, function (err, article) {
    if (err) return cb(err)

    var doc = cheerio.load(article.content)

    var modify = []
    doc('img').map(function (i, el) { modify.push(el) })

    async.map(modify, function (el, mcb) {
      var src = el.attribs.src
      request.get(src, { encoding: null }, function (err, res, body) {
        if (err) throw err
        if (res.statusCode === 200) {
          addBlob(sbot, new Buffer(body), function (err, res) {
            if (err) throw err
            el.attribs.src = res
            mcb(null)
          })
        } else {
          if (opts.ignoreBrokenImgLinks) {
            el.attribs.src = ''
            mcb(null)
          } else {
            cb(new Error('broken image link at: ' + src))
          }
        }
      })
    }, function (res) {
      var md = '# ' + article.title + '\n\n' +
        striptags(tomd(doc.html())) + '\n\n' +
        '[ssbify source](' + opts.url + ')\n'

      // remove superflous newlines
      md = md.replace(/\n\s*\n/g, '\n\n')
      addBlob(sbot, new Buffer(md), function (err, res) {
        if (err) return cb(err)
        waitUntilHas(sbot, res, cb)
      })
    })
  })
}
