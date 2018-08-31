function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var getFileTypeIcon = require('./getFileTypeIcon');
var FilePreview = require('./FilePreview');

var _require = require('preact'),
    h = _require.h,
    Component = _require.Component;

module.exports = function (_Component) {
  _inherits(FileCard, _Component);

  function FileCard(props) {
    _classCallCheck(this, FileCard);

    var _this = _possibleConstructorReturn(this, _Component.call(this, props));

    _this.meta = {};

    _this.tempStoreMetaOrSubmit = _this.tempStoreMetaOrSubmit.bind(_this);
    _this.renderMetaFields = _this.renderMetaFields.bind(_this);
    _this.handleSave = _this.handleSave.bind(_this);
    _this.handleCancel = _this.handleCancel.bind(_this);
    return _this;
  }

  FileCard.prototype.tempStoreMetaOrSubmit = function tempStoreMetaOrSubmit(ev) {
    var file = this.props.files[this.props.fileCardFor];

    if (ev.keyCode === 13) {
      ev.stopPropagation();
      ev.preventDefault();
      this.props.saveFileCard(this.meta, file.id);
      return;
    }

    var value = ev.target.value;
    var name = ev.target.dataset.name;
    this.meta[name] = value;
  };

  FileCard.prototype.renderMetaFields = function renderMetaFields(file) {
    var _this2 = this;

    var metaFields = this.props.metaFields || [];
    return metaFields.map(function (field) {
      return h(
        'fieldset',
        { 'class': 'uppy-DashboardFileCard-fieldset' },
        h(
          'label',
          { 'class': 'uppy-DashboardFileCard-label' },
          field.name
        ),
        h('input', { 'class': 'uppy-c-textInput uppy-DashboardFileCard-input',
          type: 'text',
          'data-name': field.id,
          value: file.meta[field.id],
          placeholder: field.placeholder,
          onkeyup: _this2.tempStoreMetaOrSubmit,
          onkeydown: _this2.tempStoreMetaOrSubmit,
          onkeypress: _this2.tempStoreMetaOrSubmit })
      );
    });
  };

  FileCard.prototype.handleSave = function handleSave(ev) {
    var fileID = this.props.fileCardFor;
    this.props.saveFileCard(this.meta, fileID);
  };

  FileCard.prototype.handleCancel = function handleCancel(ev) {
    this.meta = {};
    this.props.toggleFileCard();
  };

  FileCard.prototype.render = function render() {
    if (!this.props.fileCardFor) {
      return h('div', { 'class': 'uppy-DashboardFileCard', 'aria-hidden': true });
    }

    var file = this.props.files[this.props.fileCardFor];

    return h(
      'div',
      { 'class': 'uppy-DashboardFileCard', 'aria-hidden': !this.props.fileCardFor },
      h(
        'div',
        { style: { width: '100%', height: '100%' } },
        h(
          'div',
          { 'class': 'uppy-DashboardContent-bar' },
          h(
            'div',
            { 'class': 'uppy-DashboardContent-title', role: 'heading', 'aria-level': 'h1' },
            this.props.i18nArray('editing', {
              file: h(
                'span',
                { 'class': 'uppy-DashboardContent-titleFile' },
                file.meta ? file.meta.name : file.name
              )
            })
          ),
          h(
            'button',
            { 'class': 'uppy-DashboardContent-back', type: 'button', title: this.props.i18n('finishEditingFile'),
              onclick: this.handleSave },
            this.props.i18n('done')
          )
        ),
        h(
          'div',
          { 'class': 'uppy-DashboardFileCard-inner' },
          h(
            'div',
            { 'class': 'uppy-DashboardFileCard-preview', style: { backgroundColor: getFileTypeIcon(file.type).color } },
            h(FilePreview, { file: file })
          ),
          h(
            'div',
            { 'class': 'uppy-DashboardFileCard-info' },
            this.renderMetaFields(file)
          ),
          h(
            'div',
            { 'class': 'uppy-Dashboard-actions' },
            h(
              'button',
              { 'class': 'uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Dashboard-actionsBtn',
                type: 'button',
                onclick: this.handleSave },
              this.props.i18n('saveChanges')
            ),
            h(
              'button',
              { 'class': 'uppy-u-reset uppy-c-btn uppy-c-btn-link uppy-Dashboard-actionsBtn',
                type: 'button',
                onclick: this.handleCancel },
              this.props.i18n('cancel')
            )
          )
        )
      )
    );
  };

  return FileCard;
}(Component);