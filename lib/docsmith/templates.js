'use strict';

var debug = require('debug')('docsmith:templates');
var fs = require('fs-extra');
var path = require('path');
var npm = require('npm');
// var npmi = require('npmi');

// TODO: Finalise making templates as packages
var templates_path = path.join(path.dirname(fs.realpathSync(__filename)), '../../templates');

function init() {
  var template = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'metalsmith';

  // Built in templates
  if (template == 'jekyll' || template == 'metalsmith') {
    try {
      debug('template file', path.join(templates_path, 'init-' + template));
      fs.copy(path.join(templates_path, 'init-' + template), '.', {
        overwrite: false,
        errorOnExist: true,
        filter(f) {
          return path.basename(f) != '.git';
        }
      }, function (err) {
        if (err) return console.error(err);
        console.error('WARNING: Careful this probably does not work.');
        // TODO: Finish converting to npm from npmi
        npm.load({ save: false, progress: false }, function (err) {
          if (err) return err;
          npm.commands.install(['.'], function (err) {
            if (err) {
              console.log('Installation failed.' + err.message);
            } else {
              console.log('');
              console.log('Content as Code project directory initialised with ' + template + ' template.');
              console.log('');
              console.log('You can find out about your current configuration with:');
              console.log('');
              console.log('content status');
              console.log('');
            }
          });
        });
      }); // copies file
    } catch (e) {
      console.error('Error: Could not initialise template.', template);
      console.error(e);
      process.exit(1, '');
    }
  } else {
    console.error('Error: Template not recognised .');
    process.exit(1, '');
  }
}

module.exports.path = templates_path;
module.exports.init = init;
//# sourceMappingURL=templates.js.map