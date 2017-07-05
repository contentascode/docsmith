'use strict';

var path = require('path');

// Returns the path of the caller.
var caller_path = function caller_path() {
  // Should work given subcommand syntax with commander but not robust
  // and prevents dashes in content as code instances.
  var caller_package = path.basename(process.argv[1]).split('-')[0];
  return path.join(path.dirname(process.argv[1]), '../lib/node_modules', caller_package);
};

var caller_content = function caller_content() {
  return 'content' === path.basename(process.argv[1]).split('-')[0];
};

module.exports.path = caller_path;
module.exports.original = caller_content;
//# sourceMappingURL=caller.js.map