const debug = require('debug')('docsmith:load');
const fs = require('fs-extra');
const read = require('fs').readFileSync;
const path = require('path');
// var npmi = require('npmi');
const yaml = require('js-yaml').safeLoad;

global.Promise = require('bluebird');

global.Promise.promisifyAll(fs);

const chalk = require('chalk');

const { doCheck, doClone } = require('./utils/git');

// Default to creating global ~/.content and link it to current workspace. (Using this as a workspace detection feature).
// Register workspace in `.content/content.yml` file.
// Allow multi configuration (for development, isolation) by reading the relative `.content` folder.

async function init({ template, config, link, defaults, verbose }) {
  // Guard against non implemented feature
  if (template) {
    // TODO: Deal with instance templates
    return exit('\nError while initialising: template instances are not yet supported');
  }

  // Check git configuration
  const resCheck = await check();
  debug('check', resCheck);

  const exists = await fs.pathExists(path.join(config, './content.yml'));
  if (exists) {
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
        pad((settings.description || settings.instance) + ' Initialisation', ' ', 42) +
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

    promzard(file, { content, defaults }, async (err, responses) => {
      if ((err && err.message == 'canceled') || (responses && responses.confirm !== 'yes')) {
        console.log('\nExiting without initialising. See ya!');
        process.exit(0);
      }
      if (err) exit('Error while processing prompt results', err);

      fs.existsSync(responses.repository) || fs.mkdirSync(responses.repository);
      debug('> Content repository: ', responses.repository);

      const pkgs = path.join(responses.repository, 'packages');
      fs.existsSync(pkgs) || fs.mkdirSync(pkgs);
      debug('> Content packages directory: ', pkgs);

      // Change working directory temporarily as npm api is insufficient.
      const current = process.cwd();
      try {
        process.chdir(pkgs);
        debug('changed directory: ', pkgs);
      } catch (err) {
        exit('\nError while changing directory', err);
      }

      // Create or overwrite package.json to enable desired folder structure
      fs.writeFileSync(
        path.join(process.cwd(), 'package.json'),
        JSON.stringify({ private: true, name: 'contentascode', version: '0.0.0' }),
        'utf-8'
      );
      debug('> Content repository configuration created: ', path.join(process.cwd(), 'package.json'));

      console.log('content', content);
      const resClone = await doClone(content.packages, content.repository);

      debug('clone', resClone);
    });
  } else {
    console.error(
      'Error: CLI tool does not have a content.yml configuration file. Please report the error to the developer.'
    );
    process.exit(1, '');
  }
}

const settings = require('./utils/settings');
const packages = require('./init/packages');
// const workspaces = require('./init/workspaces');

const pad = (string, char, length) => (string + char.repeat(length)).slice(0, length);

// This legacy function inits in a "read only" mode by using npm install on the content packages.
// Maybe best understood as a "deploy" or "static" version pinned to a set of content package versions.

async function init_ro({ template, config, link, defaults, verbose }) {
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
          pad((settings.description || settings.instance) + ' Initialisation', ' ', 42) +
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

        fs.existsSync(responses.repository) || fs.mkdirSync(responses.repository);
        debug('> Content repository: ', responses.repository);

        const pkgs = path.join(responses.repository, 'packages');
        fs.existsSync(pkgs) || fs.mkdirSync(pkgs);
        debug('> Content packages directory: ', pkgs);

        // Change working directory temporarily as npm api is insufficient.
        const current = process.cwd();
        try {
          process.chdir(pkgs);
          debug('changed directory: ', pkgs);
        } catch (err) {
          exit('\nError while changing directory', err);
        }
        packages.install(
          { packages: content.packages, repository: responses.repository, link, verbose },
          (err, installed) => {
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

            // Deploy symlinks.
            installed.forEach(({ name, content: { workspace } }) => {
              Object.keys(workspace)
                .reduce(
                  (acc, workspace) => (acc.includes(workspace.split('/')[0]) ? acc : [...acc, workspace.split('/')[0]]),
                  []
                )
                .forEach(group => {
                  try {
                    fs.ensureSymlinkSync(
                      path.join(responses.repository, 'packages', name, 'content'),
                      path.join(current, group)
                    );
                    console.log(
                      'Symlinked',
                      path.join(responses.repository, 'packages', name, 'content') + ' to ' + path.join(current, group)
                    );
                  } catch (e) {
                    exit(
                      '\nError while creating synlink from ' +
                        path.join(responses.repository, 'packages', name, 'content') +
                        ' to ' +
                        path.join(current, group),
                      e
                    );
                  }
                });
            });

            // For now, do not deploy the init workspace until the workspace approach is fleshed out.
            //
            // workspaces.deploy(
            //   installed.map(({ name, content: { workspace } }) => ({ name, workspace })),
            //   responses.repository,
            //   err => {
            //     if (err) exit('\nError while deploying workspaces', err);
            //
            //     console.log(
            //       '\n' +
            //         chalk.grey('============================================================================') +
            //         '\n' +
            //         chalk.grey('===========                                                      ===========') +
            //         '\n' +
            //         chalk.grey('===========') +
            //         '   Initialisation complete.                           ' +
            //         chalk.grey('===========') +
            //         '\n' +
            //         chalk.grey('===========') +
            //         '   - use ' +
            //         chalk.yellow(settings.instance + ' start') +
            //         pad(' to open the ' + settings.description, ' ', 19 + (settings.instance + ' start').length) +
            //         chalk.grey('===========') +
            //         '\n' +
            //         chalk.grey('===========                                                      ===========') +
            //         '\n' +
            //         chalk.grey('============================================================================') +
            //         '\n'
            //     );
            //
            //     // I'll want to save the location of the workspace to the content repo to allow
            //     // launching `safetag start` from anywhere.
            //
            //     return;
            //   }
            // );
          }
        );
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
    process.exit(1);
  }
};

module.exports.run = init;
