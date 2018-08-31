var FileList = require('./FileList');
var Tabs = require('./Tabs');
var FileCard = require('./FileCard');
var classNames = require('classnames');
var isTouchDevice = require('@uppy/utils/lib/isTouchDevice');

var _require = require('preact'),
    h = _require.h;

// http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog
// https://github.com/ghosh/micromodal

var PanelContent = function PanelContent(props) {
  return h(
    'div',
    { style: { width: '100%', height: '100%' } },
    h(
      'div',
      { 'class': 'uppy-DashboardContent-bar' },
      h(
        'div',
        { 'class': 'uppy-DashboardContent-title', role: 'heading', 'aria-level': 'h1' },
        props.i18n('importFrom', { name: props.activePanel.name })
      ),
      h(
        'button',
        { 'class': 'uppy-DashboardContent-back',
          type: 'button',
          onclick: props.hideAllPanels },
        props.i18n('done')
      )
    ),
    props.getPlugin(props.activePanel.id).render(props.state)
  );
};

module.exports = function Dashboard(props) {
  var dashboardClassName = classNames({ 'uppy-Root': props.isTargetDOMEl }, 'uppy-Dashboard', { 'Uppy--isTouchDevice': isTouchDevice() }, { 'uppy-Dashboard--animateOpenClose': props.animateOpenClose }, { 'uppy-Dashboard--isClosing': props.isClosing }, { 'uppy-Dashboard--modal': !props.inline }, { 'uppy-Dashboard--wide': props.isWide });

  return h(
    'div',
    { 'class': dashboardClassName,
      'aria-hidden': props.inline ? 'false' : props.modal.isHidden,
      'aria-label': !props.inline ? props.i18n('dashboardWindowTitle') : props.i18n('dashboardTitle'),
      onpaste: props.handlePaste },
    h('div', { 'class': 'uppy-Dashboard-overlay', tabindex: -1, onclick: props.handleClickOutside }),
    h(
      'div',
      { 'class': 'uppy-Dashboard-inner',
        'aria-modal': !props.inline && 'true',
        role: !props.inline && 'dialog',
        style: {
          width: props.inline && props.width ? props.width : '',
          height: props.inline && props.height ? props.height : ''
        } },
      h(
        'button',
        { 'class': 'uppy-Dashboard-close',
          type: 'button',
          'aria-label': props.i18n('closeModal'),
          title: props.i18n('closeModal'),
          onclick: props.closeModal },
        h(
          'span',
          { 'aria-hidden': 'true' },
          '\xD7'
        )
      ),
      h(
        'div',
        { 'class': 'uppy-Dashboard-innerWrap' },
        h(Tabs, props),
        h(FileCard, props),
        h(
          'div',
          { 'class': 'uppy-Dashboard-filesContainer' },
          h(FileList, props)
        ),
        h(
          'div',
          { 'class': 'uppy-DashboardContent-panel',
            role: 'tabpanel',
            id: props.activePanel && 'uppy-DashboardContent-panel--' + props.activePanel.id,
            'aria-hidden': props.activePanel ? 'false' : 'true' },
          props.activePanel && h(PanelContent, props)
        ),
        h(
          'div',
          { 'class': 'uppy-Dashboard-progressindicators' },
          props.progressindicators.map(function (target) {
            return props.getPlugin(target.id).render(props.state);
          })
        )
      )
    )
  );
};