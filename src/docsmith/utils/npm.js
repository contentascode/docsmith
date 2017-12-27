const debug = require('debug')('docsmith:npm');

const npm = require('npm');
const Validation = require('folktale/validation');
const { Success, Failure } = Validation;
const { waitAll, fromPromised } = require('folktale/concurrency/task');

const fs = require('fs-extra');
const path = require('path');

global.Promise = require('bluebird');

global.Promise.promisifyAll(fs);

const listGlobal = pkg =>
  new Promise((resolve, reject) =>
    npm.load(
      {
        // This seems to keep all npm instances stuck on global, but gladly we don't need it.
        /*global: true*/
      },
      err => {
        if (err) reject(err);
        debug('pkg', pkg);
        const prefix = npm.config.globalPrefix;
        debug('prefix', prefix);
        const pkgPath = path.join(prefix, 'lib', 'node_modules', pkg);
        debug('pkgPath', pkgPath);

        let pkgLink;
        try {
          const linkStat = fs.lstatSync(pkgPath);
          pkgLink = linkStat.isSymbolicLink()
            ? fs.realpathSync(path.join(prefix, 'lib', 'node_modules', fs.readlinkSync(pkgPath)))
            : false;
        } catch (e) {
          pkgLink = false;
        }
        debug('pkgLink', pkgLink);

        const info = require(path.join(pkgPath, 'package.json'));
        // debug('info', info);
        resolve({ path: pkgPath, link: pkgLink, ...info });
        // debug('prefix', prefix);
        // Incredibly slow.
        // npm.commands.ls([pkg], (err, res) => {
        //   if (err) reject(err);
        //   resolve(res);
        // });
      }
    )
  );

// Using legacy install for now.
//
// const install = ({ link, pkg, verbose, name }) =>
//   new Promise((resolve, reject) =>
//     npm.load({ save: false, progress: false, loglevel: verbose ? 'info' : 'silent' }, function(err) {
//       if (err) return err;
//       npm.commands[link ? 'link' : 'install']([link ? name : pkg], function(err) {
//         if (err && err.code === 'E404') {
//           console.error('Could not find content package: ' + err.pkgid);
//           return reject(err);
//         }
//         if (err) {
//           console.error(err);
//           return reject(err);
//         }
//
//         // Copy module files to the content package root.
//         fs.copySync(
//           path.join(repository, 'packages', name, 'node_modules', name),
//           path.join(repository, 'packages', name)
//         );
//
//         const exists = fs.pathExistsSync(path.join(repository, 'packages', name, './content.yml'));
//         debug(
//           '>> Checking content.yml in package at ' + path.join(repository, 'packages', name, './content.yml') + ':',
//           exists
//         );
//         // Skip if there is no content.yml in the installed package
//         if (!exists) return resolve();
//
//         // Otherwise gather the content of the content.yml.
//         const content = yaml(read(path.join(repository, 'packages', name, './content.yml'), 'utf8'));
//
//         // copy the content.yml to the root of the content repo.
//         const exists_root_content = fs.pathExistsSync(path.join(repository, 'content.yml'));
//
//         let new_root_content;
//
//         if (exists_root_content) {
//           const root_content = yaml(read(path.join(repository, 'content.yml'), 'utf8'));
//           new_root_content = Object(root_content, content);
//           // TODO: merge in a smart way
//           // Add instance key with content package folder path. Think about multi-content package instances.
//         } else {
//           new_root_content = content;
//         }
//
//         fs.outputFileSync(path.join(repository, 'content.yml'), toYaml(new_root_content), 'utf8');
//
//         debug('>> Recursively install content packages:', content.packages);
//         // recursively install content packages.
//         install({ repos: content.packages, repository, link }, err => {
//           if (err) return reject(err);
//           debug('>> Current pkgs:', pkgs);
//           debug('>> Returning pkg concatenated with:', { name, content });
//           // This should accumulate content packages dependencies in a flat structure.
//           resolve(pkgs.concat({ name, content }));
//         });
//       });
//     })
//   );
//
// // [ Package ] -> Task [ Validation Error [ Packages ] ]
// const taskInstall = fromPromised(({ pkg, verbose }) =>
//   install({ link: false, pkg, verbose, name: '' })
//     .then(res => Success(res))
//     .catch(e => Failure(e))
// );

const view = packages =>
  new Promise((resolve, reject) =>
    npm.load({}, err => {
      if (err) reject(err);
      debug('npm.view.packages', packages);
      npm.commands.view(packages, true, (err, res) => {
        if (err) return reject(err);
        debug('version', res.version);
        resolve(res);
      });
    })
  );

// [ Package ] -> Task [ Validation Error Info ]
const taskView = fromPromised(pkg =>
  view(pkg)
    .then(res => Success(res))
    .catch(e => Failure(e))
);

//  Package  -> Task Validation Error Info
const taskListGlobal = fromPromised(pkg =>
  listGlobal(pkg)
    .then(res => Success(res))
    .catch(e => Failure(e))
);

const doListGlobal = async pkg => {
  const res = await taskListGlobal(pkg)
    .run()
    .promise();

  return res.matchWith({
    Success: ({ value }) => ({ ...value }),
    Failure: ({ value }) => {
      console.log(`Please check that git is installed properly. Error: ${value}`);
      process.exit();
    }
  });
};

export { taskView, /* taskInstall, */ doListGlobal };
