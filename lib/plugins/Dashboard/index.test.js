var Core = require('../../core');
var DashboardPlugin = require('./index');
var StatusBarPlugin = require('../StatusBar');

describe('Dashboard', function () {
  it('can safely be added together with the StatusBar without id conflicts', function () {
    var core = new Core();
    core.use(StatusBarPlugin);

    expect(function () {
      core.use(DashboardPlugin, { inline: false });
    }).not.toThrow();
  });
});
//# sourceMappingURL=index.test.js.map