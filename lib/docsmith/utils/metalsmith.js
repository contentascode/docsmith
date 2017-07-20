'use strict';

// Extracted from metalsmith library to handle config loading
// Modified to:
//  - support config file overrides.
//  - process files to symlinks instead of building

var debug = require('debug')('docsmith:metalsmith');
var chalk = require('chalk');
var resolve = require('path').resolve;
var exists = require('fs').existsSync;
var read = require('fs').readFileSync;
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
var debugui = require('metalsmith-debug-ui');

// Pass config file path, config overrides and make async.
module.exports = function (config, overrides, callback) {
  var name = basename(config, extname(config));
  var dir = resolve(process.cwd(), dirname(config));

  var json = void 0;

  ['.json', '.yml', '.yaml'].forEach(function (ext) {
    var conf = format({ root: '/', dir, base: name + ext });
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

  var _overrides$source = overrides.source,
      source = _overrides$source === undefined ? json.source : _overrides$source,
      _overrides$destinatio = overrides.destination,
      destination = _overrides$destinatio === undefined ? json.destination : _overrides$destinatio,
      _overrides$concurrenc = overrides.concurrency,
      concurrency = _overrides$concurrenc === undefined ? json.concurrency : _overrides$concurrenc,
      _overrides$metadata = overrides.metadata,
      metadata = _overrides$metadata === undefined ? json.metadata : _overrides$metadata,
      _overrides$clean = overrides.clean,
      clean = _overrides$clean === undefined ? json.clean : _overrides$clean,
      _overrides$frontmatte = overrides.frontmatter,
      frontmatter = _overrides$frontmatte === undefined ? json.frontmatter : _overrides$frontmatte,
      _overrides$ignore = overrides.ignore,
      ignore = _overrides$ignore === undefined ? json.ignore : _overrides$ignore,
      _overrides$plugins = overrides.plugins,
      plugins = _overrides$plugins === undefined ? [] : _overrides$plugins,
      dbg = overrides.dbg;


  if (dbg) debugui.patch(metalsmith, { perf: true });

  if (source) metalsmith.source(source);
  if (destination) metalsmith.destination(destination);
  if (concurrency) metalsmith.concurrency(concurrency);
  if (metadata) metalsmith.metadata(json.metadata ? Object.assign({}, metadata, json.metadata) : metadata);

  if (clean !== undefined) metalsmith.clean(clean);
  if (frontmatter !== undefined) metalsmith.frontmatter(frontmatter);
  if (ignore !== undefined) metalsmith.ignore(ignore);

  debug('json.plugins', json.plugins);
  debug('plugins', plugins);
  json.plugins = json.plugins.concat(plugins);

  /**
   * Plugins.
   */

  async.eachSeries(normalize(json.plugins), function (plugin, cb) {
    for (var _name in plugin) {
      var opts = plugin[_name];
      var mod = void 0;

      try {
        var local = resolve(dir, _name);
        var npm = resolve(dir, 'node_modules', _name);
        if (exists(local) || exists(local + '.js')) {
          debug('resolving local package:', local);
          mod = require(local);
        } else if (exists(npm)) {
          debug('resolving npm package:', npm);
          mod = require(npm);
        } else {
          debug('resolving package by name:', _name);
          mod = require(_name);
        }
      } catch (e) {
        return cb(fatal('failed to require plugin "' + _name + '".', new Error('Could not find plugin')));
      }

      try {
        metalsmith.use(mod(opts));
        cb();
      } catch (e) {
        return cb(fatal('error using plugin "' + _name + '"...', e.message + '\n\n' + e.stack));
      }
    }
  }, function (err) {
    return callback(err);
  });

  /**
   * TODO: Monkey patch to create symlinked build?
   */

  // metalsmith.writeFile = unyield(function*(file, data) {
  //   const dest = this.destination();
  //   if (!absolute(file)) file = path.resolve(dest, file);
  //
  //   try {
  //     yield fs.outputFile(file, data.contents);
  //     if (data.mode) yield fs.chmod(file, data.mode);
  //   } catch (e) {
  //     e.message = 'Failed to write the file at: ' + file + '\n\n' + e.message;
  //     throw e;
  //   }
  // });

  /**
   * Build.
   */

  metalsmith.build(function (err) {
    if (err) return callback(fatal(err.message, err));
    log('successfully built files.');

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