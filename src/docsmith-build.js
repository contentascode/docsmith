#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander');
const settings = require('./docsmith/settings').settings;
const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');

let component;

program
  .description('Builds or serves the current content')
  .option('-s, --serve', 'Serves')
  .option('-w, --watch', 'Serves and watches')
  .option('-r, --reload', 'Live reload')
  .option('-v, --validate', 'Validate links')
  .option('-c, --config <config>', 'Specify configuration file')
  .option('-d, --destination <directory>', 'Specify build destination')
  .arguments('[component] [options]')
  .action(function(comp) {
    component = comp;
  })
  .parse(process.argv);

if (component) console.log('Ignoring option component', component);

if (!settings.generate) {
  console.log('You do not have a static site generator installed.');
}

let config;

if (settings.build && settings.build == 'grunt') {
  if (!fileExists(path.join(process.cwd(), 'Gruntfile.js'))) {
    console.log('Could not find a metalsmith configuration file.');
    process.exit(1);
  }
  // const grunt = spawn('grunt', [], { env: process.env, stdio: 'inherit' });
} else if (settings.generate.metalsmith) {
  if (program.config && fileExists(path.join(process.cwd(), program.config))) {
    config = require(path.join(process.cwd(), program.config));
  } else if (fileExists(path.join(process.cwd(), 'metalsmith.json'))) {
    config = require(path.join(process.cwd(), 'metalsmith.json'));
  } else {
    console.log('Could not find a metalsmith configuration file.');
    process.exit(1);
  }

  if (program.destination) {
    config.destination = program.destination;
  }

  //  var metalsmith = spawn('metalsmith', [''], { env: process.env, stdio: "inherit"});

  // provide a formatting function for use in templates
  config.metadata.formatDate = function(date, format) {
    return require('moment')(date).format(format || 'MMMM Do, YYYY');
  };
  // only enable live-reloading when requested
  if (program.serve || program.watch) {
    const redirects = Object.assign(
      {
        '/': settings.publish.baseurl + '/'
      },
      settings.publish.redirects
    );

    config.plugins.push({
      'metalsmith-serve': {
        document_root: '_site',
        redirects,
        http_error_files: {
          '404': settings.publish.baseurl + '/404.html'
        }
      }
    });
  }

  if (program.watch) {
    const watch = {
      'metalsmith-watch': {
        paths: {
          '${source}/**/*.md': true,
          '_layouts/**': '**/*.md',
          '_includes/**': '**/*.md'
        }
      }
    };
    if (program.reload) {
      watch['metalsmith-watch'].livereload = 35729;
      config.metadata.customHTML = '<script src="http://localhost:35729/livereload.js?snipver=1"></script>';
    }
    config.plugins.push(watch);
  }
  // if (program.watch && program.reload) {
  //   config.plugins.push( { 'metalsmith-watch' : { livereload: 35729 } } );
  //   config.metadata.customHTML = '<script src="http://localhost:35729/livereload.js?snipver=1"></script>';
  // }
  if (program.validate) {
    config.plugins.push({ 'metalsmith-broken-link-checker': true });
  }
  // config.plugins.find( x => { for (k in x) { return (k == 'metalsmith-ignore') } } )['metalsmith-ignore'].push("metalsmith.tmp.json");
  // Swallow the --watch option
  process.argv = [];

  fs.writeFile('metalsmith.tmp.json', JSON.stringify(config, null, 2), 'utf8', function(err) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    process.argv.push('/usr/local/bin/node', '/usr/local/bin/content-build', '--config', 'metalsmith.tmp.json');
    require('metalsmith/bin/metalsmith');
  });
} else if (settings.generate.jekyll) {
  config = program.config ? ['--config', program.config] : [];
  spawn('bundle', ['exec', 'jekyll', 'build'].concat(config), { env: process.env, stdio: 'inherit' });
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}
