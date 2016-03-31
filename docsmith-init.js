#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var templates = require('./lib/templates');

// default is metalsmith
var template = "metalsmith";

program
  .arguments('[template]')
  .action(function(templ) {
    template = templ;
  })
  .parse(process.argv);

templates.init(template);
