#!/usr/bin/env node

/**
 * Module dependencies.
 */

var _ = require('lodash');
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
  .description('install one or more components with their default settings or a specific plugin')
  .option('--git-name <git_name>', 'Overrides the current git user name or GIT_NAME env variable for the travis plugin')
  .option('--git-email <git_email>', 'Overrides the current git email or GIT_EMAIL env variablefor the travis plugin')
  .option('--gh-token <github_token>', 'Overrides GH_TOKEN env variable for the travis plugin')
  .option('--test', 'Bypasses specific tasks for test runs')
  .arguments('[component] [plugin]')
  .action(function(comp,plug,options) {
    // Temporary fix for https://github.com/tj/commander.js/issues/508
    if (options.test && plug) {
      plugin = comp;
      component = plug;
    } else {
      component = comp;
      plugin = plug;
    }
  })
  .parse(process.argv);

var newSettings;

if (typeof component == 'undefined') {
  // docsmith install will install or update necessary components from _content.yml config

  console.log('Reading _content.yml and updating components.')
  newSettings = curSettings;

} else {
  // docsmith install [component] [plugin] will return component configuration or install plugins.
  // This only update settings, the actual installation is done via the update function.
  switch(component) {
    case "integration":
      switch(plugin) {
        case "travis":
          newSettings.integration.travis = settings.DEFAULT_TRAVIS;
        case "github-pages":
          newSettings.integration.travis = settings.DEFAULT_GITHUB_PAGES;
          break;
        default:
          if (curSettings.integration) {
            console.log('Current integration plugin configuration is \n')
            console.log(yaml.safeDump(curSettings.integration))
            process.exit()
          }
          else {
            console.log('No integration plugin currently installed. Please specify a plugin to install an integration component.')
            console.log('For instance to enable the travis plugin use :')
            console.log('$ docsmith install integration travis')
            process.exit()
          }
        }

      newSettings = install_integration(plugin, gh_token, curSettings)
      break;
    default:
      console.log('%s is not a known component.', component);
      process.exit();
  }
}

update(newSettings);

// update settings file.

function update(set) {
  // Lots of messy state for now... Wrapping all of this into a proper build system with dependencies
  // such that updating a particular key in the _content.yml config would trigger installations and writing
  // and updating of downstream configuration files...

  if (set) {
    Promise.all(
      _(set)
        .pickBy((item, key) => (key != "source") && (key != "implementation"))
        .mapValues(update_component)
    )
    .then(function() {
      settings.save(set)  
      console.log('Saved configuration.');
    })
    .catch(function(err) {
      console.log('A problem occured while updating components. See the error below.') 
      console.log(err);
      console.log('The new configuration has not been saved')
      process.exit(1);
    })
    
    //console.log(newSettings.integration)
  } else {
    // TODO Check that currently installed plugin configuration is sane.
    console.log('No modifications. Current configuration is');
    console.log(curSettings)
  }
}

function update_component(comp,comp_key,coll) {
  return new Promise(function(resolve, reject) {
    console.log('Updating %s component', comp_key)

    _(comp)
    .mapValues(function(plugin, key) {
        switch(comp_key) {
          case "integration":
            switch(key) {
              case "travis":
                console.log('Installing travis plugin')
                install_plugin_travis();
                resolve();
                break;
              case "github-pages":
                console.log('TODO: this should install the github-pages plugin')
                resolve();
                break;
              case "shared":
                install_shared_plugins();
                resolve();
              default:
                console.log('Unknown integration plugin. Exiting.')
                reject();
              }

//            newSettings = install_integration(plugin, gh_token, curSettings)
            break;
          default:
            console.log('%s is not a known component. Exiting.', component);
            reject();
        }
      })
    .value();
  });
}


function install_plugin_travis() {
  if (!program.gh_token) {
    if (!process.env.GH_TOKEN && !program.test) {
      console.log('Travis requires a Github Authentication Token in order to publish your website to Github Pages')
      console.log('The GH_TOKEN environment variable needs to be set, or the --gh-token option needs to be used.')
      process.exit(1);
    } else {
      gh_token = process.env.GH_TOKEN
    }
  } else {
    gh_token = program.gh_token 
  }

  // Install and check necessary files - .travis.yml 
  //
  // For now this is a blend of trying to generate files, do idempotent file check a la ansible
  // and just copying template files.
  //
  // Later for moving between configurations, things might be different. Using npm build for now.
  //
  // Maybe this should be parameterised to be able to change build system and compose different components.
  // One of the big factors is if there is a linear build pipe a la metalsmith, or if we have a tree which will
  // necessitate more of a Make or equivalent approach.

  create_travis_yml(gh_token)
    .then(jekyll_config('integration/travis/_config.yml', '_config.yml'))
    .then(npm_build('integration/travis/npm_build.yml', 'package.json'))
    .then(function() {
      console.log('You have just installed travis')          
      console.log('You will need to:')      
      console.log(' - Push this folder to your repo (soon with `docsmith save`)')      
      console.log(' - Activate travis for your repository')
    }).catch(
    // Log the rejection reason
    function(reason) {
      console.log('Problem installing the travis build component')
      console.log(reason);
      process.exit(1)
    });
}

