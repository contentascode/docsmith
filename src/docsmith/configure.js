const debug = require('debug')('docsmith:configure');
const fs = require('fs-extra');
const read = require('fs').readFileSync;
const path = require('path');
// var npmi = require('npmi');
const omit = require('lodash').omit;
const yaml = require('js-yaml');

global.Promise = require('bluebird');

global.Promise.promisifyAll(fs);

const { promptConfirm, promptRepository, exit } = require('./utils/terminal');
const { doCheck, doClone, doInfo } = require('./utils/git');
const { doWorkspaceInit, doWorkspaceCheck, doWorkspacesInfo } = require('./workspace');
const { doInstancesInfo } = require('./instance');
const { doPackagesInit, doPackagesCheck } = require('./package');
const settings = require('./utils/settings');

// Default to creating global ~/.content and link it to current workspace. (Using this as a workspace detection feature).
// Register workspace in `.content/content.yml` file.
// Allow multi configuration (for development, isolation) by reading the relative `.content` folder.

// `configure`:
//   - checks if workspace. (exists ./.content symlink or folder). if not workspace:
//     - check if global ~/.content. if not ~/.content
//       - `configure/init`
//     - `configure/workspace`
//   - `configure/sync`

// `configure/init`
//   - Ask to confirm for configure global .content

// `configure/workspace`
//   - Ask to confirm for creation of workspace in current folder.

// `configure/sync`
//   - `packages/sync`: Sync package versions.

const toSnakeCase = string =>
  string
    // Remove all non-word characters
    .replace(/[^\w\s]/g, '_')
    // Replace remaining double spaces for single space
    .replace(/\s+/g, ' ')
    // Add underscores
    .toLowerCase()
    .split(' ')
    .join('_');

const doGet = async () => {
  if (!settings.config) return false;
  const git = await doCheck();
  const repository = yaml.safeLoad(fs.readFileSync(settings.config, 'utf8'));
  const instances = await doInstancesInfo({ instances: repository.instances });
  const workspaces = await doWorkspacesInfo({ workspaces: repository.workspaces });
  debug('workspaces', workspaces);

  return { settings, repository: { ...repository, instances }, workspaces, git, user: toSnakeCase(git.email) };
};

const doEnsure = async ({ non_interactive }) => {
  let configuration = await doGet();
  if (!configuration) {
    debug('configuration needs to be initialised');
    configuration = await doInit({ non_interactive });
  }
  const workspace = await doWorkspaceCheck({ non_interactive: true, configuration, path: process.cwd() });
  // Check if workspace is properly described in repository.workspace
  //   - If not, just update the workspace ? Or could this be a problem?
  if (!workspace) {
    debug('workspace needs to be initialised');
    configuration = await doWorkspaceInit({ non_interactive, configuration });
  }
  // Check if packages described in the repository config (possibly updated from the initial bootstrap config)
  // Are present.
  const pkgs = await doPackagesCheck({ non_interactive, configuration });
  debug('pkgs', pkgs[settings.instance]);
  const missing_pkgs = pkgs[settings.instance].filter(x => !x[Object.keys(x)[0]]).map(x => Object.keys(x)[0]);
  debug('missing_pkgs', missing_pkgs);
  if (missing_pkgs.length !== 0) {
    debug('initialising missing packages.');
    configuration = await doPackagesInit({ non_interactive, configuration, packages: missing_pkgs });
  }

  return configuration;
};

const doInit = async ({ non_interactive, configuration }) => {
  // We check if there are potential conflicts with the current configuration.
  // If there is no key for the instance, then we just initialise with the content package values.
  // If there is a key for the instance we run update.

  let repository;

  if (!configuration || !fs.existsSync(configuration.config.replace('/content.yml', ''))) {
    const prompt_repository = await promptRepository({ non_interactive, default_path: process.env.HOME + '/.content' });
    repository = prompt_repository.repository;

    const confirmed = await promptConfirm({ non_interactive });
    debug('confirmed', confirmed);

    fs.existsSync(repository) || fs.mkdirSync(repository);
    debug('> Content repository: ', repository);
  } else {
    repository = configuration.config.replace('/content.yml', '');
  }

  if (!fs.existsSync(path.join(repository, 'packages'))) {
    const pkgs = path.join(repository, 'packages');
    fs.existsSync(pkgs) || fs.mkdirSync(pkgs);
    debug('> Content packages directory: ', pkgs);

    // Create or overwrite package.json to enable desired folder structure
    fs.writeFileSync(
      path.join(pkgs, 'package.json'),
      JSON.stringify({ private: true, name: 'contentascode', version: '0.0.0' }),
      'utf-8'
    );
    debug('> Content repository package.json created: ', path.join(pkgs, 'package.json'));
  }

  let content;

  if (!fs.existsSync(path.join(repository, 'content.yml'))) {
    debug('No repository configuration');
    content = {
      instances: {
        [settings.instance]: { name: settings.description, package: settings.package }
      }
    };
  } else {
    debug('Existing repository configuration');
    content = yaml.safeLoad(fs.readFileSync(path.join(repository, 'content.yml'), 'utf8'));
    if (content.repository && content.repository.instances && content.repository.instances[settings.instance]) {
      // TODO: Upgrade path
      debug('Configuration exists and instance already exists');
      exit(
        'This repository has already been configured. Please run ' + settings.instance + 'start to preview the content.'
      );
    } else if (
      content.repository &&
      content.repository.instances &&
      content.repository.instances[settings.instance] === undefined
    ) {
      debug('Configuration exists but instance does not. Adding instance configuration');
      content = {
        ...content,
        instances: {
          ...content.instances,
          [settings.instance]: { name: settings.description, package: settings.package }
        }
      };
    } else {
      exit(
        'The content.yml file in ' +
          path.join(repository, '.content.yml') +
          ' is not recognised. This beta cannot upgrade configuration yet. Please contact the developer at jun@iilab.org ',
        new Error('Content.yml structure not recognised')
      );
    }
  }

  // const instances = await doInstancesInfo({ instances: content.repository.instances });
  // debug('instances', instances);

  fs.writeFileSync(path.join(repository, 'content.yml'), yaml.safeDump(content), 'utf8');
  debug('> Content repository configuration updated: ', path.join(repository, 'content.yml'));

  // Now workspace needs to be initialised which for now is done outside `configure` and in `init`.
  // const workspaces = await doWorkspacesInfo({ workspaces: repository.workspaces });

  const instances = await doInstancesInfo({ instances: content.instances });

  return { settings, repository: { ...content, instances } };

  // console.log('content', content);
  // const resClone = await clone(content.packages, content.repository);
  //
  // debug('clone', resClone);
};

