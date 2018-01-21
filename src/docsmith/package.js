const debug = require('debug')('docsmith:package');
const fs = require('fs-extra');
const path = require('path');

global.Promise = require('bluebird');

global.Promise.promisifyAll(fs);

const { exit } = require('./utils/terminal');
const { doClone, doPull } = require('./utils/git');
const { taskInstall } = require('./utils/npm');
const { doInstancesInfo } = require('./instance');
const legacy_packages = require('./init/packages');

const installPackages = ({ pkgs, repository }) =>
  new global.Promise((resolve, reject) =>
    legacy_packages.install({ packages: pkgs, repository, link: false, verbose: true }, (err, installed) => {
      if (err) return reject();
      resolve(installed);
    })
  );

// Verify is the packages declared in the content.yml file of the instance are installed in ~/.content/packages
const doPackagesCheck = async ({ non_interactive, configuration }) => {
  return Promise.all(
    Object.keys(configuration.repository.instances).map(async instance => {
      console.trace();
      debug('instance', instance);
      return Promise.all(
        Object.keys(configuration.repository.instances[instance].content.packages).map(async pkg => {
          debug(
            'path',
            path.join(configuration.settings.config.split('/content.yml')[0], 'packages', pkg, 'package.json')
          );
          return {
            [pkg]: await fs.pathExistsAsync(
              path.join(configuration.settings.config.split('/content.yml')[0], 'packages', pkg, 'package.json')
            )
          };
        })
      ).then(pkg => ({ [instance]: pkg }));
    })
  );
};

const isLink = async path => {
  try {
    const lstat = fs.lstatSync(path);
    return lstat.isSymbolicLink();
  } catch (e) {
    if (e.code == 'ENOENT') {
      return e;
    }
    process.exit();
  }
};

const isDir = async path => {
  try {
    const stat = fs.statSync(path);
    return stat.isDirectory();
  } catch (e) {
    if (e.code == 'ENOENT') {
      return false;
    }
    process.exit();
  }
};

const isGitDir = async path => {
  try {
    const stat = fs.statSync(path);
    return stat.isDirectory() && fs.existsSync(path.join(path, '.git'));
  } catch (e) {
    if (e.code == 'ENOENT') {
      return false;
    }
    process.exit();
  }
};

const toDir = path => (isLink(path) ? fs.readlinkSync(path) : path);

const doPackagesUpgrade = async ({ non_interactive, configuration, packages }) => {
  // Check if local or use npm to check on remote availability.
  // TODO: Think about linking
  // Check if https or git url.

  configuration.settings = require('./utils/settings').current();
  configuration.settings.package = configuration.settings.pkg;
  debug('configuration.settings', configuration.settings);
  debug('packages', packages);

  const commits = await doPull(packages);
  debug('commits', commits);
  console.log('Cloned packages ', commits);

  // Error: Refusing to delete /Users/jun/.content/packages/activist-apprentice-course-template/node_modules/activist-apprentice-course-template/node_modules/.bin/esparse: containing path /Users/jun/dev/apprentice/workspace/node_modules/activist-apprentice-course-template/node_modules/esprima isn't under npm's control
  // TODO: Maybe delete node_modules and reinstall

  // const instances = await doInstancesInfo({ instances: configuration.repository.instances });
  //
  // const content_packages = instances[configuration.settings.instance].content.packages;
  // debug('content_packages', content_packages);
  //
  // // Install packages
  // const installed = await installPackages({
  //   pkgs: content_packages,
  //   repository: configuration.settings.config.replace('/content.yml', '')
  // });
  // debug('installed', installed);
  //
  // const installed_packages = await doInstancesInfo({ instances: configuration.repository.instances });
  // debug('installed_packages', installed_packages);

  // TODO: Check and Update symlinks.

  return configuration;
};

