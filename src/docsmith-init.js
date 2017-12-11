#!/usr/bin/env node

/**
 * Module dependencies.
 */
require('source-map-support').install();
const debug = require('debug')('docsmith:init');
const fs = require('fs');
const path = require('path');

const readLink = require('bluebird').promisify(fs.readlink);

const { banner, exit, promptConfirm, promptNew } = require('./docsmith/utils/terminal');
const configure = require('./docsmith/configure');
const { doWorkspaceInit, doWorkspaceCheck } = require('./docsmith/workspace');
const { doPackagesInit, doPackagesCheck } = require('./docsmith/package');
const program = require('commander');
const settings = require('./docsmith/utils/settings');

program
  .arguments('[template]')
  .option('-n, --non-interactive', 'Runs without prompts.')
  .option('-f, --force', 'Initialise whether the current directory is empty or not.')
  // DEPRECATED
  // .option('--defaults', 'Accepts defaults prompts and skips confirmation.')
  // .option('-l, --link', 'For development purposes. Link local packages.')
  .option('--debug', 'Display npm log.')
  .parse(process.argv);

const { nonInteractive: non_interactive } = program;

// ~~check if this is an empty folder.~~
// Check if the folder contains a folder for this instance.
// Also check if that instance is git initialise, and if not upgrade it.

const doInit = async () => {
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
    debug('configuration needs to be initialised');
    configuration = await doInit({ non_interactive });
  }
  const workspace = await doWorkspaceCheck({ non_interactive: true, configuration, path: process.cwd() });
  // Check if workspace is properly described in repository.workspace
  //   - If not, just update the workspace ? Or could this be a problem?
  if (!workspace) {
    debug('workspace needs to be initialised');
    configuration = await doWorkspaceInit({ non_interactive, configuration });
  } else {
    exit(
      `Workspace already initialised. You can update your content packages with '${setting.instance} update', \nor create a new content package by using '${setting.instance} new'`
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

doInit().catch(e => {
  exit('The init function terminated with an error.', e);
});

// const fs = require('fs');
// const caller = require('./docsmith/utils/caller');
// const templates = require('./docsmith/init/templates');
// const init = require('./docsmith/init');
// const update = require('./docsmith/update');
// const settings = require('./docsmith/utils/settings');
// const terminal = require('./docsmith/utils/terminal');
//
// let template;

// fs.readlink(`./@${settings.instance}`, async function(err, link) {
//   if ((err && err.code === 'ENOENT') || program.force) {
//     if (caller.original()) {
//       console.error('WARNING: Careful this probably does not work. Use --force to ignore this warning.');
//       // initialises from a built-in template
//       if (program.force) templates.init(template);
//     } else {
//       // called from a content as code instance, initialise from the instance configuration
//
//       const res = await init.run({
//         template,
//         config: caller.path(true),
//         link: program.link,
//         defaults: program.defaults,
//         verbose: program.debug
//       });
//     }
//   } else {
//     console.warn('Workspace already initialised. Attempting to update. Use --force to ignore current content.');
//     update.run({
//       template,
//       config: caller.path(true),
//       link: program.link,
//       defaults: program.defaults,
//       verbose: program.debug
//     });
//   }
// });
//
// process.on('uncaughtException', err => console.error('uncaught exception:', err));
// process.on('unhandledRejection', error => console.error('unhandled rejection:', error));
