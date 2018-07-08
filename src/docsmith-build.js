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
  .option('--project [project]', 'Shorthand expo project name e.g. @org/name')
  .option('--keystore_path [path]', 'Absolute path to .jks keystore file. e.g. ~/keys/my-keystore.jks')
  .option('--key_alias [path]', 'Key alias. e.g. my-key-alias')
  .option('--sdk_version [sdk_version]', 'SDK version. default: 27.0.0')
  .option('--platform [platform]', 'Platform. default: android')
  .option('-c, --clean', 'Cleanup build directory before build.')
  .option('-l, --link', 'For development purposes. Link local packages.')
  .action(function(wksp) {
    workspace = wksp;
  });

program.parse(process.argv);
const { link, clean, keystore_path, key_alias, project, sdk_version, platform } = program;

// check if we could resolve the config.
if (config) {
  debug('config', config);
  // called from a content as code instance, initialise from the instance configuration
  build
    .run({ workspace, config, link, clean, keystore_path, key_alias, project, sdk_version, platform })
    .catch(e => console.error(e));
} else {
  console.warn('Could not find config. Aborting start. Please contact the developer');
}
