#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var templates = require('./lib/templates');

var template;

program
  .arguments('[template]')
  .action(function(templ) {
    template = templ;
  })
  .parse(process.argv);

if (template) {
  console.log('something with a template')
} else {
  console.log('before init')
  templates.init();
}