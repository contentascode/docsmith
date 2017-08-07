const debug = require('debug')('docsmith:start');
// const fs = require('fs-extra');
const realPath = require('fs').realpathSync;
// const read = require('fs').readFileSync;
const path = require('path');
// var npmi = require('npmi');
// const yaml = require('js-yaml').safeLoad;
const fork = require('child_process').fork;
const chalk = require('chalk');
const os = require('os');
// require('longjohn');

const metalsmith = require('./utils/metalsmith');

const settings = require('./utils/settings');

const pad = (string, char, length) => string + char.repeat(length - string.length);

function start({ workspace, config, link = false, source, watch = false, dbg = false, baseurl }) {
  debug('link', link);
  debug('source', source);
  debug('baseurl', baseurl);
  debug('dbg', dbg);
  debug('settings.config', settings.config);

  // TODO: hardwired for now.
  const workspaces = workspace ? ['@safetag/' + workspace] : Object.keys(settings.config.workspace);

  const repository = path.join(process.env.HOME, '.content');
  const base_toolkit = realPath(path.join(repository, 'packages', 'safetag-toolkit'));

  console.log(
    '\n' +
      '\n' +
      chalk.grey('============================================================================') +
      '\n' +
      chalk.grey('===========') +
      '            ' +
      pad((settings.description || settings.instance) + ' Starting', ' ', 42) +
      chalk.grey('===========') +
      '\n' +
      chalk.grey('============================================================================') +
      '\n' +
      '\n'
  );

  workspaces.forEach(function(workspace, idx) {
    console.log('>> Starting workspace: ', path.join(base_toolkit, config.workspace[workspace].start));
    console.log(
      '>> Please wait about 5 seconds while the website is built and you see the message "successfully built files."'
    );
    //TODO: Make watch more targeted.
    //TODO: Maybe factor out webserver.

    metalsmith(
      path.join(base_toolkit, config.workspace[workspace].start),
      {
        ...(source ? { source } : null),
        dbg,
        destination: path.join(repository, 'build', workspace),
        metadata: {
          ...config.workspace[workspace].metadata,
          site: { baseurl }
        },
        plugins: watch
          ? [
              {
                'metalsmith-watch': {
                  livereload: 35730 + idx,
                  paths: {
                    '${source}/**/*': '**/*.md',
                    'code/assets/**/*': '**/*.md',
                    'code/templates/**/*': '**/*.md'
                  }
                }
              },
              {
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
              }
            ]
          : []
      },
      err => {
        if (err) {
          return exit('Error deploying' + workspace, err);
        }
        debug('>> Finished. ');
      }
    );
  });
}

const exit = (message, error) => {
  {
    console.log(chalk.red('\n' + message + '\n'));
    if (error) console.log('error', error);
    console.log(
      chalk.grey('\n==================================================================\n\n') +
        chalk.red(
          'Please alert the developer by submitting an issue \nat https://github.com/contentascode/safetag/issues and copy the whole output of the command above.\n\nApologies for the inconvenience!\n'
        )
    );
    process.exit(1);
  }
};

module.exports.run = start;
