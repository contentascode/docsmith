#!/usr/bin/env node
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * Module dependencies.
 */

var debug = require('debug')('docsmith:link');
var program = require('commander');
var config = require('./docsmith/utils/settings').config;
var fs = require('fs-extra');
var path = require('path');
var os = require('os');

var mappings = void 0;

program.usage('Linking will automatically overwrite symlinks but save original folders.').arguments('[mappings...]', 'Enables package:path mapping').option('-u, --unlink', 'Remove symlinks and restore original state if pointing to actual folder.').option('-f, --force', 'Link whether the package path is empty or not.').action(function (maps) {
  mappings = maps.map(function (mp) {
    return mp.split(':').map(function (m) {
      return m.replace('~/', os.homedir() + '/');
    });
  });
}).parse(process.argv);

debug('config', config);
debug('mappings', mappings);
// const { link, source, baseurl, watch, debug: dbg, package: mapping } = program;

if (program.unlink) {
  mappings.forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        to = _ref2[0],
        from = _ref2[1];

    try {
      var symlink = fs.lstatSync(to).isSymbolicLink();
      if (symlink) {
        fs.unlinkSync(to);
        debug('Unlinked symlink', to);
        if (fs.existsSync(to + '.orig')) {
          fs.moveSync(to + '.orig', to);
          debug('Restored folder ' + to + '.orig' + ' to ', to);
        }
      } else {
        console.log('Could not find link ' + to + '. Skipping.');
      }
    } catch (e) {
      console.log('Could not unlink package ' + from + ' to ' + to, e);
    }
  });
} else {
  mappings.forEach(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        to = _ref4[0],
        from = _ref4[1];

    try {
      var exists = fs.existsSync(to);
      var symlink = exists && fs.lstatSync(to).isSymbolicLink();

      if (exists && !program.force) {
        console.log('Skipping as ' + to + ' folder already exists. Use --force to replace folder.');
      } else if (exists && !symlink && program.force) {
        try {
          fs.moveSync(to, path.join(path.dirname(to), path.basename(to) + '.orig'));
        } catch (e) {
          if (e.code === 'EEXIST') console.log('Package already linked ' + from + ' to ' + to + ' use unlink first.');else throw e;
        }
        fs.ensureSymlinkSync(fs.realpathSync(from), to);
        console.log('Linked package ' + from + ' to ' + to + ' and saved original folder: ' + path.basename(to) + '.orig');
      } else {
        fs.ensureSymlinkSync(fs.realpathSync(from), to);
        exists ? console.log('Linked package overwritten ' + from + ' to ' + to) : console.log('Linked package ' + from + ' to ' + to);
      }
    } catch (e) {
      console.log('Could not link package ' + from + ' to ' + to, e);
    }
  });
}

if (fs.existsSync()) if (config) {
  // check if we could resolve the config.
  // debug('config', config);
  // called from a content as code instance, initialise from the instance configuration
  // start.run({ workspace, config, link, source, watch, dbg, baseurl, mapping });
} else {
  console.warn('Could not find config. Aborting start. Please contact the developer');
}
//# sourceMappingURL=docsmith-link.js.map