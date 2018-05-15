var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

var fs = require('fs');
var path = require('path');
var Core = require('./Core');
var utils = require('./Utils');
var Plugin = require('./Plugin');
var AcquirerPlugin1 = require('../../test/mocks/acquirerPlugin1');
var AcquirerPlugin2 = require('../../test/mocks/acquirerPlugin2');
var InvalidPlugin = require('../../test/mocks/invalidPlugin');
var InvalidPluginWithoutId = require('../../test/mocks/invalidPluginWithoutId');
var InvalidPluginWithoutType = require('../../test/mocks/invalidPluginWithoutType');

jest.mock('cuid', function () {
  return function () {
    return 'cjd09qwxb000dlql4tp4doz8h';
  };
});

var sampleImage = fs.readFileSync(path.join(__dirname, '../../test/resources/image.jpg'));

describe('src/Core', function () {
  var RealCreateObjectUrl = global.URL.createObjectURL;
  beforeEach(function () {
    jest.spyOn(utils, 'findDOMElement').mockImplementation(function (path) {
      return 'some config...';
    });
    jest.spyOn(utils, 'createThumbnail').mockImplementation(function (path) {
      return _Promise.resolve('data:image/jpeg;base64,' + sampleImage.toString('base64'));
    });
    utils.createThumbnail.mockClear();

    global.URL.createObjectURL = jest.fn().mockReturnValue('newUrl');
  });

  afterEach(function () {
    global.URL.createObjectURL = RealCreateObjectUrl;
  });

  it('should expose a class', function () {
    var core = Core();
    expect(core.constructor.name).toEqual('Uppy');
  });

  it('should have a string `id` option that defaults to "uppy"', function () {
    var core = Core();
    expect(core.getID()).toEqual('uppy');

    var core2 = Core({ id: 'profile' });
    expect(core2.getID()).toEqual('profile');
  });

  describe('plugins', function () {
    it('should add a plugin to the plugin stack', function () {
      var core = Core();
      core.use(AcquirerPlugin1);
      expect(Object.keys(core.plugins.acquirer).length).toEqual(1);
    });

    it('should prevent the same plugin from being added more than once', function () {
      var core = Core();
      core.use(AcquirerPlugin1);

      expect(function () {
        core.use(AcquirerPlugin1);
      }).toThrowErrorMatchingSnapshot();
    });

    it('should not be able to add an invalid plugin', function () {
      var core = Core();

      expect(function () {
        core.use(InvalidPlugin);
      }).toThrowErrorMatchingSnapshot();
    });

    it('should not be able to add a plugin that has no id', function () {
      var core = Core();

      expect(function () {
        return core.use(InvalidPluginWithoutId);
      }).toThrowErrorMatchingSnapshot();
    });

    it('should not be able to add a plugin that has no type', function () {
      var core = Core();

      expect(function () {
        return core.use(InvalidPluginWithoutType);
      }).toThrowErrorMatchingSnapshot();
    });

    it('should return the plugin that matches the specified name', function () {
      var core = new Core();
      expect(core.getPlugin('foo')).toEqual(null);

      core.use(AcquirerPlugin1);
      var plugin = core.getPlugin('TestSelector1');
      expect(plugin.id).toEqual('TestSelector1');
      expect(plugin instanceof Plugin);
    });

    it('should call the specified method on all the plugins', function () {
      var core = new Core();
      core.use(AcquirerPlugin1);
      core.use(AcquirerPlugin2);
      core.iteratePlugins(function (plugin) {
        plugin.run('hello');
      });
      expect(core.plugins.acquirer[0].mocks.run.mock.calls.length).toEqual(1);
      expect(core.plugins.acquirer[0].mocks.run.mock.calls[0]).toEqual(['hello']);
      expect(core.plugins.acquirer[1].mocks.run.mock.calls.length).toEqual(1);
      expect(core.plugins.acquirer[1].mocks.run.mock.calls[0]).toEqual(['hello']);
    });

    it('should uninstall and the remove the specified plugin', function () {
      var core = new Core();
      core.use(AcquirerPlugin1);
      core.use(AcquirerPlugin2);
      expect(Object.keys(core.plugins.acquirer).length).toEqual(2);

      var plugin = core.getPlugin('TestSelector1');
      core.removePlugin(plugin);
      expect(Object.keys(core.plugins.acquirer).length).toEqual(1);
      expect(plugin.mocks.uninstall.mock.calls.length).toEqual(1);
      expect(core.plugins.acquirer[0].mocks.run.mock.calls.length).toEqual(0);
    });
  });

  describe('state', function () {
    it('should update all the plugins with the new state when the updateAll method is called', function () {
      var core = new Core();
      core.use(AcquirerPlugin1);
      core.use(AcquirerPlugin2);
      core.updateAll({ foo: 'bar' });
      expect(core.plugins.acquirer[0].mocks.update.mock.calls.length).toEqual(1);
      expect(core.plugins.acquirer[0].mocks.update.mock.calls[0]).toEqual([{ foo: 'bar' }]);
      expect(core.plugins.acquirer[1].mocks.update.mock.calls.length).toEqual(1);
      expect(core.plugins.acquirer[1].mocks.update.mock.calls[0]).toEqual([{ foo: 'bar' }]);
    });

    it('should update the state', function () {
      var core = new Core();
      var stateUpdateEventMock = jest.fn();
      core.on('state-update', stateUpdateEventMock);
      core.use(AcquirerPlugin1);
      core.use(AcquirerPlugin2);

      core.setState({ foo: 'bar', bee: 'boo' });
      core.setState({ foo: 'baar' });

      var newState = {
        bee: 'boo',
        capabilities: { resumableUploads: false },
        files: {},
        currentUploads: {},
        foo: 'baar',
        info: { isHidden: true, message: '', type: 'info' },
        meta: {},
        plugins: {},
        totalProgress: 0
      };

      expect(core.state).toEqual(newState);

      expect(core.plugins.acquirer[0].mocks.update.mock.calls[1]).toEqual([newState]);
      expect(core.plugins.acquirer[1].mocks.update.mock.calls[1]).toEqual([newState]);

      expect(stateUpdateEventMock.mock.calls.length).toEqual(2);
      // current state
      expect(stateUpdateEventMock.mock.calls[1][0]).toEqual({
        bee: 'boo',
        capabilities: { resumableUploads: false },
        files: {},
        currentUploads: {},
        foo: 'bar',
        info: { isHidden: true, message: '', type: 'info' },
        meta: {},
        plugins: {},
        totalProgress: 0
      });
      // new state
      expect(stateUpdateEventMock.mock.calls[1][1]).toEqual({
        bee: 'boo',
        capabilities: { resumableUploads: false },
        files: {},
        currentUploads: {},
        foo: 'baar',
        info: { isHidden: true, message: '', type: 'info' },
        meta: {},
        plugins: {},
        totalProgress: 0
      });
    });

    it('should get the state', function () {
      var core = new Core();

      core.setState({ foo: 'bar' });

      expect(core.getState()).toEqual({
        capabilities: { resumableUploads: false },
        files: {},
        currentUploads: {},
        foo: 'bar',
        info: { isHidden: true, message: '', type: 'info' },
        meta: {},
        plugins: {},
        totalProgress: 0
      });
    });
  });

  it('should reset when the reset method is called', function () {
    var core = new Core();
    // const corePauseEventMock = jest.fn()
    var coreCancelEventMock = jest.fn();
    var coreStateUpdateEventMock = jest.fn();
    core.on('cancel-all', coreCancelEventMock);
    core.on('state-update', coreStateUpdateEventMock);
    core.setState({ foo: 'bar', totalProgress: 30 });

    core.reset();

    // expect(corePauseEventMock.mock.calls.length).toEqual(1)
    expect(coreCancelEventMock.mock.calls.length).toEqual(1);
    expect(coreStateUpdateEventMock.mock.calls.length).toEqual(2);
    expect(coreStateUpdateEventMock.mock.calls[1][1]).toEqual({
      capabilities: { resumableUploads: false },
      files: {},
      currentUploads: {},
      foo: 'bar',
      info: { isHidden: true, message: '', type: 'info' },
      meta: {},
      plugins: {},
      totalProgress: 0
    });
  });

  it('should clear all uploads on cancelAll()', function () {
    var core = new Core();
    var id = core._createUpload(['a', 'b']);

    expect(core.state.currentUploads[id]).toBeDefined();

    core.cancelAll();

    expect(core.state.currentUploads[id]).toBeUndefined();
  });

  it('should close, reset and uninstall when the close method is called', function () {
    var core = new Core();
    core.use(AcquirerPlugin1);

    // const corePauseEventMock = jest.fn()
    var coreCancelEventMock = jest.fn();
    var coreStateUpdateEventMock = jest.fn();
    // core.on('pause-all', corePauseEventMock)
    core.on('cancel-all', coreCancelEventMock);
    core.on('state-update', coreStateUpdateEventMock);

    core.close();

    // expect(corePauseEventMock.mock.calls.length).toEqual(1)
    expect(coreCancelEventMock.mock.calls.length).toEqual(1);
    expect(coreStateUpdateEventMock.mock.calls.length).toEqual(1);
    expect(coreStateUpdateEventMock.mock.calls[0][1]).toEqual({
      capabilities: { resumableUploads: false },
      files: {},
      currentUploads: {},
      info: { isHidden: true, message: '', type: 'info' },
      meta: {},
      plugins: {},
      totalProgress: 0
    });
    expect(core.plugins.acquirer[0].mocks.uninstall.mock.calls.length).toEqual(1);
  });

  describe('upload hooks', function () {
    it('should add data returned from upload hooks to the .upload() result', function () {
      var core = new Core();
      core.addPreProcessor(function (fileIDs, uploadID) {
        core.addResultData(uploadID, { pre: 'ok' });
      });
      core.addPostProcessor(function (fileIDs, uploadID) {
        core.addResultData(uploadID, { post: 'ok' });
      });
      core.addUploader(function (fileIDs, uploadID) {
        core.addResultData(uploadID, { upload: 'ok' });
      });
      return core.upload().then(function (result) {
        expect(result.pre).toBe('ok');
        expect(result.upload).toBe('ok');
        expect(result.post).toBe('ok');
      });
    });
  });

  describe('preprocessors', function () {
    it('should add a preprocessor', function () {
      var core = new Core();
      var preprocessor = function preprocessor() {};
      core.addPreProcessor(preprocessor);
      expect(core.preProcessors[0]).toEqual(preprocessor);
    });

    it('should remove a preprocessor', function () {
      var core = new Core();
      var preprocessor1 = function preprocessor1() {};
      var preprocessor2 = function preprocessor2() {};
      var preprocessor3 = function preprocessor3() {};
      core.addPreProcessor(preprocessor1);
      core.addPreProcessor(preprocessor2);
      core.addPreProcessor(preprocessor3);
      expect(core.preProcessors.length).toEqual(3);
      core.removePreProcessor(preprocessor2);
      expect(core.preProcessors.length).toEqual(2);
    });

    it('should execute all the preprocessors when uploading a file', function () {
      var core = new Core();
      var preprocessor1 = jest.fn();
      var preprocessor2 = jest.fn();
      core.addPreProcessor(preprocessor1);
      core.addPreProcessor(preprocessor2);

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      return core.upload().then(function () {
        var fileId = Object.keys(core.state.files)[0];
        expect(preprocessor1.mock.calls.length).toEqual(1);

        expect(preprocessor1.mock.calls[0][0].length).toEqual(1);
        expect(preprocessor1.mock.calls[0][0][0]).toEqual(fileId);

        expect(preprocessor2.mock.calls[0][0].length).toEqual(1);
        expect(preprocessor2.mock.calls[0][0][0]).toEqual(fileId);
      });
    });

    it('should update the file progress state when preprocess-progress event is fired', function () {
      var core = new Core();
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      var fileId = Object.keys(core.state.files)[0];
      var file = core.getFile(fileId);
      core.emit('preprocess-progress', file, {
        mode: 'determinate',
        message: 'something',
        value: 0
      });
      expect(core.state.files[fileId].progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false,
        preprocess: { mode: 'determinate', message: 'something', value: 0 }
      });
    });

    it('should update the file progress state when preprocess-complete event is fired', function () {
      var core = new Core();

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      var fileID = Object.keys(core.state.files)[0];
      var file = core.state.files[fileID];
      core.emit('preprocess-complete', file, {
        mode: 'determinate',
        message: 'something',
        value: 0
      });
      expect(core.state.files[fileID].progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      });
    });
  });

  describe('postprocessors', function () {
    it('should add a postprocessor', function () {
      var core = new Core();
      var postprocessor = function postprocessor() {};
      core.addPostProcessor(postprocessor);
      expect(core.postProcessors[0]).toEqual(postprocessor);
    });

    it('should remove a postprocessor', function () {
      var core = new Core();
      var postprocessor1 = function postprocessor1() {};
      var postprocessor2 = function postprocessor2() {};
      var postprocessor3 = function postprocessor3() {};
      core.addPostProcessor(postprocessor1);
      core.addPostProcessor(postprocessor2);
      core.addPostProcessor(postprocessor3);
      expect(core.postProcessors.length).toEqual(3);
      core.removePostProcessor(postprocessor2);
      expect(core.postProcessors.length).toEqual(2);
    });

    it('should execute all the postprocessors when uploading a file', function () {
      var core = new Core();
      var postprocessor1 = jest.fn();
      var postprocessor2 = jest.fn();
      core.addPostProcessor(postprocessor1);
      core.addPostProcessor(postprocessor2);

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      return core.upload().then(function () {
        expect(postprocessor1.mock.calls.length).toEqual(1);
        // const lastModifiedTime = new Date()
        // const fileId = 'foojpg' + lastModifiedTime.getTime()
        var fileId = 'uppy-foojpg-image';

        expect(postprocessor1.mock.calls[0][0].length).toEqual(1);
        expect(postprocessor1.mock.calls[0][0][0].substring(0, 17)).toEqual(fileId.substring(0, 17));

        expect(postprocessor2.mock.calls[0][0].length).toEqual(1);
        expect(postprocessor2.mock.calls[0][0][0].substring(0, 17)).toEqual(fileId.substring(0, 17));
      });
    });

    it('should update the file progress state when postprocess-progress event is fired', function () {
      var core = new Core();

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      var fileId = Object.keys(core.state.files)[0];
      var file = core.getFile(fileId);
      core.emit('postprocess-progress', file, {
        mode: 'determinate',
        message: 'something',
        value: 0
      });
      expect(core.state.files[fileId].progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false,
        postprocess: { mode: 'determinate', message: 'something', value: 0 }
      });
    });

    it('should update the file progress state when postprocess-complete event is fired', function () {
      var core = new Core();

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      var fileId = Object.keys(core.state.files)[0];
      var file = core.state.files[fileId];
      core.emit('postprocess-complete', file, {
        mode: 'determinate',
        message: 'something',
        value: 0
      });
      expect(core.state.files[fileId].progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      });
    });
  });

  describe('uploaders', function () {
    it('should add an uploader', function () {
      var core = new Core();
      var uploader = function uploader() {};
      core.addUploader(uploader);
      expect(core.uploaders[0]).toEqual(uploader);
    });

    it('should remove an uploader', function () {
      var core = new Core();
      var uploader1 = function uploader1() {};
      var uploader2 = function uploader2() {};
      var uploader3 = function uploader3() {};
      core.addUploader(uploader1);
      core.addUploader(uploader2);
      core.addUploader(uploader3);
      expect(core.uploaders.length).toEqual(3);
      core.removeUploader(uploader2);
      expect(core.uploaders.length).toEqual(2);
    });
  });

  describe('adding a file', function () {
    it('should call onBeforeFileAdded if it was specified in the options when initialising the class', function () {
      var onBeforeFileAdded = jest.fn();
      var core = new Core({
        onBeforeFileAdded: onBeforeFileAdded
      });

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      expect(onBeforeFileAdded.mock.calls.length).toEqual(1);
      expect(onBeforeFileAdded.mock.calls[0][0].name).toEqual('foo.jpg');
      expect(onBeforeFileAdded.mock.calls[0][1]).toEqual({});
    });

    it('should add a file', function () {
      var fileData = new File([sampleImage], { type: 'image/jpeg' });
      var fileAddedEventMock = jest.fn();
      var core = new Core();
      core.on('file-added', fileAddedEventMock);

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: fileData
      });

      var fileId = Object.keys(core.state.files)[0];
      var newFile = {
        extension: 'jpg',
        id: fileId,
        isRemote: false,
        meta: { name: 'foo.jpg', type: 'image/jpeg' },
        name: 'foo.jpg',
        preview: undefined,
        data: fileData,
        progress: {
          bytesTotal: 17175,
          bytesUploaded: 0,
          percentage: 0,
          uploadComplete: false,
          uploadStarted: false
        },
        remote: '',
        size: 17175,
        source: 'jest',
        type: 'image/jpeg'
      };
      expect(core.state.files[fileId]).toEqual(newFile);
      expect(fileAddedEventMock.mock.calls[0][0]).toEqual(newFile);
    });

    it('should not allow a file that does not meet the restrictions', function () {
      var core = new Core({
        restrictions: {
          allowedFileTypes: ['image/gif']
        }
      });
      try {
        core.addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' })
        });
        throw new Error('File was allowed through');
      } catch (err) {
        expect(err.message).toEqual('You can only upload: image/gif');
      }
    });

    it('should not allow a file if onBeforeFileAdded returned false', function () {
      var core = new Core({
        onBeforeFileAdded: function onBeforeFileAdded(file, files) {
          if (file.source === 'jest') {
            return false;
          }
        }
      });
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });
      expect(Object.keys(core.state.files).length).toEqual(0);
    });
  });

  describe('uploading a file', function () {
    it('should return a { successful, failed } pair containing file objects', function () {
      var core = new Core();
      core.addUploader(function (fileIDs) {
        return _Promise.resolve();
      });

      core.addFile({ source: 'jest', name: 'foo.jpg', type: 'image/jpeg', data: new Uint8Array() });
      core.addFile({ source: 'jest', name: 'bar.jpg', type: 'image/jpeg', data: new Uint8Array() });

      return expect(core.upload()).resolves.toMatchObject({
        successful: [{ name: 'foo.jpg' }, { name: 'bar.jpg' }],
        failed: []
      });
    });

    it('should return files with errors in the { failed } key', function () {
      var core = new Core();
      core.addUploader(function (fileIDs) {
        fileIDs.forEach(function (fileID) {
          var file = core.getFile(fileID);
          if (/bar/.test(file.name)) {
            core.emit('upload-error', file, new Error('This is bar and I do not like bar'));
          }
        });
        return _Promise.resolve();
      });

      core.addFile({ source: 'jest', name: 'foo.jpg', type: 'image/jpeg', data: new Uint8Array() });
      core.addFile({ source: 'jest', name: 'bar.jpg', type: 'image/jpeg', data: new Uint8Array() });

      return expect(core.upload()).resolves.toMatchObject({
        successful: [{ name: 'foo.jpg' }],
        failed: [{ name: 'bar.jpg', error: 'This is bar and I do not like bar' }]
      });
    });

    it('should only upload files that are not already assigned to another upload id', function () {
      var core = new Core();
      core.store.state.currentUploads = {
        upload1: {
          fileIDs: ['uppy-file1jpg-image/jpeg', 'uppy-file2jpg-image/jpeg', 'uppy-file3jpg-image/jpeg']
        },
        upload2: {
          fileIDs: ['uppy-file4jpg-image/jpeg', 'uppy-file5jpg-image/jpeg', 'uppy-file6jpg-image/jpeg']
        }
      };
      core.addUploader(function (fileIDs) {
        return _Promise.resolve();
      });

      core.addFile({ source: 'jest', name: 'foo.jpg', type: 'image/jpeg', data: new Uint8Array() });
      core.addFile({ source: 'jest', name: 'bar.jpg', type: 'image/jpeg', data: new Uint8Array() });
      core.addFile({ source: 'file3', name: 'file3.jpg', type: 'image/jpeg', data: new Uint8Array() });

      return expect(core.upload()).resolves.toMatchSnapshot();
    });

    it('should not upload if onBeforeUpload returned false', function () {
      var core = new Core({
        autoProceed: false,
        onBeforeUpload: function onBeforeUpload(files) {
          for (var fileId in files) {
            if (files[fileId].name === '123.foo') {
              return false;
            }
          }
        }
      });
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });
      core.addFile({
        source: 'jest',
        name: 'bar.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });
      core.addFile({
        source: 'jest',
        name: '123.foo',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });
      return core.upload().catch(function (err) {
        expect(err).toMatchObject(new Error('Not starting the upload because onBeforeUpload returned false'));
      });
    });
  });

  describe('removing a file', function () {
    it('should remove the file', function () {
      var fileRemovedEventMock = jest.fn();

      var core = new Core();
      core.on('file-removed', fileRemovedEventMock);

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      var fileId = Object.keys(core.state.files)[0];
      expect(Object.keys(core.state.files).length).toEqual(1);
      core.setState({
        totalProgress: 50
      });

      var file = core.getFile(fileId);
      core.removeFile(fileId);

      expect(Object.keys(core.state.files).length).toEqual(0);
      expect(fileRemovedEventMock.mock.calls[0][0]).toEqual(file);
      expect(core.state.totalProgress).toEqual(0);
    });
  });

  describe('restoring a file', function () {
    xit('should restore a file', function () {});

    xit("should fail to restore a file if it doesn't exist", function () {});
  });

  describe('get a file', function () {
    it('should get the specified file', function () {
      var core = new Core();

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      var fileId = Object.keys(core.state.files)[0];
      expect(core.getFile(fileId).name).toEqual('foo.jpg');

      expect(core.getFile('non existant file')).toEqual(undefined);
    });
  });

  describe('getFiles', function () {
    it('should return an empty array if there are no files', function () {
      var core = new Core();

      expect(core.getFiles()).toEqual([]);
    });

    it('should return all files as an array', function () {
      var core = new Core();

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });
      core.addFile({
        source: 'jest',
        name: 'empty.dat',
        type: 'application/octet-stream',
        data: new File([Buffer.alloc(1000)], { type: 'application/octet-stream' })
      });

      expect(core.getFiles()).toHaveLength(2);
      expect(core.getFiles().map(function (file) {
        return file.name;
      }).sort()).toEqual(['empty.dat', 'foo.jpg']);
    });
  });

  describe('meta data', function () {
    it('should set meta data by calling setMeta', function () {
      var core = new Core({
        meta: { foo2: 'bar2' }
      });
      core.setMeta({ foo: 'bar', bur: 'mur' });
      core.setMeta({ boo: 'moo', bur: 'fur' });
      expect(core.state.meta).toEqual({
        foo: 'bar',
        foo2: 'bar2',
        boo: 'moo',
        bur: 'fur'
      });
    });

    it('should update meta data for a file by calling updateMeta', function () {
      var core = new Core();

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      var fileId = Object.keys(core.state.files)[0];
      core.setFileMeta(fileId, { foo: 'bar', bur: 'mur' });
      core.setFileMeta(fileId, { boo: 'moo', bur: 'fur' });
      expect(core.state.files[fileId].meta).toEqual({
        name: 'foo.jpg',
        type: 'image/jpeg',
        foo: 'bar',
        bur: 'fur',
        boo: 'moo'
      });
    });

    it('should merge meta data when add file', function () {
      var core = new Core({
        meta: { foo2: 'bar2' }
      });
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        meta: {
          resize: 5000
        },
        data: new File([sampleImage], { type: 'image/jpeg' })
      });
      var fileId = Object.keys(core.state.files)[0];
      expect(core.state.files[fileId].meta).toEqual({
        name: 'foo.jpg',
        type: 'image/jpeg',
        foo2: 'bar2',
        resize: 5000
      });
    });
  });

  describe('progress', function () {
    it('should calculate the progress of a file upload', function () {
      var core = new Core();

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      var fileId = Object.keys(core.state.files)[0];
      var file = core.getFile(fileId);
      core._calculateProgress(file, {
        bytesUploaded: 12345,
        bytesTotal: 17175
      });
      expect(core.state.files[fileId].progress).toEqual({
        percentage: 71,
        bytesUploaded: 12345,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      });

      core._calculateProgress(file, {
        bytesUploaded: 17175,
        bytesTotal: 17175
      });
      expect(core.state.files[fileId].progress).toEqual({
        percentage: 100,
        bytesUploaded: 17175,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      });
    });

    it('should calculate the total progress of all file uploads', function () {
      var core = new Core();

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });
      core.addFile({
        source: 'jest',
        name: 'foo2.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      var fileId1 = Object.keys(core.state.files)[0];
      var fileId2 = Object.keys(core.state.files)[1];
      var file1 = core.state.files[fileId1];
      var file2 = core.state.files[fileId2];
      core.state.files[fileId1].progress.uploadStarted = new Date();
      core.state.files[fileId2].progress.uploadStarted = new Date();

      core._calculateProgress(file1, {
        bytesUploaded: 12345,
        bytesTotal: 17175
      });

      core._calculateProgress(file2, {
        bytesUploaded: 10201,
        bytesTotal: 17175
      });

      core._calculateTotalProgress();
      expect(core.state.totalProgress).toEqual(65);
    });

    it('should reset the progress', function () {
      var resetProgressEvent = jest.fn();
      var core = new Core();
      core.on('reset-progress', resetProgressEvent);

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });
      core.addFile({
        source: 'jest',
        name: 'foo2.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      var fileId1 = Object.keys(core.state.files)[0];
      var fileId2 = Object.keys(core.state.files)[1];
      var file1 = core.state.files[fileId1];
      var file2 = core.state.files[fileId2];
      core.state.files[fileId1].progress.uploadStarted = new Date();
      core.state.files[fileId2].progress.uploadStarted = new Date();

      core._calculateProgress(file1, {
        bytesUploaded: 12345,
        bytesTotal: 17175
      });

      core._calculateProgress(file2, {
        bytesUploaded: 10201,
        bytesTotal: 17175
      });

      core._calculateTotalProgress();

      expect(core.state.totalProgress).toEqual(65);

      core.resetProgress();

      expect(core.state.files[fileId1].progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      });
      expect(core.state.files[fileId2].progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      });
      expect(core.state.totalProgress).toEqual(0);
      expect(resetProgressEvent.mock.calls.length).toEqual(1);
    });
  });

  describe('checkRestrictions', function () {
    it('should enforce the maxNumberOfFiles rule', function () {
      var core = new Core({
        autoProceed: false,
        restrictions: {
          maxNumberOfFiles: 1
        }
      });

      // add 2 files
      core.addFile({
        source: 'jest',
        name: 'foo1.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });
      try {
        core.addFile({
          source: 'jest',
          name: 'foo2.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' })
        });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).toMatchObject(new Error('You can only upload 1 file'));
        expect(core.state.info.message).toEqual('You can only upload 1 file');
      }
    });

    xit('should enforce the minNumberOfFiles rule', function () {});

    it('should enforce the allowedFileTypes rule', function () {
      var core = new Core({
        autoProceed: false,
        restrictions: {
          allowedFileTypes: ['image/gif', 'image/png']
        }
      });

      try {
        core.addFile({
          source: 'jest',
          name: 'foo2.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' })
        });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).toMatchObject(new Error('You can only upload: image/gif, image/png'));
        expect(core.state.info.message).toEqual('You can only upload: image/gif, image/png');
      }
    });

    it('should enforce the allowedFileTypes rule with file extensions', function () {
      var core = new Core({
        autoProceed: false,
        restrictions: {
          allowedFileTypes: ['.gif', '.jpg', '.jpeg']
        }
      });

      try {
        core.addFile({
          source: 'jest',
          name: 'foo2.png',
          type: '',
          data: new File([sampleImage], { type: 'image/jpeg' })
        });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).toMatchObject(new Error('You can only upload: .gif, .jpg, .jpeg'));
        expect(core.state.info.message).toEqual('You can only upload: .gif, .jpg, .jpeg');
      }
    });

    it('should enforce the maxFileSize rule', function () {
      var core = new Core({
        autoProceed: false,
        restrictions: {
          maxFileSize: 1234
        }
      });

      try {
        core.addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' })
        });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).toMatchObject(new Error('This file exceeds maximum allowed size of 1.2 KB'));
        expect(core.state.info.message).toEqual('This file exceeds maximum allowed size of 1.2 KB');
      }
    });
  });

  describe('actions', function () {
    it('should update the state when receiving the error event', function () {
      var core = new Core();
      core.emit('error', new Error('foooooo'));
      expect(core.state.error).toEqual('foooooo');
    });

    it('should update the state when receiving the upload-error event', function () {
      var core = new Core();
      core.state.files['fileId'] = {
        name: 'filename'
      };
      core.emit('upload-error', core.state.files['fileId'], new Error('this is the error'));
      expect(core.state.info).toEqual({ 'message': 'Failed to upload filename', 'details': 'this is the error', 'isHidden': false, 'type': 'error' });
    });

    it('should reset the error state when receiving the upload event', function () {
      var core = new Core();
      core.emit('error', { foo: 'bar' });
      core.emit('upload');
      expect(core.state.error).toEqual(null);
    });
  });

  describe('updateOnlineStatus', function () {
    var RealNavigatorOnline = global.window.navigator.onLine;

    function mockNavigatorOnline(status) {
      Object.defineProperty(global.window.navigator, 'onLine', {
        value: status,
        writable: true
      });
    }

    afterEach(function () {
      global.window.navigator.onLine = RealNavigatorOnline;
    });

    it('should emit the correct event based on whether there is a network connection', function () {
      var onlineEventMock = jest.fn();
      var offlineEventMock = jest.fn();
      var backOnlineEventMock = jest.fn();
      var core = new Core();
      core.on('is-offline', offlineEventMock);
      core.on('is-online', onlineEventMock);
      core.on('back-online', backOnlineEventMock);

      mockNavigatorOnline(true);
      core.updateOnlineStatus();
      expect(onlineEventMock.mock.calls.length).toEqual(1);
      expect(offlineEventMock.mock.calls.length).toEqual(0);
      expect(backOnlineEventMock.mock.calls.length).toEqual(0);

      mockNavigatorOnline(false);
      core.updateOnlineStatus();
      expect(onlineEventMock.mock.calls.length).toEqual(1);
      expect(offlineEventMock.mock.calls.length).toEqual(1);
      expect(backOnlineEventMock.mock.calls.length).toEqual(0);

      mockNavigatorOnline(true);
      core.updateOnlineStatus();
      expect(onlineEventMock.mock.calls.length).toEqual(2);
      expect(offlineEventMock.mock.calls.length).toEqual(1);
      expect(backOnlineEventMock.mock.calls.length).toEqual(1);
    });
  });

  describe('info', function () {
    it('should set a string based message to be displayed infinitely', function () {
      var infoVisibleEvent = jest.fn();
      var core = new Core();
      core.on('info-visible', infoVisibleEvent);

      core.info('This is the message', 'info', 0);
      expect(core.state.info).toEqual({
        isHidden: false,
        type: 'info',
        message: 'This is the message',
        details: null
      });
      expect(infoVisibleEvent.mock.calls.length).toEqual(1);
      expect(_typeof(core.infoTimeoutID)).toEqual('undefined');
    });

    it('should set a object based message to be displayed infinitely', function () {
      var infoVisibleEvent = jest.fn();
      var core = new Core();
      core.on('info-visible', infoVisibleEvent);

      core.info({
        message: 'This is the message',
        details: {
          foo: 'bar'
        }
      }, 'warning', 0);
      expect(core.state.info).toEqual({
        isHidden: false,
        type: 'warning',
        message: 'This is the message',
        details: {
          foo: 'bar'
        }
      });
      expect(infoVisibleEvent.mock.calls.length).toEqual(1);
      expect(_typeof(core.infoTimeoutID)).toEqual('undefined');
    });

    it('should set an info message to be displayed for a period of time before hiding', function (done) {
      var infoVisibleEvent = jest.fn();
      var infoHiddenEvent = jest.fn();
      var core = new Core();
      core.on('info-visible', infoVisibleEvent);
      core.on('info-hidden', infoHiddenEvent);

      core.info('This is the message', 'info', 100);
      expect(_typeof(core.infoTimeoutID)).toEqual('number');
      expect(infoHiddenEvent.mock.calls.length).toEqual(0);
      setTimeout(function () {
        expect(infoHiddenEvent.mock.calls.length).toEqual(1);
        expect(core.state.info).toEqual({
          isHidden: true,
          type: 'info',
          message: 'This is the message',
          details: null
        });
        done();
      }, 110);
    });

    it('should hide an info message', function () {
      var infoVisibleEvent = jest.fn();
      var infoHiddenEvent = jest.fn();
      var core = new Core();
      core.on('info-visible', infoVisibleEvent);
      core.on('info-hidden', infoHiddenEvent);

      core.info('This is the message', 'info', 0);
      expect(_typeof(core.infoTimeoutID)).toEqual('undefined');
      expect(infoHiddenEvent.mock.calls.length).toEqual(0);
      core.hideInfo();
      expect(infoHiddenEvent.mock.calls.length).toEqual(1);
      expect(core.state.info).toEqual({
        isHidden: true,
        type: 'info',
        message: 'This is the message',
        details: null
      });
    });
  });

  describe('createUpload', function () {
    it('should assign the specified files to a new upload', function () {
      var core = new Core();
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      });

      core._createUpload(Object.keys(core.state.files));
      var uploadId = Object.keys(core.state.currentUploads)[0];
      var currentUploadsState = {};
      currentUploadsState[uploadId] = {
        fileIDs: Object.keys(core.state.files),
        step: 0,
        result: {}
      };
      expect(core.state.currentUploads).toEqual(currentUploadsState);
    });
  });

  describe('i18n', function () {
    it('merges in custom locale strings', function () {
      var core = new Core({
        locale: {
          strings: {
            test: 'beep boop'
          }
        }
      });

      expect(core.i18n('exceedsSize')).toBe('This file exceeds maximum allowed size of');
      expect(core.i18n('test')).toBe('beep boop');
    });
  });

  describe('default restrictions', function () {
    it('should be merged with supplied restrictions', function () {
      var core = new Core({
        restrictions: {
          maxNumberOfFiles: 3
        }
      });

      expect(core.opts.restrictions.maxNumberOfFiles).toBe(3);
      expect(core.opts.restrictions.minNumberOfFiles).toBe(null);
    });
  });
});
//# sourceMappingURL=Core.test.js.map