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
var settings = void 0;

try {
  // Get document, or throw exception on error
  var config_path = resolve[resolve.map(fs.existsSync).findIndex(id)];

  debug('resolve.map(fs.existsSync)', resolve.map(fs.existsSync));
  debug('config_path', config_path);
  if (!config_path) {
    console.log('Cannot find content as code configuration.');
    console.log('Make sure to initialise your content repository or run this command from within a content as code project.');
  }
  settings = yaml.safeLoad(fs.readFileSync(config_path, 'utf8'));
  settings.integration = settings.integration || {};
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

var instance = path.basename(process.argv[1]).split('-')[0];

module.exports.instance = instance;
module.exports.settings = settings;
module.exports.save = settings_save;
//# sourceMappingURL=settings.js.map