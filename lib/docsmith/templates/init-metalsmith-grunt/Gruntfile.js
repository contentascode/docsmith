'use strict';

/*global module*/

var fs = require('fs');
var yaml = require('js-yaml');

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times

    require('time-grunt')(grunt);

    var options = {
        // Project settings
        paths: {
            // Configurable paths
            app: 'src',
            tmp: '_tmp',
            dist: '_site'
        },
        ports: {
            app: 9000,
            test: 9001,
            livereload: 35729
        }
    };

    //loads the various task configuration files
    var configs = require('load-grunt-config')(grunt, { data: options });
    grunt.initConfig(configs);
};
//# sourceMappingURL=Gruntfile.js.map