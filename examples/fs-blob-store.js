
const fileStore = require('fs-blob-store');

var store = fileStore('tmp')

var test = store.createWriteStream({key: 'foo/bar/baz/test.txt'}, function(err, opts) {
  console.log('done', opts.key)
  store.createReadStream(opts).pipe(process.stdout)
})

test.write('hello')
test.end('world\n')
