var Breadcrumbs = require('./Breadcrumbs');
var Filter = require('./Filter');
var Table = require('./ItemList');

var _require = require('preact'),
    h = _require.h;

module.exports = function (props) {
  var filteredFolders = props.folders;
  var filteredFiles = props.files;

  if (props.filterInput !== '') {
    filteredFolders = props.filterItems(props.folders);
    filteredFiles = props.filterItems(props.files);
  }

  return h(
    'div',
    { 'class': 'uppy-ProviderBrowser uppy-ProviderBrowser-viewType--' + props.viewType },
    h(
      'div',
      { 'class': 'uppy-ProviderBrowser-header' },
      h(
        'div',
        { 'class': 'uppy-ProviderBrowser-headerBar ' + (!props.showBreadcrumbs ? 'uppy-ProviderBrowser-headerBar--simple' : '') },
        h(
          'div',
          { 'class': 'uppy-Provider-breadcrumbsIcon' },
          props.pluginIcon && props.pluginIcon()
        ),
        props.showBreadcrumbs && Breadcrumbs({
          getFolder: props.getFolder,
          directories: props.directories,
          title: props.title
        }),
        h(
          'span',
          { 'class': 'uppy-ProviderBrowser-user' },
          props.username
        ),
        h(
          'button',
          { type: 'button', onclick: props.logout, 'class': 'uppy-ProviderBrowser-userLogout' },
          'Log out'
        )
      )
    ),
    props.showFilter && h(Filter, props),
    Table({
      columns: [{
        name: 'Name',
        key: 'title'
      }],
      folders: filteredFolders,
      files: filteredFiles,
      activeRow: props.isActiveRow,
      sortByTitle: props.sortByTitle,
      sortByDate: props.sortByDate,
      handleFileClick: props.addFile,
      handleFolderClick: props.getNextFolder,
      isChecked: props.isChecked,
      toggleCheckbox: props.toggleCheckbox,
      getItemName: props.getItemName,
      getItemIcon: props.getItemIcon,
      handleScroll: props.handleScroll,
      title: props.title,
      showTitles: props.showTitles,
      getItemId: props.getItemId,
      i18n: props.i18n
    }),
    h(
      'button',
      { 'class': 'UppyButton--circular UppyButton--blue uppy-ProviderBrowser-doneBtn',
        type: 'button',
        'aria-label': 'Done picking files',
        title: 'Done picking files',
        onclick: props.done },
      h(
        'svg',
        { 'aria-hidden': 'true', 'class': 'UppyIcon', width: '13px', height: '9px', viewBox: '0 0 13 9' },
        h('polygon', { points: '5 7.293 1.354 3.647 0.646 4.354 5 8.707 12.354 1.354 11.646 0.647' })
      )
    )
  );
};

// <div class="uppy-Dashboard-actions">
//  <button class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Dashboard-actionsBtn" type="button">Select</button>
// </div>
//# sourceMappingURL=Browser.js.map