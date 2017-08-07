'use strict';

var debug = require('debug')('docsmith:start');
// const fs = require('fs-extra');
var realPath = require('fs').realpathSync;
// const read = require('fs').readFileSync;
var path = require('path');
// var npmi = require('npmi');
// const yaml = require('js-yaml').safeLoad;
var fork = require('child_process').fork;
var chalk = require('chalk');
var os = require('os');
// require('longjohn');

var metalsmith = require('./utils/metalsmith');

var settings = require('./utils/settings');

var pad = function pad(string, char, length) {
  return string + char.repeat(length - string.length);
};

function start(_ref) {
  var workspace = _ref.workspace,
      config = _ref.config,
      _ref$link = _ref.link,
      link = _ref$link === undefined ? false : _ref$link,
      source = _ref.source,
      _ref$watch = _ref.watch,
      watch = _ref$watch === undefined ? false : _ref$watch,
      _ref$dbg = _ref.dbg,
      dbg = _ref$dbg === undefined ? false : _ref$dbg,
      baseurl = _ref.baseurl;

  debug('link', link);
  debug('source', source);
  debug('baseurl', baseurl);
  debug('dbg', dbg);
  debug('settings.config', settings.config);

  // TODO: hardwired for now.
  var workspaces = workspace ? ['@safetag/' + workspace] : Object.keys(settings.config.workspace);

  var repository = path.join(process.env.HOME, '.content');
  var base_toolkit = realPath(path.join(repository, 'packages', 'safetag-toolkit'));

  console.log('\n' + '\n' + chalk.grey('============================================================================') + '\n' + chalk.grey('===========') + '            ' + pad((settings.description || settings.instance) + ' Starting', ' ', 42) + chalk.grey('===========') + '\n' + chalk.grey('============================================================================') + '\n' + '\n');

  workspaces.forEach(function (workspace, idx) {
    console.log('>> Starting workspace: ', path.join(base_toolkit, config.workspace[workspace].start));
    console.log('>> Please wait about 5 seconds while the website is built and you see the message "successfully built files."');
    //TODO: Make watch more targeted.
    //TODO: Maybe factor out webserver.

    metalsmith(path.join(base_toolkit, config.workspace[workspace].start), Object.assign({}, source ? { source } : null, {
      dbg,
      destination: path.join(repository, 'build', workspace),
      metadata: Object.assign({}, config.workspace[workspace].metadata, {
        site: { baseurl }
      }),
      plugins: watch ? [{
        'metalsmith-watch': {
          livereload: 35730 + idx,
          paths: {
            '${source}/**/*': '**/*.md',
            'code/assets/**/*': '**/*.md',
            'code/templates/**/*': '**/*.md'
          }
        }
      }, {
        'metalsmith-serve': {
          document_root: path.join(os.homedir(), '.content/build'),
          port: 8081 + idx,
          verbose: false,
          // http_error_files: {
          //   '404': '/404.html'
          // },
          redirects: {
            '/': workspace,
            '/searchMeta.json': '/' + workspace + '/searchMeta.json',
            '/searchIndex.json': '/' + workspace + '/searchIndex.json',
            '/debug-ui/data.json': '/' + workspace + '/debug-ui/data.json'
            // '/old_url.php?lang=en': '/en/new_url/'
          }
        }
      }] : []
    }), function (err) {
      if (err) {
        return exit('Error deploying' + workspace, err);
      }
      debug('>> Finished. ');
    });
  });
}

var exit = function exit(message, error) {
  {
    console.log(chalk.red('\n' + message + '\n'));
    if (error) console.log('error', error);
    console.log(chalk.grey('\n==================================================================\n\n') + chalk.red('Please alert the developer by submitting an issue \nat https://github.com/contentascode/safetag/issues and copy the whole output of the command above.\n\nApologies for the inconvenience!\n'));
    process.exit(1);
  }
};

module.exports.run = start;
//# sourceMappingURL=start.js.map