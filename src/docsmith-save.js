#!/usr/bin/env node

/**
 * Module dependencies.
 */
require('source-map-support').install();
const debug = require('debug')('docsmith:init');
const program = require('commander');
const toYaml = require('js-yaml').safeDump;

const { banner, exit, promptConfirm, promptNew } = require('./docsmith/utils/terminal');
const settings = require('./docsmith/utils/settings');
const configure = require('./docsmith/configure');

let command;

program
  .arguments('[command]')
  .option('-h, --help', 'Displays available commands.')
  .action(function(cmd) {
    command = cmd;
  })
  .parse(process.argv);

const { help } = program;

if (help) {
  console.log('config      : Same as config show');
  console.log('config show : Display current config');
  console.log('config init : Ensures configuration of current workspace is valid.');
  // config set
  // config get
  exit();
}

// ~~check if this is an empty folder.~~
// Check if the folder contains a folder for this instance.
// Also check if that instance is git initialise, and if not upgrade it.

const doConfigShow = async () => {
  const configuration = configure.get();

  if (configuration) {
    banner({
      title: 'Config',
      message: toYaml(configuration)
    });
  } else {
    banner({
      title: 'Config',
      message: 'No configuration found. Run `' + settings.instance + ' config init` or your workspace.' + '\n' + '\n'
    });
  }
};

const doConfigInit = async () => {
  banner({
    title: 'Config',
    message:
      'This script will initialise the current directory as your workspace.' +
      '\n' +
      '\n' +
      'It will also update your global `.content` repository' +
      '\n' +
      'and install the following content packages and their dependencies:' +
      '\n' +
      '\n' +
      // Object.keys(content.packages).map(repo => '\t' + repo + ': ' + content.packages[repo] + '\n') +
      '\n' +
      "Please answer a few questions below and you'll be up and running in no time" +
      '\n'
  });
  // Loading without argument will prompt the user for the name of a new project
  // debug('non_interactive', non_interactive);
  // const { name, template } = await promptNew({ non_interactive, default_name: settings.user });
  //
  // const confirmed = await promptConfirm({ non_interactive });
  // debug('confirmed', confirmed);
  // And the name of a template.
  // const loaded = await doLoad();
  // debug('loaded', confirmed);
};

if (command === '' || command === 'show') {
  doConfigShow().catch(e => {
    exit('The show function terminated with an error.', e);
  });
} else if (command === 'init') {
  doConfigInit().catch(e => {
    exit('The init function terminated with an error.', e);
  });
}

export { doConfigInit, doConfigShow };
