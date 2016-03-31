#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var curSettings = require('./lib/settings').settings;
var yaml = require('js-yaml');

var component, plugin;

program
  .arguments('[component] [plugin]')
  .action(function(comp,plug) {
    component = comp;
    pluging = plug;
  })
  .parse(process.argv);

console.log('Current Content as Code settings:');
console.log('');
console.log(yaml.safeDump(curSettings));
