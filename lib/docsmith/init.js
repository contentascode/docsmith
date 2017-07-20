'use strict';

var debug = require('debug')('docsmith:init');
var fs = require('fs-extra');
var read = require('fs').readFileSync;
var path = require('path');
// var npmi = require('npmi');
var yaml = require('js-yaml').safeLoad;

var chalk = require('chalk');
require('longjohn');

var settings = require('./utils/settings');
var packages = require('./init/packages');
var workspaces = require('./init/workspaces');

var pad = function pad(string, char, length) {
  return (string + char.repeat(length)).slice(0, length);
};

function init(_ref) {
  var template = _ref.template,
      config = _ref.config,
      link = _ref.link,
      defaults = _ref.defaults,
      verbose = _ref.verbose;

  // Content as code CLI tool (i.e. not the bare `content` command)
  fs.pathExists(path.join(config, './content.yml'), function (err, exists) {
    if (err) return exit('Error while checking if content.yml exists', err); // => null
    if (exists) {
      // There is a content.yml file.
      if (template) {
        // TODO: Deal with instance templates
        return exit('\nError while initialising: template instances are not yet supported');
      }
      var promzard = require('promzard');
      var file = path.resolve(__dirname, './utils/prompt.js');
      var content = yaml(read(path.join(config, './content.yml'), 'utf8'));

      console.log('\n' + '\n' + chalk.grey('============================================================================') + '\n' + chalk.grey('===========                                                      ===========') + '\n' + chalk.grey('===========') + '            ' + pad((settings.description || settings.instance) + ' Initialisation', ' ', 42) + chalk.grey('===========') + '\n' + chalk.grey('===========                                                      ===========') + '\n' + chalk.grey('============================================================================') + '\n' + '\n' + 'This script will initialise the current directory as your workspace.' + '\n' + '\n' + 'It will also update your global `.content` repository' + '\n' + 'and install the following content packages and their dependencies:' + '\n' + '\n' + Object.keys(content.packages).map(function (repo) {
        return '\t' + repo + ': ' + content.packages[repo] + '\n';
      }) + '\n' + "Please answer a few questions below and you'll be up and running in no time" + '\n' + '\n' + chalk.yellow('NOTE: This is a prototype, please accept defaults by hitting enter\n or hit Ctrl-C at any time to exit.') + '\n');

      promzard(file, { content, defaults }, function (err, responses) {
        if (err && err.message == 'canceled' || responses && responses.confirm !== 'yes') {
          console.log('\nExiting without initialising. See ya!');
          process.exit(0);
        }
        if (err) exit('Error while processing prompt results', err);

        fs.existsSync(responses.repository) || fs.mkdirSync(responses.repository);
        debug('> Content repository: ', responses.repository);

        var pkgs = path.join(responses.repository, 'packages');
        fs.existsSync(pkgs) || fs.mkdirSync(pkgs);
        debug('> Content packages directory: ', pkgs);

        // Change working directory temporarily as npm api is insufficient.
        var current = process.cwd();
        try {
          process.chdir(pkgs);
          debug('changed directory: ', pkgs);
        } catch (err) {
          exit('\nError while changing directory', err);
        }
        packages.install({ packages: content.packages, repository: responses.repository, link, verbose }, function (err, installed) {
          if (err) return exit('\nError while installing packages', err);
          // console.log('Content packages installed:' + JSON.stringify(installed));
          // Deploying worksaces

          // restore working directory
          try {
            process.chdir(current);
            debug('changed directory: ', current);
          } catch (err) {
            exit('\nError while changing directory', err);
          }

          workspaces.deploy(installed.map(function (_ref2) {
            var name = _ref2.name,
                workspace = _ref2.content.workspace;
            return { name, workspace };
          }), responses.repository, function (err, deployed) {
            if (err) exit('\nError while deploying workspaces', err);
            debug('deployed', deployed);

            console.log('\n' + chalk.grey('============================================================================') + '\n' + chalk.grey('===========                                                      ===========') + '\n' + chalk.grey('===========') + '   Initialisation complete.                           ' + chalk.grey('===========') + '\n' + chalk.grey('===========') + '   - use ' + chalk.yellow(settings.instance + ' start') + pad(' to open the ' + settings.description, ' ', 19 + (settings.instance + ' start').length) + chalk.grey('===========') + '\n' + chalk.grey('===========                                                      ===========') + '\n' + chalk.grey('============================================================================') + '\n');

            // I'll want to save the location of the workspace to the content repo to allow
            // launching `safetag start` from anywhere.

            return;
          });
        });
      });

      //   - Use `safetag-toolkit` as its default init mode.
      //   - npm install `content.yml` dependencies in `~/.content/packages`
      //   - `bootstrap`
      //     - version controlled staging directory
      //       - ask about fork origin remote.
      //         - if no entry then point to doc and setup only `upstream` remote
      //       - create git repo in `~/.content/staging/@safetag/*` for each dependent modules and publication containers.
      //       - content.yml manages versions?
      //     - working directory
      //       - render taxonomy from `content` folder in `toolkit` package. (metalsmith workspace deploy config)
    } else {
      console.error('Error: CLI tool does not have a content.yml configuration file. Please report the error to the developer.');
      process.exit(1, '');
    }
  });
}

var exit = function exit(message, error) {
  {
    console.log(chalk.red('\n' + message + '\n'));
    if (error) console.log('error', error);
    console.log(chalk.grey('\n==================================================================\n\n') + chalk.red('Please alert the developer by submitting an issue \nat https://github.com/contentascode/safetag/issues and copy the whole output of the command above.\n\nApologies for the inconvenience!\n'));
    process.exit(1);
  }
};

module.exports.run = init;
//# sourceMappingURL=init.js.map