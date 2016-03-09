module.exports = function () {

  var execFile = require('child_process').execFile;
  var path = require('path');
  var git = require("nodegit");
  var fs = require('fs');
  var assert = require('assert')

  var executablePath = path.join(__dirname, '..', '..', 'docsmith.js');

  this.Given(/^I clone the contentascode "([^"]*)" branch$/,  {timeout: 30000}, function (branch, callback) {
    var world = this;

    var url = "https://github.com/iilab/contentascode";
    var clonePath = path.join(world.tmpDir, "repo");

    function options(){
        var nodegitOptions = {
            checkoutBranch: branch,
            fetchOpts: {
              callbacks: {
                certificateCheck: function() {
                  return 1;
              }
            }
          }
        };

        return nodegitOptions;
    }

    // Clone a given repository into a temporary folder.
    git.Clone(url, clonePath, options())
    // Look up this known commit.
    .then(function(repo) {
//      console.log(repo instanceof git.Repository);
//      console.log('hi!')
      callback();
    })
    .catch(function(err) { console.log(err); });
  });

  this.Given(/^I run docsmith "([^"]*)"$/, {timeout: 20000}, function (command, callback) {

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

  this.Then(/^I should( not)? have a "([^"]*)" file$/, function (negate, file) {
    console.log(fileExists())
    console.log(!negate)

    assert(fileExists(), !negate);
    callback();
  });

  this.Then(/^I should( not)? have a "([^"]*)" file with "([^"]*)"$/, function (negate, file, text, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^I should see "([^"]*)"$/, function (text, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  function fileExists(filePath)
  {
      try
      {
          return fs.statSync(filePath).isFile();
      }
      catch (err)
      {
          return false;
      }
  }

};