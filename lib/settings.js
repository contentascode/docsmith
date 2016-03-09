var yaml = require('js-yaml');
var fs = require('fs');
var path = require('path');

// Get document, or throw exception on error 
try {
  var settings = yaml.safeLoad(fs.readFileSync('./_docsmith.yml', 'utf8'));
} catch (e) {
  console.log(e);
  console.log('Cannot find _docsmith.yml')
  console.log('You do not seem to be at the root of a docsmith project.')
  console.log('Make sure you run docsmith where your _docsmith.yml file is.');
  process.exit(1);
}

function settings_save(settings) {
  try {
    fs.writeFileSync('./_docsmith.yml', yaml.safeDump(settings), 'utf8')
  } catch (e) {
    console.log(e);
  }
}

module.exports.settings = settings
module.exports.save = settings_save