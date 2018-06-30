#!/usr/bin/env node

/**
 * Module dependencies.
 */

const debug = require('debug')('docsmith:build');
const program = require('commander');
const build = require('./docsmith/build');
const config = require('./docsmith/utils/settings').config;

let workspace;

program
  .arguments('[workspace]')
  .option('--keystore_path [path]', 'Path to .jks keystore file.')
  .option('--key_alias [path]', 'Key alias.')
  .option('-c, --clean', 'Cleanup build directory before build.')
  .option('-l, --link', 'For development purposes. Link local packages.')
  .action(function(wksp) {
    workspace = wksp;
  });

program.parse(process.argv);
const { link, clean, keystore_path, key_alias } = program;

// check if we could resolve the config.
if (config) {
  debug('config', config);
  // called from a content as code instance, initialise from the instance configuration
  build.run({ workspace, config, link, clean, keystore_path, key_alias }).catch(e => console.error(e));
} else {
  console.warn('Could not find config. Aborting start. Please contact the developer');
}
