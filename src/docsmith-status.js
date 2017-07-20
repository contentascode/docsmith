#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander');
const config = require('./docsmith/settings').config;
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

console.log('Current Content as Code configuration:');
console.log('');
console.log(yaml.safeDump(config));