const doUpdate = async () => {
  // Called after an update has been spotted.
  // We need to merge and ask the user for confirmation.
};

export { doGet, doEnsure, doInit };
//
// async function configure({ template, config, link, defaults, verbose }) {
//   // Guard against non implemented feature
//   if (template) {
//     // TODO: Deal with instance templates
//     return exit('\nError while initialising: template instances are not yet supported');
//   }
//
//   // Check git configuration
//   const resCheck = await check();
//   debug('check', resCheck);
//
//   const exists = await fs.pathExists(path.join(config, './content.yml'));
//   if (exists) {
//     const promzard = require('promzard');
//     const file = path.resolve(__dirname, './utils/prompt.js');
//     const content = yaml(read(path.join(config, './content.yml'), 'utf8'));
//
//     console.log(
//       '\n' +
//         '\n' +
//         chalk.grey('============================================================================') +
//         '\n' +
//         chalk.grey('===========                                                      ===========') +
//         '\n' +
//         chalk.grey('===========') +
//         '            ' +
//         pad((settings.description || settings.instance) + ' Initialisation', ' ', 42) +
//         chalk.grey('===========') +
//         '\n' +
//         chalk.grey('===========                                                      ===========') +
//         '\n' +
//         chalk.grey('============================================================================') +
//         '\n' +
//         '\n' +
//         'This script will initialise the current directory as your workspace.' +
//         '\n' +
//         '\n' +
//         'It will also update your global `.content` repository' +
//         '\n' +
//         'and install the following content packages and their dependencies:' +
//         '\n' +
//         '\n' +
//         Object.keys(content.packages).map(repo => '\t' + repo + ': ' + content.packages[repo] + '\n') +
//         '\n' +
//         "Please answer a few questions below and you'll be up and running in no time" +
//         '\n' +
//         '\n' +
//         chalk.yellow(
//           'NOTE: This is a prototype, please accept defaults by hitting enter\n or hit Ctrl-C at any time to exit.'
//         ) +
//         '\n'
//     );
//
//     promzard(file, { content, defaults }, async (err, responses) => {
//       if ((err && err.message == 'canceled') || (responses && responses.confirm !== 'yes')) {
//         console.log('\nExiting without initialising. See ya!');
//         process.exit(0);
//       }
//       if (err) exit('Error while processing prompt results', err);
//
//       fs.existsSync(responses.repository) || fs.mkdirSync(responses.repository);
//       debug('> Content repository: ', responses.repository);
//
//       const pkgs = path.join(responses.repository, 'packages');
//       fs.existsSync(pkgs) || fs.mkdirSync(pkgs);
//       debug('> Content packages directory: ', pkgs);
//
//       // Change working directory temporarily as npm api is insufficient.
//       const current = process.cwd();
//       try {
//         process.chdir(pkgs);
//         debug('changed directory: ', pkgs);
//       } catch (err) {
//         exit('\nError while changing directory', err);
//       }
//
//       // Create or overwrite package.json to enable desired folder structure
//       fs.writeFileSync(
//         path.join(process.cwd(), 'package.json'),
//         JSON.stringify({ private: true, name: 'contentascode', version: '0.0.0' }),
//         'utf-8'
//       );
//       debug('> Content repository configuration created: ', path.join(process.cwd(), 'package.json'));
//
//       console.log('content', content);
//       const resClone = await clone(content.packages, content.repository);
//
//       debug('clone', resClone);
//     });
//   } else {
//     console.error(
//       'Error: CLI tool does not have a content.yml configuration file. Please report the error to the developer.'
//     );
//     process.exit(1, '');
//   }
// }
