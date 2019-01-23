const binding = require('node-gyp-build')(__dirname)

lock.unlock = unlock
module.exports = lock

function lock (fd) {
  return !!binding.lock_fd(fd)
}

function unlock (fd) {
  return !!binding.unlock_fd(fd)
}
