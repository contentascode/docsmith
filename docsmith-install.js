#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var templates = require('./lib/templates');
var settings = require('./lib/settings');
var components = require('./lib/components');
var yaml = require('js-yaml');
var fs = require('fs-extra');
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
  case "integration":
    newSettings = install_integration(plugin, gh_token, curSettings)
    break;
  default:
    console.log('%s is not a known component.', component);
    process.exit();
}

// update settings file.

if (newSettings) {
  settings.save(newSettings)
  console.log('Saved new integration plugin');
  console.log(newSettings.integration)      
} else {
  console.log('No modifications. Current integration plugin is');
  console.log(curSettings.integration)      
}

function install_integration(plugin, gh_token, curSet) {
  var result;

  if (!curSet.integration) curSet.integration = {};

  switch(plugin) {
    case "travis":
      if (!(plugin in curSet.integration)) {
        curSet.integration.travis = settings.DEFAULT_TRAVIS;

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


        // Install and check necessary files - .travis.yml / Rake depending on other components.
        //
        // For now this is a blend of trying to generate files, do idempotent file check a la ansible
        // and just copying template files.
        //
        // Later for moving between configurations, things might be different. For instance with Travis,
        // given we're using the https://github.com/mfenner/jekyll-travis approach, the server side build is using Rake.
        // Maybe this should be parameterised to be able to change build system and compose different components.
        // One of the big factors is if there is a linear build pipe a la metalsmith, or if we have a tree which will
        // necessitate more of a Make or equivalent approach.

        var travis_yml = new Promise(function(resolve,reject) {
          // This builds the yaml in memory including the secure token and writes the file
          // It could also use a moustache style template in build/travis/.travis.yml
          create_travis_yml(gh_token, resolve, reject)
        });

        travis_yml
          .then(lineinfile('Gemfile', components.LINE_TRAVIS_GEMFILE_RAKE))
          .then(copyfile('build/travis/Rakefile'))
          .then(function() {
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
      if (!(plugin in curSet.integration)) {
        curSet.components.build = plugin
        return curSet
      }
      break;
    default:
      if (curSet.integration == {}) {
        console.log('Current integration plugin configuration is')
        console.log(curSet.integration)
        process.exit()
      }
      else {
        console.log('No integration plugin currently installed. Please specify a plugin to install a build component.')
        console.log('For instance to enable the travis plugin use :')
        console.log('$ docsmith install build travis')
        process.exit()
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

function lineinfile(dest, line) {
  new Promise(function(resolve,reject) {
    // mimicking ansible lineinfile module API with state=present
    fs.readFile(dest, function (err, data) {
      if (err) reject(err);
      if(data.toString().indexOf(line) > -1){
        // Should use ansible regexp feature to deal with versions. 
        resolve();
      } else {
        fs.appendFile(dest, "\n" + line, function (err) {
          if (err) reject();
          resolve();
        });
      }
    });
  });
}

function copyfile(src) {
  new Promise(function(resolve,reject) {
    fs.copy(src, '.', function (err) {
      if (err) reject(err);
      resolve();
    })    
  })
}


