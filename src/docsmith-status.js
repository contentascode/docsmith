#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander');
const curSettings = require('./docsmith/settings').settings;
const yaml = require('js-yaml');

let component, plugin;

program
  .arguments('[component] [plugin]')
  .action(function(comp, plug) {
    component = comp;
    plugin = plug;
  })
  .parse(process.argv);

if (component) console.log('Ignoring option component', component);
if (plugin) console.log('Ignoring option plugin', plugin);

console.log('Current Content as Code settings:');
console.log('');
console.log(yaml.safeDump(curSettings));
