const path = require('path');

// Returns the path of the caller.
const caller_path = function() {
  // Should work given subcommand syntax with commander but not robust
  // and prevents dashes in content as code instances.
  const caller_package = path.basename(process.argv[1]).split('-')[0];
  return path.join(path.dirname(process.argv[1]), '../lib/node_modules', caller_package);
};

const caller_content = function() {
  return 'content' === path.basename(process.argv[1]).split('-')[0];
};

module.exports.path = caller_path;
module.exports.original = caller_content;
