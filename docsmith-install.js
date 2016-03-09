#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var templates = require('./lib/templates');
var settings = require('./lib/settings');

var curSettings = settings.settings

var component, plugin;

program
  .arguments('[component] [plugin]')
  .description('install one or more components with their default settings or a specific plugin')
  .action(function(comp,plug) {
    component = comp;
    plugin = plug;
  })
  .parse(process.argv);

var newSettings;

switch(component) {
  case "build":
    newSettings = docsmith_install_build(plugin, curSettings)
    break;
  default:
    console.log('%s is not a known component.')
}

// update settings file.

if (newSettings) {
  settings.save(newSettings)
  console.log('Saved new build plugin: %s', newSettings.build)      
} else {
  console.log('No modifications. Current build plugin is: %s', curSettings.build)      
}

function docsmith_install_build(plugin,curSet) {
  var result;

  switch(plugin) {
    case "travis":
      if (curSet.build != plugin) {
        curSet.build = plugin
        result = docsmith_install_build_travis();
        if (result) {
          console.log('You have just installed travis')
        }
        return curSet
      }

      break;
    case "github-pages":
      if (curSet.build != plugin) {
        curSet.build = plugin
        return curSet
      }
      break;
    default:
      if (curSet.build) {
        console.log('Current build plugin is: %s', curSet.build)
        return null
      }
      else {
        console.log('No build plugin currently installed. Please specify a plugin to install a build component.')
        console.log('For instance to enable the travis plugin use :')
        console.log('$ docsmith install build travis')
      }
  }
}

function docsmith_install_build_travis() {
  // needs to install and check necessary files - .travis.yml / Rake depending on other components.
  return true;
}