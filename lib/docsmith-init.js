#!/usr/bin/env node --trace-warnings
'use strict';

/**
 * Module dependencies.
 */

var program = require('commander');
var fs = require('extfs');
var caller = require('./docsmith/utils/caller');
var templates = require('./docsmith/templates');
var init = require('./docsmith/init');

var template = void 0;

program.arguments('[template]').option('-f, --force', 'Initialise whether the current directory is empty or not.').option('--defaults', 'Accepts defaults prompts and skips confirmation.').option('-l, --link', 'For development purposes. Link local packages.').action(function (templ) {
  template = templ;
}).parse(process.argv);

// check if this is an empty folder.

fs.isEmpty('.', function (empty) {
  if (empty || program.force) {
    if (template && caller.content()) {
      // initialises from a built-in template
      templates.init(template);
    } else {
      // called from a content as code instance, initialise from the instance configuration
      init.init({ template, config: caller.path(true), link: program.link, defaults: program.defaults });
    }
  } else {
    console.warn('This directory is not empty. Aborting init. Use --force to ignore current content.');
  }
});
//# sourceMappingURL=docsmith-init.js.map