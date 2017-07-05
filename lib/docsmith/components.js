'use strict';

// Constants

function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

// Functional capabilities of components
//
// There's the choice of breaking down services that provide several content as code components
// into several capability objects, but it might be better to keep them together in order to 
// help identify conflicts, or alternatives (choosing a default for edit links if both github and prose 
// are installed).

define("CAP_GITHUB", {
  source: 'git',
  local: false,
  publish: {
    links: {
      base: 'https://github.com/USER/REPO',
      source: '/tree/master/PATH',
      edit: '/edit/master/PATH',
      history: '/commits/master/PATH'
    }
  },
  discuss: true,
  review: true
});

define("CAP_PROSE", {
  source: 'git',
  local: false,
  ssl: false,
  publish: {
    links: {
      base: 'http://prose.io/#USER/REPO',
      edit: '/edit/master/PATH'
    }
  }
});

define("CAP_PROSE_CUSTOM", {
  source: 'git',
  local: false,
  ssl: true,
  publish: {
    links: {
      base: 'URL',
      source: '/tree/master/PATH',
      edit: '/edit/master/PATH',
      history: '/commits/master/PATH'
    }
  }
});

define("CAP_GITHUB_PAGES", {
  ssl: false,
  publish: {
    web: true
  },
  build: 'jekyll-github-pages',
  local: false
});

define("CAP_HOSTING", {
  ssl: true,
  local: false,
  publish: {
    web: true
  }
});

define("CAP_TRANSIFEX", {
  translate: true
});

define("CAP_PIWIK", {
  stats: true
});

// Configuration snippets

define("LINE_TRAVIS_GEMFILE_RAKE", 'gem "rake", "~> 10.1.1"');
define("LINE_TRAVIS_GEMFILE_GITHUB_PAGES", 'gem "github-pages", "~> 15"');
//# sourceMappingURL=components.js.map