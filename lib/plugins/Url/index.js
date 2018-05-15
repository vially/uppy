var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('../../core/Plugin');
var Translator = require('../../core/Translator');

var _require = require('preact'),
    h = _require.h;

var _require2 = require('../../server'),
    RequestClient = _require2.RequestClient;

var UrlUI = require('./UrlUI.js');
require('whatwg-fetch');

/**
 * Url
 *
 */
module.exports = function (_Plugin) {
  _inherits(Url, _Plugin);

  function Url(uppy, opts) {
    _classCallCheck(this, Url);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.id = _this.opts.id || 'Url';
    _this.title = 'Link';
    _this.type = 'acquirer';
    _this.icon = function () {
      return h(
        'svg',
        { 'aria-hidden': 'true', 'class': 'UppyIcon UppyModalTab-icon', width: '64', height: '64', viewBox: '0 0 64 64' },
        h('circle', { cx: '32', cy: '32', r: '31' }),
        h(
          'g',
          { 'fill-rule': 'nonzero', fill: '#FFF' },
          h('path', { d: 'M25.774 47.357a4.077 4.077 0 0 1-5.76 0L16.9 44.24a4.076 4.076 0 0 1 0-5.758l5.12-5.12-1.817-1.818-5.12 5.122a6.651 6.651 0 0 0 0 9.392l3.113 3.116a6.626 6.626 0 0 0 4.699 1.943c1.7 0 3.401-.649 4.697-1.943l10.241-10.243a6.591 6.591 0 0 0 1.947-4.696 6.599 6.599 0 0 0-1.947-4.696l-3.116-3.114-1.817 1.817 3.116 3.114a4.045 4.045 0 0 1 1.194 2.88 4.045 4.045 0 0 1-1.194 2.878L25.774 47.357z' }),
          h('path', { d: 'M46.216 14.926a6.597 6.597 0 0 0-4.696-1.946h-.001a6.599 6.599 0 0 0-4.696 1.945L26.582 25.167a6.595 6.595 0 0 0-1.947 4.697 6.599 6.599 0 0 0 1.946 4.698l3.114 3.114 1.818-1.816-3.114-3.114a4.05 4.05 0 0 1-1.194-2.882c0-1.086.424-2.108 1.194-2.878L38.64 16.744a4.042 4.042 0 0 1 2.88-1.194c1.089 0 2.11.425 2.88 1.194l3.114 3.114a4.076 4.076 0 0 1 0 5.758l-5.12 5.12 1.818 1.817 5.12-5.122a6.649 6.649 0 0 0 0-9.393l-3.113-3.114-.003.002z' })
        )
      );
    };

    // Set default options and locale
    var defaultLocale = {
      strings: {
        import: 'Import',
        enterUrlToImport: 'Enter URL to import a file',
        failedToFetch: 'Uppy Server failed to fetch this URL, please make sure it’s correct',
        enterCorrectUrl: 'Incorrect URL: Please make sure you are entering a direct link to a file'
      }
    };

    var defaultOptions = {
      locale: defaultLocale
    };

    _this.opts = _extends({}, defaultOptions, opts);

    _this.locale = _extends({}, defaultLocale, _this.opts.locale);
    _this.locale.strings = _extends({}, defaultLocale.strings, _this.opts.locale.strings);

    _this.translator = new Translator({ locale: _this.locale });
    _this.i18n = _this.translator.translate.bind(_this.translator);

    _this.hostname = _this.opts.host;

    if (!_this.hostname) {
      throw new Error('Uppy Server hostname is required, please consult https://uppy.io/docs/server');
    }

    // Bind all event handlers for referencability
    _this.getMeta = _this.getMeta.bind(_this);
    _this.addFile = _this.addFile.bind(_this);

    _this.server = new RequestClient(uppy, { host: _this.opts.host });
    return _this;
  }

  Url.prototype.getFileNameFromUrl = function getFileNameFromUrl(url) {
    return url.substring(url.lastIndexOf('/') + 1);
  };

  Url.prototype.checkIfCorrectURL = function checkIfCorrectURL(url) {
    if (!url) return false;

    var protocol = url.match(/^([a-z0-9]+):\/\//)[1];
    if (protocol !== 'http' && protocol !== 'https') {
      return false;
    }

    return true;
  };

  Url.prototype.addProtocolToURL = function addProtocolToURL(url) {
    var protocolRegex = /^[a-z0-9]+:\/\//;
    var defaultProtocol = 'http://';
    if (protocolRegex.test(url)) {
      return url;
    }

    return defaultProtocol + url;
  };

  Url.prototype.getMeta = function getMeta(url) {
    var _this2 = this;

    return this.server.post('url/meta', { url: url }).then(function (res) {
      if (res.error) {
        _this2.uppy.log('[URL] Error:');
        _this2.uppy.log(res.error);
        throw new Error('Failed to fetch the file');
      }
      return res;
    });
  };

  Url.prototype.addFile = function addFile(url) {
    var _this3 = this;

    url = this.addProtocolToURL(url);
    if (!this.checkIfCorrectURL(url)) {
      this.uppy.log('[URL] Incorrect URL entered: ' + url);
      this.uppy.info(this.i18n('enterCorrectUrl'), 'error', 4000);
      return;
    }

    return this.getMeta(url).then(function (meta) {
      var tagFile = {
        source: _this3.id,
        name: _this3.getFileNameFromUrl(url),
        type: meta.type,
        data: {
          size: meta.size
        },
        isRemote: true,
        body: {
          url: url
        },
        remote: {
          host: _this3.opts.host,
          url: _this3.hostname + '/url/get',
          body: {
            fileId: url,
            url: url
          }
        }
      };
      return tagFile;
    }).then(function (tagFile) {
      _this3.uppy.log('[Url] Adding remote file');
      return _this3.uppy.addFile(tagFile);
    }).then(function () {
      var dashboard = _this3.uppy.getPlugin('Dashboard');
      if (dashboard) dashboard.hideAllPanels();
    }).catch(function (err) {
      _this3.uppy.log(err);
      _this3.uppy.info({
        message: _this3.i18n('failedToFetch'),
        details: err
      }, 'error', 4000);
    });
  };

  Url.prototype.render = function render(state) {
    return h(UrlUI, {
      i18n: this.i18n,
      addFile: this.addFile });
  };

  Url.prototype.install = function install() {
    var target = this.opts.target;
    if (target) {
      this.mount(target, this);
    }
  };

  Url.prototype.uninstall = function uninstall() {
    this.unmount();
  };

  return Url;
}(Plugin);
//# sourceMappingURL=index.js.map