const doPackagesInit = async ({ non_interactive, configuration, packages, current }) => {
  // Check if local or use npm to check on remote availability.
  // TODO: Think about linking
  // Check if https or git url.

  configuration.settings = require('./utils/settings').current();
  configuration.settings.package = configuration.settings.pkg;
  debug('configuration', configuration);
  debug('packages', packages);

  // Clone
  //
  // const links = Object.keys(packages)
  //   .filter(pkg => isLink(path.join(configuration.settings.packages, pkg)))
  //   .map(pkg => {
  //     debug('Package link already exists', pkg);
  //     return {
  //       pth: path.join(configuration.settings.packages, pkg),
  //       lnk: fs.readlinkSync(path.join(configuration.settings.packages, pkg))
  //     };
  //   });
  //
  // debug('links', links);
  //
  // const folders = Object.keys(packages)
  //   .filter(pkg => isLink(path.join(configuration.settings.packages, pkg)))
  //   .filter(pkg => isDir(path.join(configuration.settings.packages, pkg)))
  //   .map(pkg => {
  //     debug('Package folder already exists', pkg);
  //     return path.join(configuration.settings.packages, pkg);
  //   });
  //
  // debug('folders', folders);
  //
  // if (folders.length !== 0 || links.length !== 0) {
  //   // TODO: More granular checking and propose to update to .git folder, display version...
  //   exit(
  //     'The following packages have already been initialised. Please try to update instead of initialising:\n' +
  //       folders.concat(links.map(({ lnk, pth }) => pth + ' -> ' + lnk)).map(repo => '  - ' + repo + '\n')
  //   );
  // }
  //
  // const reposLinks = links.filter(({ lnk }) => isGitDir(lnk)).map(link => {
  //   debug('Package link is already a git repository', link);
  //   return link;
  // });
  //
  // debug('reposLinks', reposLinks);
  //
  // const reposFolders = folders.filter(pth => isGitDir(pth)).map(pth => {
  //   debug('Package folder is already a git repository', pth);
  //   return pth;
  // });
  //
  // debug('reposFolders', reposFolders);
  //
  // if (reposFolders.length !== 0 || reposLinks.length !== 0) {
  //   // TODO: More granular checking and propose to update to .git folder
  //   exit(
  //     'The following packages have already been initialised and have .git folders. Please try to update instead of initialising:\n' +
  //       reposFolders.concat(reposLinks.map(({ lnk, pth }) => pth + ' -> ' + lnk)).map(repo => '  - ' + repo + '\n')
  //   );
  // }

  const uninstalled = Object.keys(packages)
    .filter(key => packages[key].status === 'uninstalled')
    .map(key => packages[key].package);
  debug('uninstalled', uninstalled);

  const commits = await doClone(uninstalled, configuration.settings.packages);
  debug('commits', commits);
  console.log('Cloned packages ', commits);

  const instances = await doInstancesInfo({ instances: configuration.repository.instances });

  const content_packages = instances[configuration.settings.instance].content.packages;
  debug('content_packages', content_packages);

  // Install packages
  const installed = await installPackages({
    pkgs: content_packages,
    repository: configuration.settings.config.replace('/content.yml', '')
  });
  debug('installed', installed);

  const installed_packages = await doInstancesInfo({ instances: configuration.repository.instances });
  debug('installed_packages', installed_packages);

  // Deploy symlinks.
  // TODO: async/await
  // TODO: Move to workspace
  Object.keys(installed_packages[configuration.settings.instance].content.packages).forEach(key => {
    debug(
      'installed_packages[configuration.settings.instance].content.packages[key]',
      installed_packages[configuration.settings.instance].content.packages[key]
    );
    Object.keys(installed_packages[configuration.settings.instance].content.packages[key].workspace)
      .reduce((acc, workspace) => (acc.includes(workspace.split('/')[0]) ? acc : [...acc, workspace]), [])
      .filter(group => installed_packages[configuration.settings.instance].content.packages[key].workspace[group].start)
      .forEach(group => {
        debug(
          'link',
          path.join(
            configuration.settings.packages,
            key,
            installed_packages[configuration.settings.instance].content.packages[key].workspace[group].source ||
              'content'
          )
        );
        debug('to', group);
        try {
          fs.ensureSymlinkSync(
            path.join(
              configuration.settings.packages,
              key,
              installed_packages[configuration.settings.instance].content.packages[key].workspace[group].source ||
                'content'
            ),
            path.join(current, group)
          );
          console.log(
            'Symlinked',
            path.join(
              configuration.settings.packages,
              key,
              installed_packages[configuration.settings.instance].content.packages[key].workspace[group].source ||
                'content'
            ) +
              ' to ' +
              path.join(current, group)
          );
        } catch (e) {
          exit(
            '\nError while creating symlink from ' +
              path.join(
                configuration.settings.packages,
                key,
                installed_packages[configuration.settings.instance].content.packages[key].workspace[group].source ||
                  'content'
              ) +
              ' to ' +
              path.join(current, group),
            e
          );
        }
      });
  });

  return configuration;
};

export { doPackagesInit, doPackagesCheck, doPackagesUpgrade };
