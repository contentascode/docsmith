const debug = require('debug')('docsmith:build');
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
const { execSync, spawn } = require('child_process');

const metalsmith = require('./utils/metalsmith');

const settings = require('./utils/settings');

const { doInstancesInfo } = require('./instance');

const pad = (string, char, length) => string + char.repeat(length - string.length);

let exp_server, docker_build;

async function build({
  workspace,
  config,
  link = false,
  source,
  keystore_path,
  key_alias,
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
  debug('instances', JSON.stringify(instances, true, 2));
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
        wk: {
          name: wk,
          scripts: instances[settings.instance].content.packages[pkg].workspace[wk],
          pkg: instances[settings.instance].content.packages[pkg].packages[settings.instance]
        }
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
      pad((settings.description || settings.instance) + ' Building', ' ', 42) +
      chalk.grey('===========') +
      '\n' +
      chalk.grey('============================================================================') +
      '\n' +
      '\n'
  );
  debug('workspaces', workspaces);
  workspaces.forEach(({ name, scripts, pkg }, idx) => {
    debug('config.');
    debug('base_toolkit', base_toolkit);
    console.log('>> Starting workspace: ' + name, path.join(base_toolkit, scripts[run ? 'run' : 'start']));
    console.log(
      '>> Please wait while the build is in progress and until you see the message "successfully built files."'
    );
    //TODO: Make watch more targeted.
    //TODO: Maybe factor out webserver.

    if (scripts.preview == 'mobile') {
      if (!keystore_path) exit('Mobile builds require to use --keystore_path argument.');
      if (!key_alias) exit('Mobile builds require to use --key_alias argument.');
      if (!fs.existsSync(keystore_path)) exit('The path you specified with --keystore_path does not exist.');

      // Start expo server
      const build_dir = path.join(settings.packages.replace('/packages', ''), 'build', name);
      try {
        exp_server = spawn(`exp start --offline --localhost --no-dev --minify ${build_dir}`, {
          shell: true,
          stdio: ['ignore', 'inherit', 'inherit']
        });

        // TODO run docker build next when url is displayed.
        // Start docker based Android build
        // TODO remove bashistic way to not expose the pass to the environment.

        const buildCommand =
          `func() {
          local ksp kp;
          read -s -p "\nKeystore Password:" ksp;
          read -s -p "\nKey Password:" kp;
          echo "\n";
          docker rm contentascode_android_build 2>/dev/null || true;
          docker run -it --name contentascode_android_build` +
          ` -v ${keystore_path}:${keystore_path}` +
          ` -v $(pwd)/build:/build` +
          ` -v ${build_dir}:/src/js` +
          ` -v /Users/jun/dev/apprentice/contentascode-expo/tools-public:/src/exponent/tools-public` +
          ` -e APK_FILENAME=${pkg}` +
          ` -e KEYSTORE_PATH=${keystore_path}` +
          ` -e KEY_ALIAS=${key_alias}` +
          ` -e KEYSTORE_PASSWORD=$ksp` +
          ` -e KEY_PASSWORD=$kp` +
          ` iilab/expo-cached:27.0.0;` +
          `};
        sleep 15 && func;`;

        docker_build = execSync(buildCommand, {
          shell: '/bin/bash',
          stdio: ['inherit', 'inherit', 'inherit']
        });
      } finally {
        // Terminate expo server
        !exp_server.killed && exp_server.kill();
        // console.log('Terminating docker build!');
        // execSync('docker stop contentascode_android_build');
      }
    } else if (scripts.preview == 'web') {
      // TODO: DRY below which comes from docsmith:start.
      metalsmith(
        path.join(base_toolkit, scripts[run ? 'run' : 'start']),
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
          plugins: [
            ...(watch
              ? [
                  {
                    'metalsmith-watch': {
                      ...(scripts.preview == 'web' ? { livereload: 35730 + idx } : null),
                      paths: {
                        '${source}/**/*': '**/*',
                        'code/assets/**/*': '**/*.md',
                        'code/templates/*.pug': '**/*'
                      }
                    }
                  }
                ]
              : []),
            ...(watch && scripts.preview == 'web'
              ? [
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
              : [])
          ]
        },
        err => {
          if (err) {
            return exit('Error deploying' + name, err);
          }
          debug('>> Finished. ');
        }
      );
    }
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

module.exports.run = build;
