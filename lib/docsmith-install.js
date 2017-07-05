#!/usr/bin/env node
'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var program = require('commander');
var templates = require('./docsmith/templates');
var settings = require('./docsmith/settings');
// const components = require('./docsmith/components');
var yaml = require('js-yaml');
var fs = require('fs-extra');
var path = require('path');
var exec = require('child_process').execFile;

var cp = require('child_process');
var git = require('nodegit');

var curSettings = settings.settings;

var component = void 0,
    gh_token = void 0;

program.description('install one or more components with their default settings or a specific plugin').option('--git-name <git_name>', 'Overrides the current git user name or GIT_NAME env variable for the travis plugin').option('--git-email <git_email>', 'Overrides the current git email or GIT_EMAIL env variablefor the travis plugin').option('--gh-token <github_token>', 'Overrides GH_TOKEN env variable for the travis plugin').option('--test', 'Bypasses specific tasks for test runs').arguments('[component] [plugin]').action(function (comp, plug, options) {
  // Temporary fix for https://github.com/tj/commander.js/issues/508
  if (options.test && plug) {
    plugin = comp;
    component = plug;
  } else {
    component = comp;
    plugin = plug;
  }
}).parse(process.argv);

var newSettings = void 0,
    plugin = void 0;

if (!curSettings.integrate) curSettings.integrate = {};

