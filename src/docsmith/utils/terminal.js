const debug = require('debug')('docsmith:terminal');
const chalk = require('chalk');
const promzard = require('promzard');
global.Promise = require('bluebird');
const prompt = global.Promise.promisify(promzard);
const path = require('path');
const settings = require('./settings');

const pad = (string, char, length) => (string + char.repeat(length)).slice(0, length);

const banner = ({ title, message }) => {
  console.log(
    '\n' +
      '\n' +
      chalk.grey('============================================================================') +
      '\n' +
      chalk.grey('===========                                                      ===========') +
      '\n' +
      chalk.grey('===========') +
      '            ' +
      pad((settings.description || settings.instance) + ' ' + title, ' ', 42) +
      chalk.grey('===========') +
      '\n' +
      chalk.grey('===========                                                      ===========') +
      '\n' +
      chalk.grey('============================================================================') +
      '\n' +
      '\n' +
      message +
      '\n' +
      chalk.yellow('Hit Ctrl-C at any time to exit.') +
      '\n'
  );
};

const promptConfirm = async ({ non_interactive }) => {
  debug('non_interactive', non_interactive);
  const confirmation = path.resolve(__dirname, './prompts/confirmation.js');
  debug('confirmation', confirmation);
  try {
    const { confirm: confirmed } = await prompt(confirmation, { non_interactive });
    debug('confirmed', confirmed);
    if (!confirmed) {
      exit("User didn't confirm. Exiting.");
    } else {
      return confirmed;
    }
  } catch (e) {
    if (e.message === 'canceled') {
      exit('User canceled. Exiting.');
    } else {
      throw e;
    }
  }
};

const promptRepository = async ({ non_interactive, default_path }) => {
  debug('non_interactive', non_interactive);
  const content_repository = path.resolve(__dirname, './prompts/content_repository.js');
  debug('content_repository', content_repository);
  try {
    const { repository } = await prompt(content_repository, {
      non_interactive,
      default_path
    });
    return { repository };
  } catch (e) {
    if (e.message === 'canceled') {
      exit('User canceled. Exiting.');
    } else {
      throw e;
    }
  }
};

const promptWorkspace = async ({ non_interactive, default_path }) => {
  debug('non_interactive', non_interactive);
  const workspace = path.resolve(__dirname, './prompts/workspace.js');
  debug('workspace', workspace);
  try {
    const { confirm } = await prompt(workspace, {
      non_interactive,
      default_path
    });
    return { confirm };
  } catch (e) {
    if (e.message === 'canceled') {
      exit('User canceled. Exiting.');
    } else {
      throw e;
    }
  }
};

const promptNew = async ({ non_interactive, default_name, default_template, templates }) => {
  debug('non_interactive', non_interactive);
  const creation = path.resolve(__dirname, './prompts/creation.js');
  debug('creation', creation);
  try {
    const { name, template } = await prompt(creation, {
      non_interactive,
      default_name,
      default_template,
      templates
    });
    debug('name', name);
    debug('template', template);
    return { name, template };
  } catch (e) {
    if (e.message === 'canceled') {
      exit('User canceled. Exiting.');
    } else {
      throw e;
    }
  }
};

const exit = (message, error) => {
  {
    if (error) {
      console.log('error', error);
      console.log(chalk.red('\n' + message + '\n'));
      console.log(
        chalk.grey('\n=============================================================================\n\n') +
          chalk.red(
            'Please alert the developer by submitting an issue \nat https://github.com/contentascode/safetag/issues and copy the whole output of the command above.\n\nApologies for the inconvenience!\n'
          )
      );
      process.exit(1);
    } else {
      console.log(chalk.grey('\n'));
      console.log(chalk.grey('\n' + message + '\n'));
      console.log(chalk.grey('\n============================================================================\n\n'));
      process.exit(0);
    }
  }
};

export { banner, promptConfirm, promptRepository, promptWorkspace, promptNew, exit };
