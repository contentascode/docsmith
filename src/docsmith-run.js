#!/usr/bin/env node

/**
 * Module dependencies.
 */

const debug = require('debug')('docsmith:run');
const program = require('commander');
const start = require('./docsmith/start');
const config = require('./docsmith/utils/settings').config;

let workspace;

program
  .arguments('[workspace]')
  .option('-s, --source [path]', '[migrate] Source folder path]')
  .option('--baseurl [baseurl]', 'Set site.baseurl metadata value.')
  .option('-w, --no-warning', 'Do not display transclusion warnings.')
  .option('-d, --debug', 'Enable /debug-ui url for debugging pipeline.')
  .option('-c, --clean', 'Cleanup build directory before build.')
  .option('-l, --link', 'For development purposes. Link local packages.')
  .action(function(wksp) {
    workspace = wksp;
  });

program.parse(process.argv);

const { link, source, baseurl, watch = false, clean = true, debug: dbg, warning } = program;

// check if we could resolve the config.
if (config) {
  debug('config', config);
  // called from a content as code instance, initialise from the instance configuration
  start.run({ workspace, config, link, source, watch, clean, dbg, baseurl, warning, run: true });
} else {
  console.warn('Could not find config. Aborting start. Please contact the developer');
}
