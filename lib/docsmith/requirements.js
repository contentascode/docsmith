"use strict";

var git = require('nodegit');

var promise_name = git.Config.openDefault().then(function (config) {
  return config.getString("user.name");
});

// TODO: Check that:
//  - git works 
//  - libgit2 is installed
//  - there is no url.ssh://git@github.com/.insteadof=https://github.com/ as it confuses the authentication
//  - ruby, gem, jekyll is installed if corresponding modules are installed.
//# sourceMappingURL=requirements.js.map