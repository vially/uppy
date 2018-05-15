var FileItem = require('./FileItem');
var ActionBrowseTagline = require('./ActionBrowseTagline');
// const { dashboardBgIcon } = require('./icons')
var classNames = require('classnames');

var _require = require('preact'),
    h = _require.h;

module.exports = function (props) {
  var noFiles = props.totalFileCount === 0;
  var dashboardFilesClass = classNames('uppy-Dashboard-files', { 'uppy-Dashboard-files--noFiles': noFiles });

  return h(
    'ul',
    { 'class': dashboardFilesClass },
    noFiles && h(
      'div',
      { 'class': 'uppy-Dashboard-bgIcon' },
      h(
        'div',
        { 'class': 'uppy-Dashboard-dropFilesTitle' },
        h(ActionBrowseTagline, {
          acquirers: props.acquirers,
          handleInputChange: props.handleInputChange,
          i18n: props.i18n,
          allowedFileTypes: props.allowedFileTypes,
          maxNumberOfFiles: props.maxNumberOfFiles
        })
      ),
      props.note && h(
        'div',
        { 'class': 'uppy-Dashboard-note' },
        props.note
      )
    ),
    Object.keys(props.files).map(function (fileID) {
      return FileItem({
        acquirers: props.acquirers,
        file: props.files[fileID],
        toggleFileCard: props.toggleFileCard,
        showProgressDetails: props.showProgressDetails,
        info: props.info,
        log: props.log,
        i18n: props.i18n,
        removeFile: props.removeFile,
        pauseUpload: props.pauseUpload,
        cancelUpload: props.cancelUpload,
        retryUpload: props.retryUpload,
        resumableUploads: props.resumableUploads,
        isWide: props.isWide,
        showLinkToFileUploadResult: props.showLinkToFileUploadResult,
        metaFields: props.metaFields
      });
    })
  );
};
//# sourceMappingURL=FileList.js.map