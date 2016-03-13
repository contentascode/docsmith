module.exports = function () {

  var execFile = require('child_process').execFile;
  var path = require('path');
  var git = require("nodegit");
  var fs = require('fs');
  var assert = require('assert')

  var executablePath = path.join(__dirname, '..', '..', 'docsmith.js');
//  var executablePath = '/usr/local/bin/node';

  this.Given(/^I clone the contentascode "([^"]*)" branch$/,  {timeout: 10000}, function (branch, callback) {
    var world = this;

    var url = "https://github.com/iilab/contentascode";
    var clonePath = path.join(world.tmpDir, "proj");

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
    .catch(function(err) { 
      callback(err); 
    });
  });

  this.Given(/^I run docsmith "([^"]*)"$/, {timeout: 5000}, function (command, callback) {

    command = command || '';
    var world = this;
    var cwd = path.join(world.tmpDir, "proj");

    if (!folderExists(cwd)) {
      fs.mkdirSync(cwd);
    }

    execFile(executablePath, command.split(' '), {cwd: cwd, env: process.env}, function (error, stdout, stderr) {
       world.lastRun = {
         error:  error,
         stdout: stdout, //colors.strip(stdout),
         stderr: stderr
       };
      console.log(stdout)
      console.log(stderr)
       if (error) {
        console.log(stdout)
        console.log(stderr)
        callback(error);
       }
       callback();
     });

  });

  this.Then(/^I should( not)? have a "([^"]*)" file$/, function (negate, file) {
    assert.equal(fileExists(path.join(this.tmpDir, "proj", file)), !negate);
  });

  this.Then(/^I should have a "([^"]*)" file with(out)? "([^"]*)"$/, function (file, negate, text, callback) {
    // Write code here that turns the phrase above into concrete actions
    var world = this;
    var cwd = path.join(world.tmpDir, "repo");
    var absoluteFilePath = path.join(world.tmpDir, "proj", file);
    fs.readFile(absoluteFilePath, 'utf8', function (err, content){
      if (err) { return callback(err); }

      var fileContent = normalizeText(content);
      expectedContent = normalizeText(text);

      assert.equal(fileContent.indexOf(expectedContent) > -1, !negate);
      callback();
    });
  });

  this.Then(/^I should see "([^"]*)"$/, function (text) {
    // Write code here that turns the phrase above into concrete actions
    assert.ok(this.lastRun.stdout.indexOf(text) > -1);
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

  function folderExists(folderPath)
  {
      try
      {
          return fs.statSync(folderPath).isDirectory();
      }
      catch (err)
      {
          return false;
      }
  }

  function normalizeText(text) {
    return text.replace(/\033\[[0-9;]*m/g, '')
      .replace(/\r\n|\r/g, '\n')
      .replace(/^\s+/g, '')
      .replace(/\s+$/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\\/g, '/')
      .replace(/\d+m\d{2}\.\d{3}s/, '<duration-stat>');
  }

};