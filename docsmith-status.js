#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var curSettings = require('./lib/settings').settings;

var component, plugin;

program
  .arguments('[component] [plugin]')
  .action(function(comp,plug) {
    component = comp;
    pluging = plug;
  })
  .parse(process.argv);

console.log('status %s %s', component, plugin);
console.log('settings:');
console.log(curSettings);
