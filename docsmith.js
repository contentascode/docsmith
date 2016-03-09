#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var pjson = require('./package.json');

program
  .version(pjson.version)
  .option('-v, --verbose', 'Display additional log output')

program
  .command('install [component] [plugin]', 'install one or more components with their default settings or a specific plugin')
//  .command('init [template] [directory]', 'initialise the current folder or the directory with the default or specified template')
  .command('status', 'displays current configuration')
  .parse(process.argv);