const debug = require('debug')('docsmith:init');
const async = require('async');
const realPath = require('fs').realpathSync;
const path = require('path');
const metalsmith = require('../utils/metalsmith');

const deploy = function deploy(workspaces, repository, done) {
  debug('workspaces', workspaces);
  debug('repository', repository);
  debug('pwd', process.cwd());
  async.reduce(
    workspaces,
    [],
    (memo, { name, workspace }, callback) => {
      // This should execute the init script of the workspace
      // via metalsmith programmatically with the .content folder as source and
      // the destination in pwd.
      const base = realPath(path.join(repository, 'packages', name));
      // console.log('base', base);
      async.eachOfSeries(
        workspace,
        ({ init }, name, cb) => {
          // Skip if there isn't an init script in the workspace configuration.
          // console.log('init', init);
          // console.log('name', name);
          if (!init) return cb();
          console.log('>> Deploying workspace: ', name);
          metalsmith(path.join(base, init), { destination: path.join(process.cwd(), name) }, err => {
            if (err) {
              console.log('Error deploying', name);
              return cb(err);
            }
            debug('>> Finished deploying: ', name);

            return cb();
          });
        },
        (err, res) => {
          // console.trace();
          return callback(err, res);
        }
      );
    },
    (err, results) => {
      if (err) return done(err);
      return done(null, results);
    }
  );
};

module.exports.deploy = deploy;
