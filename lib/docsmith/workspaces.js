'use strict';

var async = require('async');
var realPath = require('fs').realpathSync;
var path = require('path');
var metalsmith = require('./utils/metalsmith');

var deploy = function deploy(workspaces, repository, done) {
  // console.log('workspaces', workspaces);
  // console.log('repository', repository);
  // console.log('pwd', process.cwd());
  async.reduce(workspaces, [], function (memo, _ref, callback) {
    var name = _ref.name,
        workspace = _ref.workspace;

    // This should execute the init script of the workspace
    // via metalsmith programmatically with the .content folder as source and
    // the destination in pwd.
    var base = realPath(path.join(repository, 'node_modules', name));
    // console.log('base', base);
    async.eachOfSeries(workspace, function (_ref2, name, cb) {
      var init = _ref2.init;

      // Skip if there isn't an init script in the workspace configuration.
      // console.log('init', init);
      // console.log('name', name);
      if (!init) return cb();
      console.log('>> Deploying workspace: ', name);
      metalsmith(path.join(base, init), { destination: path.join(process.cwd(), name) }, function (err) {
        if (err) {
          console.log('Error deploying', name);
          return cb(err);
        }
        console.log('>> Finished deploying: ', name);

        cb();
      });
    }, callback);
  }, function (err, results) {
    if (err) return done(err);
    done(null, results);
  });
};

module.exports.deploy = deploy;
//# sourceMappingURL=workspaces.js.map