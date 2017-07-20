'use strict';

var debug = require('debug')('docsmith');
var yaml = require('js-yaml');
var fs = require('fs');
var path = require('path');

var id = function id(x) {
  return x;
};
var local = function local(p) {
  return path.join(process.cwd(), p);
};
var repository = function repository(p) {
  return path.join(process.env.HOME, '.content', p);
};

// Resolve content config file
var resolve = [local('content.yml'), local('_content.yml'), repository('content.yml')];
debug('resolve', resolve);
var config = void 0;

try {
  // Get document, or throw exception on error
  var config_path = resolve[resolve.map(fs.existsSync).findIndex(id)];

  debug('resolve.map(fs.existsSync)', resolve.map(fs.existsSync));
  debug('config_path', config_path);
  if (config_path) {
    config = yaml.safeLoad(fs.readFileSync(config_path, 'utf8'));
    config.integration = config.integration || {};
  } else {
    debug('Cannot find content as code configuration.');
    // console.log(
    //   'Make sure to initialise your content repository or run this command from within a content as code project.'
    // );
  }
} catch (e) {
  console.log(e);
  process.exit(1);
}

function settings_save(settings) {
  try {
    fs.writeFileSync('./_content.yml', yaml.safeDump(settings), 'utf8');
  } catch (e) {
    console.log(e);
  }
}

// Constants

function define(name, value) {
  Object.defineProperty(exports, name, {
    value,
    enumerable: true
  });
}

// Defaults

define('DEFAULT_GITHUB', {
  owner: '',
  repo: '',
  transform: '',
  path: '.'
});

define('DEFAULT_TRAVIS', {
  branch: 'versions/*',
  build: 'rake', // because of jekyll-travis for now.
  validate: ['links']
});

// Brittle...
var instance = path.basename(process.argv[1]).split('-')[0];
debug('instance', instance);
var pkg_json = path.join(process.argv[1].split('/bin/')[0], 'lib/node_modules/', instance, 'package.json');
debug('pkg_json', pkg_json);
var description = require(pkg_json).description;

module.exports.instance = instance;
module.exports.description = description;
module.exports.config = config;
module.exports.save = settings_save;
//# sourceMappingURL=settings.js.map