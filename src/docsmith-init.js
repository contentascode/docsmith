#!/usr/bin/env node

/**
 * Module dependencies.
 */
require('source-map-support').install();
const program = require('commander');
const { doInit } = require('./docsmith/init.js');
const { exit } = require('./docsmith/utils/terminal');

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

doInit({ non_interactive }).catch(e => {
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
