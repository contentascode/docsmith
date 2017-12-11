const debug = require('debug')('docsmith:init');

const { banner, exit } = require('./utils/terminal');
const configure = require('./configure');
const { doWorkspaceInit, doWorkspaceCheck } = require('./workspace');
const settings = require('./utils/settings');

const doInit = async ({ non_interactive }) => {
  banner({
    title: 'Initialisation',
    message:
      'This script will check your configuration and initialise the current directory as your workspace.' +
      '\n' +
      "Please answer a few questions below and you'll be up and running in no time" +
      '\n'
  });

  // Loading without argument will prompt the user for the name of a new project and the name of a template.
  debug('non_interactive', non_interactive);
  // const configuration = await configure.doEnsure({ non_interactive });
  let configuration = await configure.doGet();
  debug('configuration', configuration);

  if (!configuration) {
    debug('configuration needs to be created');
    configuration = await configure.doInit({ non_interactive });
  } else {
    debug('configuration needs to be updated');
    configuration = await configure.doInit({ non_interactive, configuration });
  }

  const workspace = await doWorkspaceCheck({ non_interactive: true, configuration, path: process.cwd() });
  // Check if workspace is properly described in repository.workspace
  //   - If not, just update the workspace ? Or could this be a problem?
  if (!workspace) {
    debug('workspace needs to be initialised');
    configuration = await doWorkspaceInit({ non_interactive, configuration });
  } else {
    exit(
      `Workspace already initialised. You can update your content packages with '${settings.instance} update', \nor create a new content package by using '${settings.instance} new'`
    );
  }
  //
  // // Check if packages described in the repository config (possibly updated from the initial bootstrap config)
  // // Are present.
  // const pkgs = await doPackagesCheck({ non_interactive, configuration });
  // debug('pkgs', pkgs[settings.instance]);
  // const missing_pkgs = pkgs[settings.instance].filter(x => !x[Object.keys(x)[0]]).map(x => Object.keys(x)[0]);
  // debug('missing_pkgs', missing_pkgs);
  // if (missing_pkgs.length !== 0) {
  //   debug('initialising missing packages.');
  //   configuration = await doPackagesInit({ non_interactive, configuration, packages: missing_pkgs });
  // }
  //
  exit('Workspace succesfully initialised.');
};

export { doInit };
