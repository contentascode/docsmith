module.exports = function () {

  var execFile = require('child_process').execFile;
  var path = require('path');
  var git = require("nodegit");

  var executablePath = path.join(__dirname, '..', '..', 'docsmith.js');

  this.Given(/^I clone the contentascode "([^"]*)" branch$/,  {timeout: 10000}, function (branch, callback) {
    var world = this;
    var cloneOptions = {};

    cloneOptions.fetchOpts = {
      checkoutBranch : branch,
      callbacks: {
        certificateCheck: function() { return 1; }
      }
    };

    // Clone a given repository into a temporary folder.
    git.Clone("https://github.com/iilab/contentascode", path.join(world.tmpDir, "repo"), cloneOptions)
    // Look up this known commit.
    .then(function(repo) {
      console.log('hi!')
      callback();
    })
    .catch(function(err) { console.log(err); });
  });

  this.Given(/^I run docsmith "([^"]*)"$/, {timeout: 10000}, function (command, callback) {

    command = command || '';
    var world = this;
    var cwd = path.join(world.tmpDir, "repo");

    execFile(executablePath, command.split(' '), {cwd: cwd}, function (error, stdout, stderr) {
       world.lastRun = {
         error:  error,
         stdout: stdout, //colors.strip(stdout),
         stderr: stderr
       };
       callback();
     });

  });

  this.Then(/^I should not have a "([^"]*)" file$/, function (arg1, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^I should not have a "([^"]*)" with "([^"]*)"$/, function (arg1, arg2, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^I should not have a "([^"]*)"$/, function (arg1, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^I should see "([^"]*)"$/, function (arg1, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Given(/^I start with docsmith init$/, function (callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^I should have a "([^"]*)" file$/, function (arg1, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^I should have a "([^"]*)" with "([^"]*)"$/, function (arg1, arg2, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^I should have a "([^"]*)"$/, function (arg1, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });


};