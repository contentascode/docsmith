const debug = require('debug')('docsmith');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const id = x => x;
const local = p => path.join(process.cwd(), p);
const repository = p => path.join(process.env.HOME, '.content', p);

// Resolve content config file
const resolve = [local('content.yml'), local('_content.yml'), repository('content.yml')];
debug('resolve', resolve);
let settings;

try {
  // Get document, or throw exception on error
  const config_path = resolve[resolve.map(fs.existsSync).findIndex(id)];

  debug('resolve.map(fs.existsSync)', resolve.map(fs.existsSync));
  debug('config_path', config_path);
  if (!config_path) {
    console.log('Cannot find content as code configuration.');
    console.log(
      'Make sure to initialise your content repository or run this command from within a content as code project.'
    );
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

const instance = path.basename(process.argv[1]).split('-')[0];

module.exports.instance = instance;
module.exports.settings = settings;
module.exports.save = settings_save;
