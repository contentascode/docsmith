#!/usr/bin/env node
'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('docsmith:start');
var program = require('commander');
var start = require('./docsmith/start');
var config = require('./docsmith/utils/settings').config;

var workspace = void 0;

program.arguments('[workspace]').option('-s, --source [path]', '[migrate] Source folder path]').option('--baseurl [baseurl]', 'Set site.baseurl metadata value.').option('-n, --no-watch', 'Do not watch content folder and serve on local server. Watches by default.').option('-d, --debug', 'Enable /debug-ui url for debugging pipeline.').option('-c, --clean', 'Cleanup build directory before build.').option('-l, --link', 'For development purposes. Link local packages.').action(function (wksp) {
  workspace = wksp;
});

program.parse(process.argv);

var link = program.link,
    source = program.source,
    baseurl = program.baseurl,
    watch = program.watch,
    clean = program.clean,
    dbg = program.debug;


if (typeof workspace === 'undefined') workspace = 'toolkit';

// check if we could resolve the config.
if (config) {
  debug('config', config);
  // called from a content as code instance, initialise from the instance configuration
  start.run({ workspace, config, link, source, watch, clean, dbg, baseurl });
} else {
  console.warn('Could not find config. Aborting start. Please contact the developer');
}
//# sourceMappingURL=docsmith-start.js.map