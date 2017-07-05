'use strict';

// Extracted from metalsmith library to handle config loading
// Modified to:
//  - support config file overrides.
//  - process files to symlinks instead of building

var chalk = require('chalk');
var resolve = require('path').resolve;
var exists = require('fs').existsSync;
var read = require('fs').readFileSync;
var resolve = require('path').resolve;
var basename = require('path').basename;
var extname = require('path').extname;
var dirname = require('path').dirname;
var format = require('path').format;
var yaml = require('js-yaml').safeLoad;
var async = require('async');
var fs = require('co-fs-extra');
var path = require('path');

var absolute = require('absolute');
var unyield = require('unyield');
var Metalsmith = require('metalsmith');

// Pass config file path, config overrides and make async.
module.exports = function (config, _ref, callback) {
  var source = _ref.source,
      destination = _ref.destination,
      concurrency = _ref.concurrency,
      metadata = _ref.metadata,
      clean = _ref.clean,
      frontmatter = _ref.frontmatter,
      ignore = _ref.ignore;

  var name = basename(config, extname(config));
  var dir = resolve(process.cwd(), dirname(config));

  var json;

  ['.json', '.yml', '.yaml'].forEach(function (ext) {
    var conf = format({ root: '/', dir: dir, base: name + ext });
    var path = resolve(dir, dirname(config), conf);

    if (!exists(path) || json) return;
    try {
      if (ext === '.json') {
        json = require(path);
      } else if (ext === '.yml' || ext === '.yaml') {
        json = yaml(read(path, 'utf8'));
      }
    } catch (e) {
      return callback(fatal('it seems like ' + conf + ' is malformed.', new Error('Error in conf', conf)));
    }
  });

  if (!json) return callback(fatal('could not find a ' + config.replace('.json', '') + '.json / .yml / .yaml configuration file.', new Error('Could not find configuration file')));

  var metalsmith = new Metalsmith(dir);
  if (source || json.source) metalsmith.source(source || json.source);
  if (destination || json.destination) metalsmith.destination(destination || json.destination);
  if (concurrency || json.concurrency) metalsmith.concurrency(concurrency || json.concurrency);
  if (json.metadata) metalsmith.metadata(json.metadata);
  if (json.clean != null) metalsmith.clean(json.clean);
  if (json.frontmatter != null) metalsmith.frontmatter(json.frontmatter);
  if (json.ignore != null) metalsmith.ignore(json.ignore);

  /**
   * Plugins.
   */

  async.eachSeries(normalize(json.plugins), function (plugin, cb) {
    for (var name in plugin) {
      var opts = plugin[name];
      var mod;

      try {
        var local = resolve(dir, name);
        var npm = resolve(dir, 'node_modules', name);
        if (exists(local) || exists(local + '.js')) {
          mod = require(local);
        } else if (exists(npm)) {
          mod = require(npm);
        } else {
          mod = require(name);
        }
      } catch (e) {
        return cb(fatal('failed to require plugin "' + name + '".', new Error('Could not find plugin')));
      }

      try {
        metalsmith.use(mod(opts));
      } catch (e) {
        return cb(fatal('error using plugin "' + name + '"...', e.message + '\n\n' + e.stack));
      }
    }
  }, function (err) {
    return callback(err);
  });

  /**
   * Monkey patch to create symlinked build.
   */

  metalsmith.writeFile = unyield(regeneratorRuntime.mark(function _callee(file, data) {
    var dest;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            dest = this.destination();

            if (!absolute(file)) file = path.resolve(dest, file);

            _context.prev = 2;
            _context.next = 5;
            return fs.outputFile(file, data.contents);

          case 5:
            if (!data.mode) {
              _context.next = 8;
              break;
            }

            _context.next = 8;
            return fs.chmod(file, data.mode);

          case 8:
            _context.next = 14;
            break;

          case 10:
            _context.prev = 10;
            _context.t0 = _context['catch'](2);

            _context.t0.message = 'Failed to write the file at: ' + file + '\n\n' + _context.t0.message;
            throw _context.t0;

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[2, 10]]);
  }));

  /**
   * Build.
   */

  metalsmith.build(function (err, files) {
    if (err) return callback(fatal(err.message, err));
    log('successfully processed files.');

    callback();
  });

  /**
   * Log an error and then exit the process.
   *
   * @param {String} msg
   * @param {String} [stack]  Optional stack trace to print.
   */

  function fatal(msg, err) {
    console.error();
    console.error(chalk.red('  Metalsmith') + chalk.gray(' · ') + msg);
    if (err.stack) {
      console.error();
      console.error(chalk.gray(err.stack));
    }
    console.error();
    return err;
  }

  /**
   * Log a `message`.
   *
   * @param {String} message
   */

  function log(message) {
    console.log();
    console.log(chalk.gray('  Metalsmith · ') + message);
    console.log();
  }

  /**
   * Normalize an `obj` of plugins.
   *
   * @param {Array or Object} obj
   * @return {Array}
   */

  function normalize(obj) {
    if (obj instanceof Array) return obj;
    var ret = [];

    for (var key in obj) {
      var plugin = {};
      plugin[key] = obj[key];
      ret.push(plugin);
    }

    return ret;
  }
};
//# sourceMappingURL=metalsmith.js.map