function create_travis_yml(gh_token, resolve, reject) {
  return new Promise(function(resolve,reject) {
            // This builds the yaml in memory including the secure token and writes the file
            // It could also use a moustache style template in integration/travis/.travis.yml

            // TODO: Refactor to separate file merge from token generation. Use Object.assign approach like for npm_build.

    var travis_yml = yaml.safeLoad(fs.readFileSync(path.join(templates.path, 'integration/travis/.travis.yml'), 'utf8'));

    var git_name, git_email;

    var promise_name = git.Config.openDefault()
      .then(function(config) {
        return config.getString("user.name");
      }).catch(function(err) {
        console.log("Problem with git configuration. Have set your user.email? You can use:")
        console.log("git config user.name 'Your Name'")
        console.log(err)
      });

    var promise_email = git.Config.openDefault()
      .then(function(config) {
        return config.getString("user.email");
      }).catch(function(err) {
        console.log("Problem with git configuration. Have set your user.email? You can use:")
        console.log("git config user.email 'you@email.net'")
        console.log(err)
      });

    return Promise.all([ promise_name, promise_email ] )
      .then(function(values) {

        var token = "TOKEN";

        git_name = process.env.GIT_NAME || values[0]
        git_email = process.env.GIT_EMAIL || values[1]    

        travis_yml.env.global = [];

        travis_yml.env.global.push('GH_USERNAME=' + process.env.GH_USERNAME);
        travis_yml.env.global.push('CONFIG_OWNER=' + process.env.CONFIG_OWNER);
        travis_yml.env.global.push('CONFIG_REPO=' + process.env.CONFIG_REPO);

        // Generate the travis encrypted variable to access Github.      
        try {
          if (!curSettings.offline && !program.test) {
            //console.log("travis encrypt \'GIT_NAME=\"" + git_name + "\" GIT_EMAIL=\"" + git_email + "\" GH_TOKEN=\"" + gh_token + "\"\'")
            var stdout = cp.execSync("travis encrypt \'GIT_NAME=\"" + git_name + "\" GIT_EMAIL=\"" + git_email + "\" GH_TOKEN=\"" + gh_token + "\"\'")
            token = stdout.toString()
          }
          travis_yml.env.global.push({ secure: token });
        } catch (e) {
          console.log('You need to have a working ruby environment and have installed the travis gem with `gem install travis`')
          reject(e);
        }

        // write the .travis.yml file.
        try {
          fs.writeFileSync('./.travis.yml', yaml.safeDump(travis_yml), 'utf8')
          resolve();
        } catch (e) {
          reject(e);
        }

      })
      .catch(function(err) {
        console.log(err)
      });
    });
}

function lineinfile(dest, line) {
  return new Promise(function(resolve,reject) {
    // mimicking ansible lineinfile module API with state=present
    fs.readFile(dest, function (err, data) {
      if (err) reject(err);
      if(data.toString().indexOf(line) > -1){
        // Should use ansible regexp feature to deal with versions. 
        resolve();
      } else {
        fs.appendFile(dest, "\n" + line, function (err) {
          if (err) reject();
          console.log(dest + " " + line + " added.")
          resolve();
        });
      }
    });
  });
}

function npm_build(src, dest) {

  return new Promise(function(resolve,reject) {
    var npm_build = yaml.safeLoad(fs.readFileSync(path.join(templates.path, src), 'utf8'));

    // what if there is no package.json?
    fs.readFile(dest, function (err, data) {
      var package = {};
      if (err) {
        if (err.code != 'ENOENT') {
          reject(err);
          return;
        } 
      } else {
        package = JSON.parse(data.toString());        
      }

      fs.writeFile(dest, JSON.stringify(Object.assign(package, npm_build), null, '  '), 'utf8', function (err) {
        if (err) reject(err);
        console.log(dest + " updated")
        resolve();
      })
    })
  })
}

function jekyll_config(src, dest) {

  return new Promise(function(resolve,reject) {
    var jekyll_config = yaml.safeLoad(fs.readFileSync(path.join(templates.path, src), 'utf8'));

    fs.readFile(dest, function (err, data) {
      var _config = {};
      if (err) {
        if (err.code != 'ENOENT') {
          reject(err);
          return;
        } 
      } else {
        _config = yaml.safeLoad(data.toString());
      }

      jekyll_config.url = 'http://' + process.env.CONFIG_OWNER + '.github.io';
      jekyll_config.baseurl = '/' + process.env.CONFIG_REPO;
      jekyll_config.github.repo = 'https://github.com/' + process.env.CONFIG_OWNER + '/' + process.env.CONFIG_REPO;

      fs.writeFile(dest, yaml.safeDump(Object.assign(_config, jekyll_config), null, '  '), 'utf8', function (err) {
        if (err) reject(err);
        console.log(dest + " updated")
        resolve();
      })
    })
  })
}


function copyfile(src, dest) {

    // fs.copySync(path.join(templates.path, src), path.join(process.cwd(), src));

  return new Promise(function(resolve,reject) {
    fs.copy(path.join(templates.path, src), path.join(process.cwd(), dest), function (err) {
      if (err) reject(err);
      console.log(path.join(templates.path, src) + " copied in " + path.join(process.cwd(), src))
      resolve();
    })    
  })
}


