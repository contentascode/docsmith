'use strict';

var debug = require('debug')('docsmith:init');
var fs = require('fs-extra');
var npm = require('npm');
var async = require('async');
var yaml = require('js-yaml').safeLoad;
var read = require('fs').readFileSync;
var path = require('path');

// If link is true then do not install the npm package and link a local version instead
var install = function install(_ref, done) {
  var repos = _ref.repos,
      repository = _ref.repository,
      link = _ref.link;

  if (!repos || repos.length == 0) return done();
  async.reduce(Object.keys(repos).map(function (name) {
    return { name, repo: repos[name] };
  }), [], function (pkgs, _ref2, callback) {
    var name = _ref2.name,
        repo = _ref2.repo;

    if (link) {
      debug('>> Linking content package: ' + name);
    } else {
      debug('>> Installing content package: ' + repo);
    }

    // link uses npm.globalDir to check for locally linked packages and npm.dir for the installation destination.
    // npm.globalDir is a read only property based on globalPrefix
    // npm.dir is a read only property based on npm.prefix
    // npm.prefix
    // link therefore needs both to be set but setting prefix manually overrides both...

    npm.load({ save: false, progress: false }, function (err) {
      if (err) return err;
      npm.commands[link ? 'link' : 'install']([link ? name : repo], function (err) {
        if (err && err.code === 'E404') {
          console.error('Could not find content package: ' + err.pkgid);
          return callback(err);
        }
        if (err) {
          console.error(err);
          return callback(err);
        }

        var exists = fs.pathExistsSync(path.join(repository, 'node_modules', name, './content.yml'));
        // Skip if there is no content.yml in the installed package
        if (!exists) return callback();

        // Otherwise gather the content of the content.yml.
        var content = yaml(read(path.join(repository, 'node_modules', name, './content.yml'), 'utf8'));

        // recursively install content packages.
        install({ repos: content.packages, repository, link }, function (err) {
          if (err) return callback(err);
          return callback(null, pkgs.concat({ name, content }));
        });
      });
    });
  }, function (err, results) {
    if (err) return done(err);
    done(null, results);
  });
};

module.exports.install = install;

// var pnpm = require('supi');
// module.exports.install = function(repos, prefix, done) {
//   pnpm
//     .installPkgs(repos, { prefix })
//     .then((...res) =>
//       async.forEach(
//         repos,
//         (repo, cb) => {
//           console.log(repo);
//         },
//         done
//       )
//     )
//     .catch(done);
// };
//# sourceMappingURL=packages.js.map