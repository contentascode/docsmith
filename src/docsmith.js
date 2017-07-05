#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander');
const pjson = require('../package.json');

program.version(pjson.version).option('-v, --verbose', 'Display additional log output');

process.once('SIGINT', function() {
  console.log('Exiting. See ya!');
});

program
  .command(
    'install [component] [plugin]',
    'install one or more components with their default settings or a specific plugin'
  )
  .command('init [template]', 'initialise the current folder with the default or specified template')
  .command('build', 'build the content locally')
  .command('start', 'build, serve and watch content for changes')
  .command('status', 'displays current configuration')
  .parse(process.argv);
