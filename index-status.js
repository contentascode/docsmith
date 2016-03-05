#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');

program
  .command('status')
  .description('status')
  .action(function() {
    console.log('status');
  });