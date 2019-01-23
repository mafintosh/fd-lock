const tape = require('tape')
const lock = require('./')
const { openSync, closeSync, unlinkSync } = require('fs')
const { spawnSync } = require('child_process')

tape('two in one process', function (assert) {
  const fd = openSync(__filename, 'r')
  assert.ok(lock(fd), 'could lock')

  const fd1 = openSync(__filename, 'r')
  assert.notOk(lock(fd1), 'could not lock again')

  assert.ok(lock.unlock(fd), 'could unlock')

  assert.ok(lock(fd1), 'could lock the other one now')
  assert.notOk(lock(fd), 'could not lock first one')
  closeSync(fd1)

  assert.ok(lock(fd), 'could lock first one after closing second one')
  closeSync(fd)

  assert.end()
})

tape('two in one process (new file)', function (assert) {
  const fd = openSync(__filename + '.tmp', 'w')
  assert.ok(lock(fd), 'could lock')

  const fd1 = openSync(__filename + '.tmp', 'r')
  assert.notOk(lock(fd1), 'could not lock again')

  assert.ok(lock.unlock(fd), 'could unlock')

  assert.ok(lock(fd1), 'could lock the other one now')
  assert.notOk(lock(fd), 'could not lock first one')
  closeSync(fd1)

  assert.ok(lock(fd), 'could lock first one after closing second one')
  closeSync(fd)
  unlinkSync(__filename +  '.tmp')

  assert.end()
})


tape('two in different processes', function (assert) {
  const fd = openSync(__filename, 'r')

  assert.ok(lock(fd))

  {
    const { stdout } = spawnSync(process.execPath, [ '-e', `
      const lock = require('${__dirname}')
      const { openSync } = require('fs')
      console.log(lock(openSync('${__filename}', 'r')))
    ` ])

    assert.same(stdout.toString().trim(), 'false', 'Other process could not lock')
  }

  closeSync(fd)

  {
    const { stdout } = spawnSync(process.execPath, [ '-e', `
      const lock = require('${__dirname}')
      const { openSync } = require('fs')
      console.log(lock(openSync('${__filename}', 'r')))
    ` ])

    assert.same(stdout.toString().trim(), 'true', 'Other process could lock')
  }

  assert.end()
})
