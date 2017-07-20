#!/usr/bin/env node --trace-warnings

/**
 * Module dependencies.
 */

const program = require('commander');
const fs = require('extfs');
const caller = require('./docsmith/utils/caller');
const templates = require('./docsmith/init/templates');
const init = require('./docsmith/init');

let template;

program
  .arguments('[template]')
  .option('-f, --force', 'Initialise whether the current directory is empty or not.')
  .option('--defaults', 'Accepts defaults prompts and skips confirmation.')
  .option('-l, --link', 'For development purposes. Link local packages.')
  .action(function(templ) {
    template = templ;
  })
  .parse(process.argv);

// check if this is an empty folder.

fs.isEmpty('.', function(empty) {
  if (empty || program.force) {
    if (caller.original()) {
      // initialises from a built-in template
      templates.init(template);
    } else {
      // called from a content as code instance, initialise from the instance configuration
      init.run({ template, config: caller.path(true), link: program.link, defaults: program.defaults });
    }
  } else {
    console.warn('This directory is not empty. Aborting init. Use --force to ignore current content.');
  }
});
