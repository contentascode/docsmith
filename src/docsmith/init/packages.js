const debug = require('debug')('docsmith:init');
const fs = require('fs-extra');
const npm = require('npm');
const async = require('async');
const yaml = require('js-yaml').safeLoad;
const toYaml = require('js-yaml').safeDump;
const read = require('fs').readFileSync;
const path = require('path');

// If link is true then do not install the npm package and link a local version instead
const install = function install({ repos, repository, link }, done) {
  if (!repos || repos.length == 0) return done();
  async.reduce(
    Object.keys(repos).map(name => ({ name, repo: repos[name] })),
    [],
    (pkgs, { name, repo }, callback) => {
      if (link) {
        debug('>> Linking content package: ' + name);
      } else {
        console.log('Installing', repo);
        debug('>> Installing content package: ' + repo);
      }

      // link uses npm.globalDir to check for locally linked packages and npm.dir for the installation destination.
      // npm.globalDir is a read only property based on globalPrefix
      // npm.dir is a read only property based on npm.prefix
      // npm.prefix
      // link therefore needs both to be set but setting prefix manually overrides both...

      npm.load({ save: false, progress: false, loglevel: process.env.DEBUG ? 'info' : 'silent' }, function(err) {
        if (err) return err;
        npm.commands[link ? 'link' : 'install']([link ? name : repo], function(err) {
          if (err && err.code === 'E404') {
            console.error('Could not find content package: ' + err.pkgid);
            return callback(err);
          }
          if (err) {
            console.error(err);
            return callback(err);
          }

          const exists = fs.pathExistsSync(path.join(repository, 'node_modules', name, './content.yml'));
          // Skip if there is no content.yml in the installed package
          if (!exists) return callback();

          // Otherwise gather the content of the content.yml.
          const content = yaml(read(path.join(repository, 'node_modules', name, './content.yml'), 'utf8'));

          // copy the content.yml to the root of the content repo.
          const exists_root_content = fs.pathExistsSync(path.join(repository, 'content.yml'));

          let new_root_content;

          if (exists_root_content) {
            const root_content = yaml(read(path.join(repository, 'content.yml'), 'utf8'));
            new_root_content = Object(root_content, content);
            // TODO: merge in a smart way
          } else {
            new_root_content = content;
          }

          fs.outputFileSync(path.join(repository, 'content.yml'), toYaml(new_root_content), 'utf8');

          // recursively install content packages.
          install({ repos: content.packages, repository, link }, err => {
            if (err) return callback(err);
            return callback(null, pkgs.concat({ name, content }));
          });
        });
      });
    },
    (err, results) => {
      if (err) return done(err);
      done(null, results);
    }
  );
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
