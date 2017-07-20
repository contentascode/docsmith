#!/usr/bin/env node

/**
 * Module dependencies.
 */

const debug = require('debug')('docsmith:start');
const program = require('commander');
const start = require('./docsmith/start');
const config = require('./docsmith/utils/settings').config;

let workspace;

program
  .arguments('[workspace]')
  .option('-s, --source [path]', '[migrate] Source folder path]')
  .option('-w, --watch', 'Watch content folder and serve on local server.')
  .option('-d, --debug', 'Enable /debug-ui url for debugging pipeline.')
  .option('-f, --force', 'Initialise whether the current directory is empty or not.')
  .option('-l, --link', 'For development purposes. Link local packages.')
  .action(function(wksp) {
    workspace = wksp;
  })
  .parse(process.argv);

const { link, source, watch, debug: dbg } = program;

// check if we could resolve the config.
if (config) {
  debug('config', config);
  // called from a content as code instance, initialise from the instance configuration
  start.run({ workspace, config, link, source, watch, dbg });
} else {
  console.warn('Couldnot find config. Aborting start. Please contact the developer');
}
