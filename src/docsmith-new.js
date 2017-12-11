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
const { doNew, doLoad } = require('./docsmith/store');

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

const doNw = async () => {
  banner({
    title: 'Initialisation',
    message:
      'This script will check your configuration and initialise the current directory as your workspace.' +
      '\n' +
      "Please answer a few questions below and you'll be up and running in no time" +
      '\n'
  });

  // Loading without argument will prompt the user for the name of a new project and the name of a template.
  debug('non_interactive', non_interactive);
  const configuration = await configure.doEnsure({ non_interactive });
  debug('configuration', configuration);

  const templates = configuration.repository.instances[configuration.settings.instance].content.templates;
  debug('templates', templates);
  const default_template = Object.keys(templates)[0];
  debug('default_template', default_template);
  const { name, template, branch = configuration.user } = await promptNew({
    non_interactive,
    default_name: 'new',
    default_template,
    templates
  });

  const confirmed = await promptConfirm({ non_interactive });
  debug('confirmed', confirmed);

  // If the user confirms we create a new project
  const loaded = await doNew({ name, template, branch, configuration });
  debug('loaded', loaded);
};

doNw().catch(e => {
  exit('The new function terminated with an error.', e);
});
