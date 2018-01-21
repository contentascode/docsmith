const debug = require('debug')('docsmith:legacy_packages');
const fs = require('fs-extra');
const npm = require('npm');
const async = require('async');
const yaml = require('js-yaml').safeLoad;
const toYaml = require('js-yaml').safeDump;
const read = require('fs').readFileSync;
const path = require('path');

// If link is true then do not install the npm package and link a local version instead
const install = function install({ packages, repository, link, verbose }, done) {
  debug('packages', packages);
  debug('repository', repository);
  if (!packages || packages.length == 0) return done();
  async.reduce(
    Object.keys(packages).map(name => ({ name, pkg: packages[name].package })),
    [],
    (pkgs, { name, pkg }, callback) => {
      fs.existsSync(name) || fs.ensureDirSync(name);
      try {
        process.chdir(name);
        debug('changed directory: ', name);
        debug('process.cwd()', process.cwd());
      } catch (err) {
        done('\nError while changing directory: ' + name);
      }

      // Create or overwrite package.json to enable desired folder structure
      fs.writeFileSync(path.join(process.cwd(), 'package.json'), JSON.stringify({ private: true }), 'utf-8');
      debug('> Content repository configuration: ', name + '/package.json');

      if (link) {
        debug('>> Linking content package: ' + name);
      } else {
        debug('>> Installing content package: ' + pkg, process.cwd());
      }

      // link uses npm.globalDir to check for locally linked packages and npm.dir for the installation destination.
      // npm.globalDir is a read only property based on globalPrefix
      // npm.dir is a read only property based on npm.prefix
      // npm.prefix
      // link therefore needs both to be set but setting prefix manually overrides both...

      npm.load({ global: false, save: false, progress: false, loglevel: verbose ? 'info' : 'silent' }, function(err) {
        if (err) return err;
        debug('>> Before npm install ' + [link ? name : pkg], process.cwd());
        npm.commands[link ? 'link' : 'install']('.', [link ? '' : pkg], function(err) {
          if (err && err.code === 'E404') {
            console.error('Could not find content package: ' + err.pkgid);
            return callback(err);
          }
          if (err) {
            console.error(err);
            return callback(err);
          }

          // Copy module files to the content package root.
          fs.copySync(
            path.join(repository, 'packages', name, 'node_modules', name),
            path.join(repository, 'packages', name),
            { overwrite: true, errorOnExist: false, dereference: true }
          );

          debug('package.json', path.join(process.cwd(), 'package.json'));
          const { name: pkgName, version } = require(path.join(process.cwd(), 'package.json'));
          console.log('Installed ' + pkgName, version);

          const exists = fs.pathExistsSync(path.join(repository, 'packages', name, './content.yml'));
          debug(
            '>> Checking content.yml in package at ' + path.join(repository, 'packages', name, './content.yml') + ':',
            exists
          );
          // Skip if there is no content.yml in the installed package
          if (!exists) return callback();

          // Otherwise gather the content of the content.yml.
          const content = yaml(read(path.join(repository, 'packages', name, './content.yml'), 'utf8'));

          // copy the content.yml to the root of the content repo.
          const exists_root_content = fs.pathExistsSync(path.join(repository, 'content.yml'));

          let new_root_content;

          if (exists_root_content) {
            const root_content = yaml(read(path.join(repository, 'content.yml'), 'utf8'));
            new_root_content = Object(root_content, content);
            // TODO: merge in a smart way
            // Add instance key with content package folder path. Think about multi-content package instances.
          } else {
            new_root_content = content;
          }

          fs.outputFileSync(path.join(repository, 'content.yml'), toYaml(new_root_content), 'utf8');

          debug('>> Recursively install content packages:', content.packages);
          // recursively install content packages.
          install({ repos: content.packages, repository, link }, err => {
            if (err) return callback(err);
            debug('>> Current pkgs:', pkgs);
            debug('>> Returning pkg concatenated with:', { name, content });
            // This should accumulate content packages dependencies in a flat structure.
            return callback(null, pkgs.concat({ name, content }));
          });
        });
      });
    },
    (err, results) => {
      debug('results', results);
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
