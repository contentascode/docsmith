#!/usr/bin/env node
'use strict';

/**
 * Module dependencies.
 */

var program = require('commander');
var config = require('./docsmith/settings').config;
var yaml = require('js-yaml');

var component = void 0,
    plugin = void 0;

program.arguments('[component] [plugin]').action(function (comp, plug) {
  component = comp;
  plugin = plug;
}).parse(process.argv);

if (component) console.log('Ignoring option component', component);
if (plugin) console.log('Ignoring option plugin', plugin);

console.log('Current Content as Code configuration:');
console.log('');
console.log(yaml.safeDump(config));
//# sourceMappingURL=docsmith-status.js.map