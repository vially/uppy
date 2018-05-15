function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

/**
 * Wait for multiple Promises to resolve.
 */
module.exports = function () {
  function PromiseWaiter() {
    _classCallCheck(this, PromiseWaiter);

    this.promises = [];
  }

  PromiseWaiter.prototype.add = function add(promise) {
    var _this = this;

    this.promises.push(promise);

    var remove = function remove() {
      _this.remove(promise);
    };
    promise.then(remove, remove);
  };

  PromiseWaiter.prototype.remove = function remove(promise) {
    var index = this.promises.indexOf(promise);
    if (index !== -1) {
      this.promises.splice(index, 1);
    }
  };

  PromiseWaiter.prototype.wait = function wait() {
    var promises = this.promises;
    this.promises = [];

    function noop() {}
    // No result value


    // Just wait for a Promise to conclude in some way, whether it's resolution
    // or rejection. We don't care about the contents.
    function concluded(promise) {
      return promise.then(noop, noop);
    }

    return _Promise.all(promises.map(concluded)).then(noop);
  };

  return PromiseWaiter;
}();
//# sourceMappingURL=PromiseWaiter.js.map