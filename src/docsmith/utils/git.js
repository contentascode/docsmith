const debug = require('debug')('docsmith:git');

const nodegit = require('nodegit');

const { taskView } = require('./npm');
const ProgressBar = require('progress');

const { task, waitAll, of, fromPromised } = require('folktale/concurrency/task');
const Validation = require('folktale/validation');
const { Success, Failure } = Validation;
const { exit } = require('./terminal');

const collect = validations => validations.reduce((a, b) => a.concat(b), Success());

const hello = task(resolver => resolver.resolve('hello'));

const id = x => x;

const delay = ms =>
  task(resolver => {
    const timerId = setTimeout(() => resolver.resolve(ms), ms);
    resolver.cleanup(() => {
      clearTimeout(timerId);
    });
  });

// Key -> Task Validation Error ()
const isConfigValueSet = fromPromised(key =>
  nodegit.Config
    .openDefault()
    .then(config => config.getStringBuf(key))
    .then(buf => (buf ? Success(buf) : Failure(`Git configuration key ${key} is not set\n`)))
    .catch(e => Failure(e))
);

// Task [ Validation Error () ]
const requirements = waitAll([isConfigValueSet('user.email'), isConfigValueSet('user.name')]);

const doCheck = async () => {
  debug('Checking requirements');

  // console.log('checkUserEmail[a,b]', checkUserEmail(['a', undefined]));

  const res = await requirements
    // Task [ Validation Error () ] -> Task Validation [ Error ] ()
    .map(([email, name]) =>
      Success(email => name => ({ email, name }))
        .apply(email)
        .apply(name)
    )
    .run()
    .promise();

  return res.matchWith({
    Success: ({ value }) => ({ ...value }),
    Failure: () => {
      console.log('Please check that git is installed properly.');
      process.exit();
    }
  });
};

// Key -> Task Validation Error ()
const infoRepo = fromPromised(({ path }) => {
  return nodegit.Repository
    .open(path)
    .then(repository =>
      Promise.all([
        repository.getBranchCommit('master'),
        repository.getCurrentBranch().then(ref => ref.toString()),
        repository
          .getReferences(nodegit.Reference.TYPE.LISTALL)
          .then(refs => refs.filter(ref => ref.isBranch()).map(ref => ref.toString()))
      ])
    )
    .then(([commit, current, branches]) => Success({ commit: commit.sha(), current, branches }))
    .catch(e => Failure(e));
});

const doInfo = async ({ path }) => {
  debug('Getting git info');

  const res = await infoRepo({ path })
    // Task [ Validation Error () ] -> Task Validation [ Error ] ()
    // .map(([email, name]) =>
    //   Success(email => name => ({ email, name }))
    //     .apply(email)
    //     .apply(name)
    // )
    .run()
    .promise();

  return res.matchWith({
    Success: ({ value }) => ({ ...value }),
    Failure: ({ value }) => {
      console.log(`Please check that git is installed properly. Error: ${value}`);
      process.exit();
    }
  });
};

// `docsmith-init`
//   - pre-conditions
//     - If folder exists,
//       - If not git repo: ask for upgrade confirmation
//     - If folder doesn't exist:
//       - `init`
//         - cloneRepo

// `load`
//   - If folder doesn't exist: Ask to `init`
//   - If folder exists:
//     - If not git repo: ask to `init`
//     - If git repo: fetch, what to do if there are commits since a release/tag?
//     - If new tag (persist in .content)
//       - Ask for content update confirmation.
//         - Show updates and conflict visually?
//         - Try to rebase local branch onto it.
//       - What if not updated?
//         - When branch is pushed, possibly push resolution of merge conflicts to editor.
//         - Editor will create an integration branch where they will rebase and solve conflicts.

