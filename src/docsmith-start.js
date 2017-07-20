#!/usr/bin/env node

/**
 * Module dependencies.
 */

const debug = require('debug')('docsmith:start');
const program = require('commander');
const start = require('./docsmith/start');
const config = require('./docsmith/utils/settings').config;

let workspace;

const mapper = (val, memo) => {
  memo[val.split(':')[0]] = val.split(':')[1];
  return memo;
};

program
  .arguments('[workspace]')
  .option('-s, --source [path]', '[migrate] Source folder path]')
  .option('--baseurl [baseurl]', 'Set site.baseurl metadata value.')
  .option('--package [mapping]', 'Enables package:path mapping', mapper, {})
  .option('-w, --watch', 'Watch content folder and serve on local server.')
  .option('-d, --debug', 'Enable /debug-ui url for debugging pipeline.')
  .option('-f, --force', 'Initialise whether the current directory is empty or not.')
  .option('-l, --link', 'For development purposes. Link local packages.')
  .action(function(wksp) {
    workspace = wksp;
  })
  .parse(process.argv);

const { link, source, baseurl, watch, debug: dbg, package: mapping } = program;

console.log('napping', mapping);
// check if we could resolve the config.
if (config) {
  debug('config', config);
  // called from a content as code instance, initialise from the instance configuration
  start.run({ workspace, config, link, source, watch, dbg, baseurl, mapping });
} else {
  console.warn('Could not find config. Aborting start. Please contact the developer');
}
