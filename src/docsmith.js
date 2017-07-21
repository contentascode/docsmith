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
  .command('init [template]', 'initialise the current folder with the default or specified template')
  .command('link [mappings]', 'link content packages')
  .command('start', 'build, serve and watch content for changes')
  .command(
    'install [component] [plugin]',
    'EXPERIMENTAL - install one or more components with their default settings or a specific plugin'
  )
  .command('build', 'EXPERIMENTAL - build the content locally')
  .command('status', 'EXPERIMENTAL - displays current configuration')
  .parse(process.argv);