// Key -> Task Validation Error ()
const cloneRepo = fromPromised(({ url, name }) => {
  // const options = new nodegit.CloneOptions();
  // const fetchOpts = new nodegit.FetchOptions();
  // options.fetchOpts = fetchOpts;
  // const callbacks = new nodegit.RemoteCallbacks();
  // fetchOpts.callbacks = callbacks;
  let bar;
  const newObjects = 0;
  debug('Cloning');

  const opts = {
    fetchOpts: {
      callbacks: {
        transferProgress(progress) {
          bar =
            bar ||
            new ProgressBar('Cloning [:bar] :percent :etas :url ', {
              complete: '=',
              incomplete: ' ',
              width: 100,
              total: 100
            });
          bar.update(progress.receivedObjects() / progress.totalObjects(), { url });
        }
      }
    }
  };

  // callbacks.transferProgress = function(stats) {
  //   debug('Progress');
  //   const progress = 100 * (stats.receivedObjects() + stats.indexedObjects()) / (stats.totalObjects() * 2);
  //   return progress;
  // };

  return nodegit
    .Clone(url, name, opts)
    .then(repository => {
      bar.update(1);
      return repository;
    })
    .then(repository => repository.getBranchCommit('master'))
    .then(commit => Success(commit.sha()))
    .catch(e => Failure(e));
});

// Key -> Task Validation Error ()
const pullRepo = fromPromised(path => {
  // const options = new nodegit.CloneOptions();
  // const fetchOpts = new nodegit.FetchOptions();
  // options.fetchOpts = fetchOpts;
  // const callbacks = new nodegit.RemoteCallbacks();
  // fetchOpts.callbacks = callbacks;
  let bar;
  const newObjects = 0;
  debug('Pulling', path);

  return nodegit.Repository
    .open(path)
    .then(repository => {
      repository.fetchAll();
      return repository;
    })
    .then(repository => repository.mergeBranches('master', 'origin/master'))
    .then(oid => Success(oid))
    .catch(e => Failure(e));
});

// [ gitURL ] -> Task [ Validation Error () ]
const doCloneRepos = (packages, path) => waitAll(packages.map(repo => cloneRepo(repo, path)));

// [ gitURL ] -> Task [ Validation Error () ]
const doPullRepos = paths => waitAll(paths.map(path => pullRepo(path)));

// Info -> gitURL
const getRepo = ({ value: info }) =>
  Object.keys(info).map(key => ({ url: info[key].repository.url.replace('git+https', 'https'), name: info[key].name }));

// objPck: the packages key of the content.yml file of the instance
// path: the destination path for cloning the repo.
// objPck -> path -> Task Validation [ CommitSha ]
const doClone = async (packages, path) => {
  debug('Getting git url from npm');
  // debug('objPck', objPck);
  // const packages = Object.keys(objPck); //.map(key => objPck[key].split('@')[0]);
  debug('clone.packages', packages);

  // [ Package ] -> Task [ Validation Error Info ]
  const res = await taskView(packages.map(pkg => pkg.split('@')[0]))
    // Task Validation Error [ Info ] -> Task Validation Error [ Repos ]
    .map(getRepo)
    // Task Validation Error [ gitURL ] -> Task [ Validation Error () ]
    .chain(repos => doCloneRepos(repos, path))
    // Task [ Validation Error () ] -> Task Validation [ Error ] ()
    .map(collect)
    .run()
    .promise();

  return res.matchWith({
    Success: ({ value }) => ({ value }),
    Failure: ({ value }) => {
      exit(`Error while cloning ${Object.keys(packages)} into ${path}`, value);
    }
  });
};
// objPck: the packages key of the content.yml file of the instance
// path: the destination path for cloning the repo.
// objPck -> path -> Task Validation [ CommitSha ]
const doPull = async objPck => {
  debug('Getting git url from npm');
  debug('objPck', objPck);
  const packages = Object.keys(objPck).map(key => objPck[key].install); //.map(key => objPck[key].split('@')[0]);
  debug('pull.packages', packages);

  // [ path ] -> Task [ Validation Error [ path ] ]
  const res = await of(packages)
    // Task Validation Error [ path ] -> Task [ Validation Error () ]
    .chain(paths => doPullRepos(paths))
    // Task [ Validation Error () ] -> Task Validation [ Error ] ()
    .map(collect)
    .run()
    .promise();

  return res.matchWith({
    Success: ({ value }) => ({ value }),
    Failure: ({ value }) => {
      exit(`Error while pulling ${Object.keys(objPck)}`, value);
    }
  });
};

export { doCheck, doClone, doPull, doInfo };
