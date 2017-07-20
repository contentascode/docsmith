// Extracted from metalsmith library to handle config loading
// Modified to:
//  - support config file overrides.
//  - process files to symlinks instead of building

const debug = require('debug')('docsmith:metalsmith');
const chalk = require('chalk');
const resolve = require('path').resolve;
const exists = require('fs').existsSync;
const read = require('fs').readFileSync;
const basename = require('path').basename;
const extname = require('path').extname;
const dirname = require('path').dirname;
const format = require('path').format;
const yaml = require('js-yaml').safeLoad;
const async = require('async');
const fs = require('co-fs-extra');
const path = require('path');

const absolute = require('absolute');
const unyield = require('unyield');
const Metalsmith = require('metalsmith');
const debugui = require('metalsmith-debug-ui');

// Pass config file path, config overrides and make async.
module.exports = function(config, overrides, callback) {
  const name = basename(config, extname(config));
  debug('name', name);
  const dir = resolve(process.cwd(), dirname(config));
  debug('dir', dir);

  let json;

  ['.json', '.yml', '.yaml'].forEach(function(ext) {
    const conf = format({ root: '/', dir, base: name + ext });
    const path = resolve(dir, dirname(config), conf);

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

  if (!json)
    return callback(
      fatal(
        'could not find a ' + config.replace('.json', '') + '.json / .yml / .yaml configuration file.',
        new Error('Could not find configuration file')
      )
    );

  const metalsmith = new Metalsmith(dir);

  const {
    source = json.source,
    destination = json.destination,
    concurrency = json.concurrency,
    metadata = json.metadata,
    clean = json.clean,
    frontmatter = json.frontmatter,
    ignore = json.ignore,
    plugins = [],
    dbg
  } = overrides;

  if (dbg) debugui.patch(metalsmith, { perf: true });

  if (source) metalsmith.source(source);
  if (destination) metalsmith.destination(destination);
  if (concurrency) metalsmith.concurrency(concurrency);
  if (metadata) metalsmith.metadata(json.metadata ? { ...metadata, ...json.metadata } : metadata);

  if (clean !== undefined) metalsmith.clean(clean);
  if (frontmatter !== undefined) metalsmith.frontmatter(frontmatter);
  if (ignore !== undefined) metalsmith.ignore(ignore);

  debug('json.plugins', json.plugins);
  debug('plugins', plugins);
  json.plugins = json.plugins.concat(plugins);

  /**
   * Plugins.
   */

  async.eachSeries(
    normalize(json.plugins),
    function(plugin, cb) {
      for (const name in plugin) {
        const opts = plugin[name];
        let mod;

        try {
          const local = resolve(dir, name);
          const npm = resolve(dir, 'node_modules', name);
          debug('resolving npm package with :', path.join(dir, 'node_modules', name));
          // debug('ls ' + dir, fs.readdirSync(dir).join('\n'));
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
          cb();
        } catch (e) {
          return cb(fatal('error using plugin "' + name + '"...', e.message + '\n\n' + e.stack));
        }
      }
    },
    err => {
      if (err) return callback(err);
      return;
    }
  );

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

  metalsmith.build(function(err) {
    if (err) return callback(fatal(err.message, err));
    log('successfully built files.');

    return callback();
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
    const ret = [];

    for (const key in obj) {
      const plugin = {};
      plugin[key] = obj[key];
      ret.push(plugin);
    }

    return ret;
  }
};
