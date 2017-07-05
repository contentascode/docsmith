const execFile = require('child_process').execFile;
const path = require('path');
const git = require('nodegit');
const fs = require('fs');
const assert = require('assert');

const helpers = require('../support/helpers');
const normalizeText = helpers.normalizeText;
const getAdditionalErrorText = helpers.getAdditionalErrorText;

module.exports = function() {
  this.Given(/^I clone the contentascode "([^"]*)" branch$/, { timeout: 10000 }, function(branch, callback) {
    const world = this;

    const url = 'https://github.com/iilab/contentascode';
    const clonePath = path.join(world.tmpDir, 'proj');

    function options() {
      const nodegitOptions = {
        checkoutBranch: branch,
        fetchOpts: {
          callbacks: {
            certificateCheck() {
              return 1;
            }
          }
        }
      };

      return nodegitOptions;
    }

    // Clone a given repository into a temporary folder.
    git
      .Clone(url, clonePath, options())
      // Look up this known commit.
      .then(function(repo) {
        //      console.log(repo instanceof git.Repository);
        //      console.log('hi!')
        console.log('repo', repo);
        callback();
      })
      .catch(function(err) {
        callback(err);
      });
  });

  this.Given(/^I run "([^"]*)"$/, { timeout: 100000 }, function(command, callback) {
    const executable = command.split(' ')[0];
    command = command.split(' ').slice(1);
    const world = this;
    const cwd = path.join(world.tmpDir, 'proj');

    if (!folderExists(cwd)) {
      fs.mkdirSync(cwd);
    }

    execFile(executable, command, { cwd, env: process.env }, function(error, stdout, stderr) {
      world.lastRun = {
        error,
        stdout, //colors.strip(stdout),
        stderr
      };
      if (error) {
        console.log(stdout);
        console.log(stderr);
        callback(error);
      }
      callback();
    });
  });

  this.Then(/^I should( not)? see "([^"]*)"$/, function(negate, text) {
    // Write code here that turns the phrase above into concrete actions
    assert.equal(
      this.lastRun.stdout.indexOf(text) > -1,
      !negate,
      'Expected output to contain the following:\n' +
        text +
        '\n' +
        'Got:\n' +
        normalizeText(this.lastRun.stdout) +
        '\n' +
        getAdditionalErrorText(this.lastRun)
    );
  });

  this.Then(/^I should( not)? have a "([^"]*)" file$/, function(negate, file) {
    assert.equal(fileExists(path.join(this.tmpDir, 'proj', file)), !negate);
  });

  this.Then(/^I should( not)? have a "([^"]*)" folder$/, function(negate, file) {
    assert.equal(
      folderExists(path.join(this.tmpDir, 'proj', file)),
      !negate,
      'Expected folder ' + file + ' to ' + (negate ? 'not exist' : 'exit') + '\n' + getAdditionalErrorText(this.lastRun)
    );
  });

  this.Then(/^I should have a "([^"]*)" file with(out)? "([^"]*)"$/, function(file, negate, text, callback) {
    // Write code here that turns the phrase above into concrete actions
    const world = this;
    // const cwd = path.join(world.tmpDir, 'repo');
    const absoluteFilePath = path.join(world.tmpDir, 'proj', file);
    fs.readFile(absoluteFilePath, 'utf8', function(err, content) {
      if (err) {
        return callback(err);
      }

      const fileContent = normalizeText(content);
      const expectedContent = normalizeText(text);

      assert.equal(fileContent.indexOf(expectedContent) > -1, !negate);
      callback();
    });
  });

  function fileExists(filePath) {
    try {
      return fs.statSync(filePath).isFile();
    } catch (err) {
      return false;
    }
  }

  function folderExists(folderPath) {
    try {
      return fs.statSync(folderPath).isDirectory();
    } catch (err) {
      return false;
    }
  }
};
