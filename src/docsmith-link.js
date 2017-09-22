#!/usr/bin/env node

/**
 * Module dependencies.
 */

const debug = require('debug')('docsmith:link');
const program = require('commander');
const config = require('./docsmith/utils/settings').config;
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

let mappings;

program
  .usage('Linking will automatically overwrite symlinks but save original folders.')
  .arguments('[mappings...]', 'Enables package:path mapping')
  .option('-u, --unlink', 'Remove symlinks and restore original state if pointing to actual folder.')
  .option('-f, --force', 'Link whether the package path is empty or not.')
  .option('-F, --force-remove', 'Link whether the package path is empty or not and do not backup')
  .action(function(maps) {
    mappings = maps.map(mp => mp.split(':').map(m => m.replace('~/', os.homedir() + '/')));
  })
  .parse(process.argv);

debug('config', config);
debug('mappings', mappings);
// const { link, source, baseurl, watch, debug: dbg, package: mapping } = program;

if (program.unlink) {
  mappings.forEach(([to, from]) => {
    try {
      const symlink = fs.lstatSync(to).isSymbolicLink();
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
  mappings.forEach(([to, from]) => {
    try {
      const exists = fs.existsSync(to);
      const symlink = exists && fs.lstatSync(to).isSymbolicLink();

      if (exists && !(program.force || program.forceRemove)) {
        console.log('Skipping as ' + to + ' folder already exists. Use --force to replace folder.');
      } else if (exists && !symlink && (program.force || program.forceRemove)) {
        try {
          program.forceRemove
            ? fs.removeSync(to)
            : fs.moveSync(to, path.join(path.dirname(to), path.basename(to) + '.orig'));
        } catch (e) {
          if (e.code === 'EEXIST') console.log('Package already linked ' + from + ' to ' + to + ' use unlink first.');
          else throw e;
        }
        fs.ensureSymlinkSync(fs.realpathSync(from), to);
        console.log(
          'Linked package ' +
            from +
            ' to ' +
            to +
            (program.forceRemove
              ? ''
              : ' and saved original folder: ' + path.basename(to) + '.orig (use --unlink to restore)')
        );
      } else {
        fs.ensureSymlinkSync(fs.realpathSync(from), to);
        exists
          ? console.log('Linked package overwritten ' + from + ' to ' + to)
          : console.log('Linked package ' + from + ' to ' + to);
      }
    } catch (e) {
      console.log('Could not link package ' + from + ' to ' + to, e);
    }
  });
}

if (fs.existsSync())
  if (config) {
    // check if we could resolve the config.
    // debug('config', config);
    // called from a content as code instance, initialise from the instance configuration
    // start.run({ workspace, config, link, source, watch, dbg, baseurl, mapping });
  } else {
    console.warn('Could not find config. Aborting start. Please contact the developer');
  }
