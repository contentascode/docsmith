const debug = require('debug')('docsmith:init');
const fs = require('fs-extra');
const read = require('fs').readFileSync;
const path = require('path');
// var npmi = require('npmi');
const yaml = require('js-yaml').safeLoad;

const chalk = require('chalk');
require('longjohn');

const packages = require('./packages');
const workspaces = require('./workspaces');

const pad = (string, char, length) => string + char.repeat(length - string.length);

function init({ template, config, link, defaults }) {
  // Content as code CLI tool (i.e. not the bare `content` command)
  fs.pathExists(path.join(config, './content.yml'), (err, exists) => {
    if (err) return exit('Error while checking if content.yml exists', err); // => null
    if (exists) {
      // There is a content.yml file.
      if (template) {
        // TODO: Deal with instance templates
        return exit('\nError while initialising: template instances are not yet supported');
      }
      const promzard = require('promzard');
      const file = path.resolve(__dirname, './utils/prompt.js');
      const content = yaml(read(path.join(config, './content.yml'), 'utf8'));

      console.log(
        '\n' +
          '\n' +
          chalk.grey('============================================================================') +
          '\n' +
          chalk.grey('===========                                                      ===========') +
          '\n' +
          chalk.grey('===========') +
          '            ' +
          pad(content.name + ' Initialisation', ' ', 42) +
          chalk.grey('===========') +
          '\n' +
          chalk.grey('===========                                                      ===========') +
          '\n' +
          chalk.grey('============================================================================') +
          '\n' +
          '\n' +
          'This script will initialise the current directory as your workspace.' +
          '\n' +
          '\n' +
          'It will also update your global `.content` repository' +
          '\n' +
          'and install the following content packages and their dependencies:' +
          '\n' +
          '\n' +
          Object.keys(content.packages).map(repo => '\t' + repo + ': ' + content.packages[repo] + '\n') +
          '\n' +
          "Please answer a few questions below and you'll be up and running in no time" +
          '\n' +
          '\n' +
          chalk.yellow(
            'NOTE: This is a prototype, please accept defaults by hitting enter\n or hit Ctrl-C at any time to exit.'
          ) +
          '\n'
      );

      promzard(file, { content, defaults }, (err, responses) => {
        if ((err && err.message == 'canceled') || (responses && responses.confirm !== 'yes')) {
          console.log('\nExiting without initialising. See ya!');
          process.exit(0);
        }
        if (err) exit('Error while processing prompt results', err);

        if (fs.existsSync(responses.repository)) {
          debug('> Content repository folder already exists. Continuing.');
        } else {
          debug('> Content repository folder does not exists. Creating folder.');
          fs.mkdirSync(responses.repository);
          debug('> Content repository ' + responses.repository + ' has been created.');
        }

        if (fs.existsSync(path.join(responses.repository, 'package.json'))) {
          debug('> Content repository configuration file already exists. Continuing.');
        } else {
          debug('> Content repository configuration file does not exists. Creating.');
          fs.writeFileSync(path.join(responses.repository, 'package.json'), JSON.stringify({ private: true }), 'utf-8');
          debug('> Content repository configuration ' + responses.repository + '/package.json has been created.');
        }

        // Change working directory temporarily as npm api is insufficient.
        const current = process.cwd();
        try {
          process.chdir(responses.repository);
        } catch (err) {
          exit('\nError while changing directory', err);
        }
        packages.install({ repos: content.packages, repository: responses.repository, link }, (err, installed) => {
          if (err) return exit('\nError while installing packages', err);
          // console.log('Content packages installed:' + JSON.stringify(installed));
          // Deploying worksaces

          // restore working directory
          try {
            process.chdir(current);
          } catch (err) {
            exit('\nError while changing directory', err);
          }

          workspaces.deploy(
            installed.map(({ name, content: { workspace } }) => ({ name, workspace })),
            responses.repository,
            (err, deployed) => {
              if (err) exit('\nError while deploying workspaces', err);
              debug('deployed', deployed);

              console.log(
                '\n' +
                  chalk.grey('============================================================================') +
                  '\n' +
                  chalk.grey('===========                                                      ===========') +
                  '\n' +
                  chalk.grey('===========') +
                  '        Initialisation complete.                      ' +
                  chalk.grey('===========') +
                  '\n' +
                  chalk.grey('===========') +
                  '         - use ' +
                  chalk.yellow('safetag start') +
                  ' to open the toolkit      ' +
                  chalk.grey('===========') +
                  '\n' +
                  chalk.grey('===========                                                      ===========') +
                  '\n' +
                  chalk.grey('============================================================================') +
                  '\n'
              );

              // I'll want to save the location of the workspace to the content repo to allow
              // launching `safetag start` from anywhere.

              return;
            }
          );
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
      console.error(
        'Error: CLI tool does not have a content.yml configuration file. Please report the error to the developer.'
      );
      process.exit(1, '');
    }
  });
}

const exit = (message, error) => {
  {
    console.log(chalk.red('\n' + message + '\n'));
    if (error) console.log('error', error);
    console.log(
      chalk.grey('\n==================================================================\n\n') +
        chalk.red(
          'Please alert the developer by submitting an issue \nat https://github.com/contentascode/safetag/issues and copy the whole output of the command above.\n\nApologies for the inconvenience!\n'
        )
    );
    process.exit(0);
  }
};

module.exports.init = init;
