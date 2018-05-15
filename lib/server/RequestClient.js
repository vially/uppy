'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('whatwg-fetch');

module.exports = function () {
  function RequestClient(uppy, opts) {
    _classCallCheck(this, RequestClient);

    this.uppy = uppy;
    this.opts = opts;
    this.onReceiveResponse = this.onReceiveResponse.bind(this);
  }

  RequestClient.prototype.onReceiveResponse = function onReceiveResponse(response) {
    var uppyServer = this.uppy.state.uppyServer || {};
    var host = this.opts.host;
    var headers = response.headers;
    // Store the self-identified domain name for the uppy-server we just hit.
    if (headers.has('i-am') && headers.get('i-am') !== uppyServer[host]) {
      var _extends2;

      this.uppy.setState({
        uppyServer: _extends({}, uppyServer, (_extends2 = {}, _extends2[host] = headers.get('i-am'), _extends2))
      });
    }
    return response;
  };

  RequestClient.prototype.get = function get(path) {
    return fetch(this.hostname + '/' + path, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    // @todo validate response status before calling json
    .then(this.onReceiveResponse).then(function (res) {
      return res.json();
    });
  };

  RequestClient.prototype.post = function post(path, data) {
    return fetch(this.hostname + '/' + path, {
      method: 'post',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(this.onReceiveResponse)
    // @todo validate response status before calling json
    .then(function (res) {
      return res.json();
    });
  };

  _createClass(RequestClient, [{
    key: 'hostname',
    get: function get() {
      var uppyServer = this.uppy.state.uppyServer || {};
      var host = this.opts.host;
      return uppyServer[host] || host;
    }
  }]);

  return RequestClient;
}();
//# sourceMappingURL=RequestClient.js.map