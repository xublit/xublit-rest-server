var metaBanner = '\
/**\n\
 * <%= pkg.description %>\n\
 * @version v<%= pkg.version %><%= buildTag %>\n\
 * @link <%= pkg.homepage %>\n\
 * @license MIT License, http://www.opensource.org/licenses/MIT\n\
 */';

/* global module:false */
module.exports = function (grunt) {'use strict';

    var Q = require('q');
    var path = require('path');
    var shjs = require('shelljs');
    var Jasmine = require('jasmine');
    var faithfulExec = require('faithful-exec');
    var JasmineSpecReporter = require('jasmine-spec-reporter');

    var jasmineSpecReporter = new JasmineSpecReporter({
        displayStacktrace: 'summary',
    });

    require('load-grunt-tasks')(grunt);


    /**
     * Grunt Task Config
     */

    grunt.initConfig({
        
        pkg: grunt.file.readJSON('package.json'),
        buildTag: '-dev-' + grunt.template.today('yyyy-mm-dd'),

        buildDir: 'build',
        distDir: 'dist',

        meta: {
            banner: metaBanner,
        },

        usebanner: {
            options: {
                position: 'top',
                banner: '<%= meta.banner %>',
                linebreak: true
            },
            build: {
                files: {
                    src: [
                        'build/**/*.js',
                    ],
                },
            },
            dist: {
                files: {
                    src: [
                        'dist/**/*.js',
                    ],
                },
            },
        },

        clean: {
            build: [
                '<%= buildDir %>',
            ],
            dist: [
                '<%= distDir %>',
            ],
        },

        babel: {
            options: {
                sourceMap: true,
                presets: [
                    'es2015',
                ],
            },
            build: {
                files: [{
                    expand: true,
                    src: [
                        'src/**/*.es6',
                        'test/**/*.es6',
                    ],
                    dest: '<%= buildDir %>/',
                    ext: '.js',
                }],
            },
            dist: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: [
                        'src/**/*.es6',
                    ],
                    dest: '<%= distDir %>/',
                    ext: '.js',
                }],
            },
        },

        watch: {
            dev: {
                options: {
                    spawn: true
                },
                files: [
                    'src/**/*.es6',
                    'test/**/*.es6',
                ],
                tasks: [
                    'build',
                    'test',
                ],
            },
        },

        test: {
            options: {
                configFile: 'jasmine.json',
            },
        },

    });


    /**
     * Grunt Tasks
     */

    grunt.registerTask(
        'default',
        ['build']
    );

    grunt.registerTask(
        'build',
        'Perform a clean build',
        ['clean:build', 'babel:build', 'usebanner:build']
    );

    grunt.registerTask(
        'dist',
        'Perform a build ready for distribution',
        ['clean:dist', 'babel:dist', 'usebanner:dist']
    );

    grunt.registerTask(
        'unit',
        'Build and test',
        ['build', 'test']
    );

    grunt.registerTask(
        'dev',
        'Run dev server and watch for changes',
        ['watch:dev']
    );

    grunt.registerTask(
        'test',
        runJasmineTests
    );

    grunt.registerTask(
        'release',
        'Tag and perform a release',
        ['prepare-release', 'dist', 'perform-release']
    );

    grunt.registerTask(
        'prepare-release',
        prepareRelease
    );

    grunt.registerTask(
        'perform-release',
        performRelease
    );


    /**
     * Grunt Task Functions
     */

    function runJasmineTests () {

        var options = this.options();

        var done = this.async();
        var jasmine = new Jasmine();

        jasmine.loadConfigFile(path.resolve(options.configFile));

        jasmine.configureDefaultReporter({ print: function () {} });
        jasmine.addReporter(jasmineSpecReporter);

        jasmine.onComplete(function(passed) {
            done(passed);
        });

        jasmine.execute();

    }

    function prepareRelease () {

        var done = this.async();
        var version = grunt.config('pkg.version');

        function searchForExistingTag () {
            return exec('git tag -l \"' + version + '\"');
        }

        function checkStdoutAndSetBuildTag (gitTagListCmd) {

            if ('' !== gitTagListCmd.stdout.trim()) {
                throw new Error('Tag \'' + version + '\' already exists');
            }

            grunt.config('buildTag', '');

        }

        ensureCleanMaster()
            .then(searchForExistingTag)
            .then(checkStdoutAndSetBuildTag)
            .then(function () {
                done();
            })
            .catch(handleAsyncError.bind(undefined, done))
            .done();

    }

    function performRelease () {

        grunt.task.requires(['prepare-release', 'dist']);

        var done = this.async();
        var version = grunt.config('pkg.version');
        var releaseDir = grunt.config('distDir');

        function stageReleaseDir () {
            return system('git add \"' + releaseDir + '\"');
        }

        function commitStagedFiles () {
            return system('git commit -m \"release ' + version + '\"');
        }

        function createTag () {
            return system('git tag \"' + version + '\"');
        }

        stageReleaseDir()
            .then(commitStagedFiles)
            .then(createTag)
            .then(function () {
                done();
            })
            .catch(handleAsyncError.bind(undefined, done))
            .done();

    }


    /**
     * Helper functions
     */

    function exec (cmd) {

        var deferred = Q.defer();

        faithfulExec(cmd)
            .then(function (result) {
                deferred.resolve(result);
            }, function (result) {
                deferred.reject(result);
            });

        return deferred.promise;

    }

    function handleAsyncError (done, error) {

        done = done || function () { };

        grunt.log.write(error + '\n');
        done(false);

    }

    function system (cmd) {

        function handleStdout (result) {
            grunt.log.write(result.stderr + result.stdout);
        }

        function handleStderr (result) {
            grunt.log.write(result.stderr + '\n');
            throw new Error('Failed to run \'' + cmd + '\'');
        }

        grunt.log.write('% ' + cmd + '\n');

        return exec(cmd)
            .then(handleStdout)
            .catch(handleStderr);

    }

    function ensureCleanMaster () {

        function assertMasterAndSetStatusPorcelain (result) {

            if ('refs/heads/master' !== result.stdout.trim()) {
                throw new Error('Not on master branch, aborting');
            }
            
            return exec('git status --porcelain');

        }

        function assertCleanWorkingCopy (result) {
            if ('' !== result.stdout.trim()) {
                throw new Error('Working copy is dirty, aborting');
            }
        }

        return exec('git symbolic-ref HEAD')
            .then(assertMasterAndSetStatusPorcelain)
            .then(assertCleanWorkingCopy);

    }

};