switch (component) {
  case 'travis':
    {
      // TODO: Check if there are any needed updates. This should probably just be a call to a trusted build system
      // For now just rerun configuration creation all the time.

      // if (!(plugin in curSettings.integration)) {
      var TRUE = true;
      if (TRUE) {
        curSettings.integrate.travis = settings.DEFAULT_TRAVIS;

        if (!program.gh_token) {
          if (!process.env.GH_TOKEN && !program.test) {
            console.log('Travis requires a Github Authentication Token in order to publish your website to Github Pages');
            console.log('The GH_TOKEN environment variable needs to be set, or the --gh-token option needs to be used.');
            process.exit(1);
          } else {
            gh_token = process.env.GH_TOKEN;
          }
        } else {
          gh_token = program.gh_token;
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

        create_travis_yml(gh_token).then(jekyll_config('../lib/components/travis/_config.yml', '_config.yml')).then(npm_build('../lib/components/travis/npm_build.yml', 'package.json')).then(function () {
          console.log('You have just installed travis');
          console.log('You will need to:');
          console.log(' - Push this folder to your repo (soon with `content save`)');
          console.log(' - Activate travis for your repository');
        }).catch(
        // Log the rejection reason
        function (reason) {
          console.log('Problem installing the travis build component');
          console.log(reason);
          process.exit(1);
        });

        newSettings = curSettings;
      }

      break;
    }
  case 'github-pages':
    {
      if (!(plugin in curSettings.integrate)) {
        curSettings.integrate.travis = settings.DEFAULT_GITHUB_PAGES;
        newSettings = curSettings;
      }
      break;
    }
  case 'validate':
    {
      switch (plugin) {
        case 'links':
          {
            console.log('Not implemented yet');
            process.exit();
            break;
          }
        default:
          {
            if (curSettings.integrate == {}) {
              console.log('Current integration plugin configuration is');
              console.log(curSettings.integrate);
              process.exit();
            } else {
              console.log('No integration plugin currently installed. Please specify a plugin to install a build component.');
              console.log('For instance to enable the travis plugin use :');
              console.log('$ content install travis');
              process.exit();
            }
          }
      }
      var install_integration = function install_integration() {
        //TODO
        return;
      };
      newSettings = install_integration(plugin, gh_token, curSettings);
      break;
    }
  // default:
  //   console.log('%s is not a known component.', component);
  //   process.exit();
}

// update settings file.

if (newSettings) {
  settings.save(newSettings);
  console.log('Saved new component');
  //console.log(newSettings.integration)
} else {
  // TODO Check that currently installed plugin configuration is sane.
  console.log('No modifications. Current settings are');
  console.log(curSettings);
}

function create_travis_yml(gh_token) {
  return new Promise(function (resolve, reject) {
    // This builds the yaml in memory including the secure token and writes the file
    // It could also use a moustache style template in integration/travis/.travis.yml

    // TODO: Refactor to separate file merge from token generation. Use Object.assign approach like for npm_build.

    var travis_yml = yaml.safeLoad(fs.readFileSync(path.join(templates.path, '../lib/components/travis/.travis.yml'), 'utf8'));

    var git_name = void 0,
        git_email = void 0;

    var promise_name = git.Config.openDefault().then(function (config) {
      return config.getString('user.name');
    }).catch(function (err) {
      console.log('Problem with git configuration. Have set your user.email? You can use:');
      console.log("git config user.name 'Your Name'");
      console.log(err);
    });

    var promise_email = git.Config.openDefault().then(function (config) {
      return config.getString('user.email');
    }).catch(function (err) {
      console.log('Problem with git configuration. Have set your user.email? You can use:');
      console.log("git config user.email 'you@email.net'");
      console.log(err);
    });

    return Promise.all([promise_name, promise_email]).then(function (values) {
      var token = 'TOKEN';

      git_name = process.env.GIT_NAME || values[0];
      git_email = process.env.GIT_EMAIL || values[1];

      travis_yml.env.global = [];

      travis_yml.env.global.push('GH_USERNAME=' + process.env.GH_USERNAME);
      travis_yml.env.global.push('CONFIG_OWNER=' + process.env.CONFIG_OWNER);
      travis_yml.env.global.push('CONFIG_REPO=' + process.env.CONFIG_REPO);

      // Generate the travis encrypted variable to access Github.
      try {
        if (!curSettings.offline && !program.test) {
          //console.log("travis encrypt \'GIT_NAME=\"" + git_name + "\" GIT_EMAIL=\"" + git_email + "\" GH_TOKEN=\"" + gh_token + "\"\'")
          var stdout = cp.execSync('travis encrypt \'GIT_NAME="' + git_name + '" GIT_EMAIL="' + git_email + '" GH_TOKEN="' + gh_token + '"\'');
          token = stdout.toString();
        }
        travis_yml.env.global.push({ secure: token });
        resolve();
      } catch (e) {
        console.log('You need to have a working ruby environment and have installed the travis gem with `gem install travis`');
        reject(e);
      }

      // write the .travis.yml file.
      try {
        fs.writeFileSync('./.travis.yml', yaml.safeDump(travis_yml), 'utf8');
        resolve();
      } catch (e) {
        reject(e);
      }
    }).catch(function (err) {
      console.log(err);
    });
  });
}

// function lineinfile(dest, line) {
//   return new Promise(function(resolve, reject) {
//     // mimicking ansible lineinfile module API with state=present
//     fs.readFile(dest, function(err, data) {
//       if (err) reject(err);
//       if (data.toString().indexOf(line) > -1) {
//         // Should use ansible regexp feature to deal with versions.
//         resolve();
//       } else {
//         fs.appendFile(dest, '\n' + line, function(err) {
//           if (err) reject();
//           console.log(dest + ' ' + line + ' added.');
//           resolve();
//         });
//       }
//     });
//   });
// }

function npm_build(src, dest) {
  var load_npm_build_yaml = new Promise(function (resolve) {
    resolve(yaml.safeLoad(fs.readFileSync(path.join(templates.path, src), 'utf8')));
  });

  var read_package_json = function read_package_json(yaml) {
    var check_package_json = new Promise(function (resolve, reject) {
      fs.stat(dest, function (err, stats) {
        if (err) {
          resolve(false);
        } else if (stats.isFile()) {
          resolve(true);
        } else {
          reject(dest + ' is not a file');
        }
      });
    });

    return new Promise(function (resolve, reject) {
      function promiseFromChildProcess(child) {
        return new Promise(function (resolve, reject) {
          child.addListener('error', reject);
          child.addListener('exit', resolve);
        });
      }

      var child = exec('npm', ['init', '-f'], { env: process.env });

      // promiseFromChildProcess(child).then(function (result) {
      //     console.log('promise complete: ' + result);
      // }, function (err) {
      //     console.log('promise rejected: ' + err);
      // });

      // child.stdout.on('data', function (data) {
      //     console.log('stdout: ' + data);
      // });
      // child.stderr.on('data', function (data) {
      //     console.log('stderr: ' + data);
      // });
      // child.on('close', function (code) {
      //     console.log('closing code: ' + code);
      // });

      return check_package_json.then(function (exists) {
        if (!exists) {
          // console.log(dest + ': does not exist!')
          return promiseFromChildProcess(child);
        }
      }).then(function () {
        fs.readFile(dest, function (err, data) {
          if (err) reject(err);
          console.log(dest + ': exists!');
          var pkg = JSON.parse(data.toString());
          pkg.author = pkg.author || 'Unknown';
          resolve([yaml, pkg]);
        });
      });
    });
  };

  // Not using bluebird and spread yet...
  var write_package_json = function write_package_json(val) {
    return new Promise(function (resolve, reject) {
      fs.writeFile(dest, JSON.stringify(_.merge(val[1], val[0]), null, '  '), 'utf8', function (err) {
        if (err) reject(err);
        console.log(dest + ' updated');
        resolve();
      });
    });
  };

  return load_npm_build_yaml.then(read_package_json).then(write_package_json);
}

function jekyll_config(src, dest) {
  return new Promise(function (resolve, reject) {
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
      jekyll_config.github.repository_url = 'https://github.com/' + process.env.CONFIG_OWNER + '/' + process.env.CONFIG_REPO;

      fs.writeFile(dest, yaml.safeDump(_.merge(_config, jekyll_config), null, '  '), 'utf8', function (err) {
        if (err) reject(err);
        console.log(dest + ' updated');
        resolve();
      });
    });
  });
}

// function copyfile(src, dest) {
//   // fs.copySync(path.join(templates.path, src), path.join(process.cwd(), src));
//
//   return new Promise(function(resolve, reject) {
//     fs.copy(path.join(templates.path, src), path.join(process.cwd(), dest), function(err) {
//       if (err) reject(err);
//       console.log(path.join(templates.path, src) + ' copied in ' + path.join(process.cwd(), src));
//       resolve();
//     });
//   });
// }
//# sourceMappingURL=docsmith-install.js.map