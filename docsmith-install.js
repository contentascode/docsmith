#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var templates = require('./lib/templates');
var settings = require('./lib/settings');
var yaml = require('js-yaml');
var fs = require('fs');
var path = require('path');
const cp = require('child_process');
const git = require('nodegit');

var curSettings = settings.settings

var component, plugin, gh_token;

program
  .arguments('[component] [plugin]')
  .option('--git-name <git_name>', 'Overrides the current git user name or GIT_NAME env variable for the travis plugin')
  .option('--git-email <git_email>', 'Overrides the current git email or GIT_EMAIL env variablefor the travis plugin')
  .option('--gh-token <github_token>', 'Overrides GH_TOKEN env variable for the travis plugin')
  .description('install one or more components with their default settings or a specific plugin')
  .action(function(comp,plug) {
    component = comp;
    plugin = plug;
  })
  .parse(process.argv);

var newSettings;

switch(component) {
  case "build":
    newSettings = install_build(plugin, gh_token, curSettings)
    break;
  default:
    console.log('%s is not a known component.')
}

// update settings file.

if (newSettings) {
  settings.save(newSettings)
  console.log('Saved new build plugin: %s', newSettings.components.build)      
} else {
  console.log('No modifications. Current build plugin is: %s', curSettings.components.build)      
}

function install_build(plugin, gh_token, curSet) {
  var result;

  switch(plugin) {
    case "travis":
      if (curSet.components.build != plugin) {
        curSet.components.build = plugin


        if (!program.gh_token) {
          if (!process.env.GH_TOKEN) {
            console.log('Travis requires a Github Authentication Token in order to publish your website to Github Pages')
            console.log('The GH_TOKEN environment variable needs to be set, or the --gh-token option needs to be used.')
            process.exit();
          } else {
            gh_token = process.env.GH_TOKEN
          }
        } else {
          gh_token = program.gh_token 
        }


        // needs to install and check necessary files - .travis.yml / Rake depending on other components.

        var result = new Promise(function(resolve,reject) {
          create_travis_yml(gh_token, resolve, reject)
        });
        result.then(function() {
          console.log('You have just installed travis')          
        }).catch(
        // Log the rejection reason
        function(reason) {
          console.log('Problem installing the travis build component')
          console.log(reason);
        });

        return curSet
      }

      break;
    case "github-pages":
      if (curSet.components.build != plugin) {
        curSet.components.build = plugin
        return curSet
      }
      break;
    default:
      if (curSet.components.build) {
        console.log('Current build plugin is: %s', curSet.components.build)
        return null
      }
      else {
        console.log('No build plugin currently installed. Please specify a plugin to install a build component.')
        console.log('For instance to enable the travis plugin use :')
        console.log('$ docsmith install build travis')
      }
  }
}

function create_travis_yml(gh_token, resolve, reject) {
  var settings = {
    language: 'ruby',
    install: ['bundle install'],
    env: { global : { secure: ''}}
  }

  var git_name, git_email;

  var promise_name = git.Config.openDefault()
    .then(function(config) {
      return config.getString("user.name");
    });

  var promise_email = git.Config.openDefault()
    .then(function(config) {
      return config.getString("user.email");
    });

  Promise.all([ promise_name, promise_email ] )
    .then(function(values) {

      git_name = process.env.GIT_NAME || values[0]
      git_email = process.env.GIT_EMAIL || values[1]    

      // Generate the travis encrypted variable to access Github.      
      try {
        console.log("travis encrypt \'GIT_NAME=\"" + git_name + "\" GIT_EMAIL=\"" + git_email + "\" GH_TOKEN=\"" + gh_token + "\"\'")
        var stdout = cp.execSync("travis encrypt \'GIT_NAME=\"" + git_name + "\" GIT_EMAIL=\"" + git_email + "\" GH_TOKEN=\"" + gh_token + "\"\'")
        settings.env.global.secure = stdout.toString();
      } catch (e) {
        console.log('you need to have a working ruby environment and have installed the travis gem with `gem install travis`')
        reject(e);
      }

      // write the .travis.yml file.
      try {
        fs.writeFileSync('./.travis.yml', yaml.safeDump(settings), 'utf8')
        resolve();
      } catch (e) {
        reject(e);
      }

    }, function(reason) {
     reject(reason);
    });
}
