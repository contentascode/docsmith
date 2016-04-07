#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var settings = require('./lib/settings').settings;
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');

var component;

program
  .description('Builds or serves the current content')
  .option('--serve', 'Serves')
  .option('--watch', 'Serves and watches')
  .option('--reload', 'Live reload')
  .option('--validate', 'Validate links')
  .option('--config <config>', 'Specify configuration file')
  .arguments('[component] [options]')
  .action(function(component) {
    component = component;
  })
  .parse(process.argv);

if (!settings.generate) {
  console.log('You do not have a static site generator installed.')
}

if (settings.generate.metalsmith) {
  var config = require(path.join(process.cwd(),'metalsmith.json'));

//  var metalsmith = spawn('metalsmith', [''], { env: process.env, stdio: "inherit"});

  // provide a formatting function for use in templates
  config.metadata.formatDate = function(date, format) {
      return require("moment")(date).format(format || "MMMM Do, YYYY");
  }
  // only enable live-reloading when requested
  if (program.serve || program.watch) {
    var redirects = Object.assign({
        "/" : settings.publish.baseurl + "/"
      }, settings.publish.redirects)

    config.plugins.push( { 'metalsmith-serve' : {       
      "document_root": "_site",
      "redirects": redirects,
      "http_error_files": {
        "404": settings.publish.baseurl + "/404.html"
      }
    } } );
  }

  if (program.watch) {
    config.plugins.push( { 'metalsmith-watch': { 
      "paths": {
        "${source}/**/*.md": true,
        "_layouts/**": "**/*.html",
        "_includes/**": "**/*.html"
      }
    } } );
  }
  if (program.watch && program.reload) {
    config.plugins.push( { 'metalsmith-watch' : { livereload: 35729 } } );
    config.metadata.customHTML = '<script src="http://localhost:35729/livereload.js?snipver=1"></script>';
  }
  if (program.validate) {
    config.plugins.push( { 'metalsmith-broken-link-checker': true } );
  }
  config.plugins.find( x => { for (k in x) { return (k == 'metalsmith-ignore') } } )['metalsmith-ignore'].push("metalsmith.tmp.json");
  // Swallow the --watch option
  process.argv = []

  fs.writeFile("metalsmith.tmp.json", JSON.stringify(config, null, 2), 'utf8', function (err) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    process.argv.push("/usr/local/bin/node", "/usr/local/bin/content-build", "--config", "metalsmith.tmp.json")
    require('metalsmith/bin/metalsmith');

  })
} else if (settings.generate.jekyll) {
  var config = program.config ? ['--config', program.config] : []
  spawn('bundle', ['exec', 'jekyll', 'build'].concat(config), { env: process.env, stdio: "inherit"});
}

