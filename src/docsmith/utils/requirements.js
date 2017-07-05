const git = require('nodegit');

const promise_name = git.Config.openDefault().then(function(config) {
  return config.getString('user.name');
});

module.exports.promise_name = promise_name;
// TODO: Check that:
//  - git works
//  - libgit2 is installed
//  - there is no url.ssh://git@github.com/.insteadof=https://github.com/ as it confuses the authentication
//  - ruby, gem, jekyll is installed if corresponding modules are installed.
