#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander');

program
  .arguments('[package]')
  .option('--debug', 'Display npm log.')
  .parse(process.argv);

// `configure`: Check if configure. Creates .content and clone, and checks out tag.
// `store/create`: Creates and checks out new personal work branch
// `package/check`: Checks npm for new release.
// `store/update`: Asks for update (rebase).
// `configure/default`: Ask to make default

const doLoad = async ({ package: arg_package }) => {
  const { default_package } = await configure.load();
  const pkg = arg_package || default_package;

  const loaded = await store.create({ package: pkg });
  const checked = await pkg.check({ package: pkg });
  const updated = checked.uptodate && (await store.update({ package: pkg }));
  const defaulted = await configure.default;
};

try {
  doLoad();
} catch (e) {
  terminal.exit('The load function terminated with an error.', e);
}

// ~~check if this is an empty folder.~~
// Check if the folder contains a folder for this instance.
// Also check if that instance is git initialise, and if not upgrade it.

// const fs = require('fs');
// const caller = require('./docsmith/utils/caller');
// const templates = require('./docsmith/init/templates');
// const init = require('./docsmith/init');
// const update = require('./docsmith/update');
// const settings = require('./docsmith/utils/settings');

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
