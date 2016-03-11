var yaml = require('js-yaml');
var fs = require('fs');
var path = require('path');

// Get document, or throw exception on error 
try {
  var settings = yaml.safeLoad(fs.readFileSync('./_content.yml', 'utf8'));
  settings.components = settings.components || {} ;
} catch (e) {
  console.log(e);
  console.log('Cannot find _content.yml')
  console.log('You do not seem to be at the root of a contentascode/docsmith project.')
  console.log('Make sure you run docsmith where your _content.yml file is.');
  process.exit(1);
}

function settings_save(settings) {
  try {
    fs.writeFileSync('./_content.yml', yaml.safeDump(settings), 'utf8')
  } catch (e) {
    console.log(e);
  }
}

// Constants

function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// Defaults

define("DEFAULT_TRAVIS", {
  branch: 'versions/*',
  build: 'rake',  // because of jekyll-travis for now.
  validate: [ 'links' ]
})


module.exports.settings = settings
module.exports.save = settings_save