#!/usr/bin/env node -- --trace-warnings
'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('docsmith:start');
var program = require('commander');
var start = require('./docsmith/start');
var config = require('./docsmith/utils/settings').config;

var workspace = void 0;

program.arguments('[workspace]').option('-s, --source [path]', '[migrate] Source folder path]').option('-w, --watch', 'Watch content folder and serve on local server.').option('-d, --debug', 'Enable /debug-ui url for debugging pipeline.').option('-f, --force', 'Initialise whether the current directory is empty or not.').option('-l, --link', 'For development purposes. Link local packages.').action(function (wksp) {
  workspace = wksp;
}).parse(process.argv);

var link = program.link,
    source = program.source,
    watch = program.watch,
    dbg = program.debug;

// check if we could resolve the config.

if (config) {
  debug('config', config);
  // called from a content as code instance, initialise from the instance configuration
  start.run({ workspace, config, link, source, watch, dbg });
} else {
  console.warn('Couldnot find config. Aborting start. Please contact the developer');
}
//# sourceMappingURL=docsmith-start.js.map