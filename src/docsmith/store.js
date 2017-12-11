const debug = require('debug')('docsmith:store');
const fs = require('fs-extra');
const read = require('fs').readFileSync;
const path = require('path');

const omit = require('lodash').omit;
const yaml = require('js-yaml');

global.Promise = require('bluebird');
global.Promise.promisifyAll(fs);

const chalk = require('chalk');

const configure = require('./configure');
const { doCheck, doClone, doInfo } = require('./utils/git');
const { doWorkspaceCheck } = require('./workspace');
const settings = require('./utils/settings');

// Default to creating global ~/.content and link it to current workspace. (Using this as a workspace detection feature).
// Register workspace in `.content/content.yml` file.
// Allow multi configuration (for development, isolation) by reading the relative `.content` folder.

// `configure`: Check if configure. Creates .content and clone, and checks out tag.
// `store/create`: Creates and checks out new personal work branch
// `package/check`: Checks npm for new release.
// `store/update`: Asks for update (rebase).
// `configure/default`: Ask to make default

const doNew = async ({ name, template, branch, configuration }) => {
  if (!configuration) {
    configuration = await configure.doGet();
  }
  // Does name exist?
  //   - if yes, then output with a message.
};

const doLoad = async ({ name, branch }) => {
  // Does name exist?
  //   - if not, then output with a message
  // Does branch exit?
  //   - if not, output with a message
};

export { doNew, doLoad };
