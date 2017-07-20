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

var mapper = function mapper(val, memo) {
  memo[val.split(':')[0]] = val.split(':')[1];
  return memo;
};

program.arguments('[workspace]').option('-s, --source [path]', '[migrate] Source folder path]').option('--baseurl [baseurl]', 'Set site.baseurl metadata value.').option('--package [mapping]', 'Enables package:path mapping', mapper, {}).option('-w, --watch', 'Watch content folder and serve on local server.').option('-d, --debug', 'Enable /debug-ui url for debugging pipeline.').option('-f, --force', 'Initialise whether the current directory is empty or not.').option('-l, --link', 'For development purposes. Link local packages.').action(function (wksp) {
  workspace = wksp;
}).parse(process.argv);

var link = program.link,
    source = program.source,
    baseurl = program.baseurl,
    watch = program.watch,
    dbg = program.debug,
    mapping = program.package;


console.log('napping', mapping);
// check if we could resolve the config.
if (config) {
  debug('config', config);
  // called from a content as code instance, initialise from the instance configuration
  start.run({ workspace, config, link, source, watch, dbg, baseurl, mapping });
} else {
  console.warn('Could not find config. Aborting start. Please contact the developer');
}
//# sourceMappingURL=docsmith-start.js.map