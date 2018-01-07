const debug = require('debug')('docsmith:start');
const fs = require('fs-extra');
const realPath = require('fs').realpathSync;
// const read = require('fs').readFileSync;
const path = require('path');
// var npmi = require('npmi');
// const yaml = require('js-yaml').safeLoad;
// const fork = require('child_process').fork;
const chalk = require('chalk');
const os = require('os');
// require('longjohn');
const yaml = require('js-yaml');

const metalsmith = require('./utils/metalsmith');

const settings = require('./utils/settings');

const { doInstancesInfo } = require('./instance');

const pad = (string, char, length) => string + char.repeat(length - string.length);

async function start({
  workspace,
  config,
  link = false,
  source,
  watch = false,
  clean = false,
  dbg = false,
  warning = false,
  baseurl,
  run = false
}) {
  debug('link', link);
  debug('workspace', workspace);
  debug('source', source);
  debug('baseurl', baseurl);
  debug('dbg', dbg);
  debug('clean', clean);

  const repository = yaml.safeLoad(fs.readFileSync(settings.config, 'utf8'));
  debug('repository', repository);
  const instances = await doInstancesInfo({ instances: repository.instances });
  debug('instances', instances);
  debug(
    'ok',
    Object.keys(instances[settings.instance].content.packages)
      .map(pkg =>
        Object.keys(instances[settings.instance].content.packages[pkg].workspace).map(wk => ({
          pkg,
          wk: { name: wk, scripts: instances[settings.instance].content.packages[pkg].workspace[wk] }
        }))
      )
      .reduce((acc, cur) => [...acc, ...cur], [])
  );
  const workspaces = Object.keys(instances[settings.instance].content.packages)
    .map(pkg =>
      Object.keys(instances[settings.instance].content.packages[pkg].workspace).map(wk => ({
        pkg,
        wk: { name: wk, scripts: instances[settings.instance].content.packages[pkg].workspace[wk] }
      }))
    )
    .reduce((acc, cur) => [...acc, ...cur], [])
    .filter(
      ({ pkg, wk: { name } }) =>
        name.startsWith('@' + settings.instance) &&
        instances[settings.instance].content.packages[pkg].workspace[name][`${run ? 'run' : 'start'}`]
    )
    .map(({ wk }) => wk)
    .filter(({ name }) => (workspace ? name === '@' + settings.instance + '/' + workspace : true));

  // For now, only one root content package per CLI client.
  const base_toolkit = realPath(
    path.join(
      instances[settings.instance].content.packages[Object.keys(instances[settings.instance].content.packages)[0]]
        .install
    )
  );

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

  workspaces.forEach(({ name, scripts }, idx) => {
    debug('config.');
    console.log('>> Starting workspace: ' + name, path.join(base_toolkit, scripts.start));
    console.log(
      '>> Please wait about 5 seconds while the website is built and you see the message "successfully built files."'
    );
    //TODO: Make watch more targeted.
    //TODO: Maybe factor out webserver.

    metalsmith(
      path.join(base_toolkit, scripts.start),
      {
        ...(source ? { source } : null),
        dbg,
        clean,
        destination: path.join(settings.packages.replace('/packages', ''), 'build', name),
        metadata: {
          ...scripts.metadata,
          site: { baseurl },
          watch,
          warning: !!warning
        },
        plugins:
          watch && scripts.preview == 'web'
            ? [
                {
                  'metalsmith-watch': {
                    livereload: 35730 + idx,
                    paths: {
                      '${source}/**/*': '**/*',
                      'code/assets/**/*': '**/*.md',
                      'code/templates/*.pug': '**/*'
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
                      '/': name,
                      '/searchMeta.json': '/' + name + '/searchMeta.json',
                      '/searchIndex.json': '/' + name + '/searchIndex.json',
                      '/debug-ui/data.json': '/' + name + '/debug-ui/data.json'
                      // '/old_url.php?lang=en': '/en/new_url/'
                    }
                  }
                }
              ]
            : []
      },
      err => {
        if (err) {
          return exit('Error deploying' + name, err);
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
