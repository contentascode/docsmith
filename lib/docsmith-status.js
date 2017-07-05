#!/usr/bin/env node
'use strict';

/**
 * Module dependencies.
 */

var program = require('commander');
var curSettings = require('./docsmith/settings').settings;
var yaml = require('js-yaml');

var component = void 0,
    plugin = void 0;

program.arguments('[component] [plugin]').action(function (comp, plug) {
  component = comp;
  plugin = plug;
}).parse(process.argv);

if (component) console.log('Ignoring option component', component);
if (plugin) console.log('Ignoring option plugin', plugin);

console.log('Current Content as Code settings:');
console.log('');
console.log(yaml.safeDump(curSettings));
//# sourceMappingURL=docsmith-status.js.map