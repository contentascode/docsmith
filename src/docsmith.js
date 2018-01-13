#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander');
const pjson = require('../package.json');
const debug = require('debug')('docsmith:init');

global.Promise = require('bluebird');
program.version(pjson.version).option('-v, --verbose', 'Display additional log output');

process.once('SIGINT', function() {
  console.log('Exiting. See ya!');
});

program
  .command('init [template]', 'initialise the current folder with the default or specified template')
  .command('start', 'Start preview')
  .command('run', 'Run workspace script')
  .command('new', 'Create new content package')
  .command('load', 'Load existing content package')
  .command('save', 'Save current content package')
  .command('config', 'Display configuration')
  .command('link [mappings]', 'link content packages')
  .command(
    'install [component] [plugin]',
    'EXPERIMENTAL - install one or more components with their default settings or a specific plugin'
  )
  .command('build', 'EXPERIMENTAL - build the content locally')
  .command('status', 'EXPERIMENTAL - displays current configuration')
  .parse(process.argv);
