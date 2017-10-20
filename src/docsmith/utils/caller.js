const path = require('path');
const settings = require('./settings');

// Returns the path of the caller.
const caller_path = function() {
  // Should work given subcommand syntax with commander but not robust
  // and prevents dashes in content as code instances.
  return path.join(path.dirname(process.argv[1]), '../lib/node_modules', settings.package);
};

const caller_content = function() {
  return 'docsmith' === settings.package;
};

module.exports.path = caller_path;
module.exports.original = caller_content;
