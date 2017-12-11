#!/usr/bin/env node

/**
 * Module dependencies.
 */
require('source-map-support').install();
const debug = require('debug')('docsmith:config');
const program = require('commander');
const toYaml = require('js-yaml').dump;
const { banner, exit, promptConfirm, promptNew } = require('./docsmith/utils/terminal');
const settings = require('./docsmith/utils/settings');
const configure = require('./docsmith/configure');

let command;

program
  .arguments('[command]')
  .action(function(cmd) {
    command = cmd;
  })
  .parse(process.argv);

// const { help } = program;
//
// debug('help', help);
//
// if (help) {
//   console.log('config      : Same as config show');
//   console.log('config show : Display current config');
//   console.log('config init : Ensures configuration of current workspace is valid.');
//   // config set
//   // config get
//   exit();
// }
//
// ~~check if this is an empty folder.~~
// Check if the folder contains a folder for this instance.
// Also check if that instance is git initialise, and if not upgrade it.

const doConfigShow = async () => {
  const configuration = await configure.doGet();
  // debug('configuration', JSON.stringify(configuration, true, 2));
  if (configuration) {
    banner({
      title: 'Config',
      message: toYaml(configuration)
    });
  } else {
    debug('settings', settings);
    banner({
      title: 'Config',
      message:
        'No configuration found. Run `' +
        settings.instance +
        ' init` in a folder to initiliase it as your workspace.' +
        '\n' +
        '\n'
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

debug('command', command);
if (command === undefined || command === 'show') {
  doConfigShow().catch(e => {
    exit('The config show function terminated with an error.', e);
  });
} else if (command === 'init') {
  doConfigInit().catch(e => {
    exit('The init function terminated with an error.', e);
  });
} else {
  exit('Unrecognised command.', new Error());
}

// export { doConfigInit, doConfigShow };
