'use strict';

var run = require('gulp-run');
var gutil = require('gulp-util');
var streamify = require('gulp-streamify');
var spawn = require("gulp-spawn");

// Compiles Sass to CSS and generates necessary files if requested
module.exports = {
  hercule: {
    options: {
      tasks: function tasks(stream) {
        return stream.pipe(spawn({
          cmd: "hercule",
          args: [],
          opts: { cwd: '.' }
        }));
      }
    },
    expand: true,
    cwd: 'content',
    src: '**/*.md',
    dest: '_tmp/'
  }
};
//# sourceMappingURL=gulp.js.map