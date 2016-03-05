#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');

program
  .command('install [component] [plugin]')
  .description('install one or more components with their default settings or a specific plugin')
  .action(function(component, plugin) {
    console.log('install "%s" "%s"', component, plugin);
  });