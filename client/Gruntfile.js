/*jslint node: true */
'use strict';

var pkg = require('./package.json');

//Using exclusion patterns slows down Grunt significantly
//instead of creating a set of patterns like '**/*.js' and '!**/node_modules/**'
//this method is used to create a set of inclusive patterns for all subdirectories
//skipping node_modules, bower_components, dist, and any .dirs
//This enables users to create any directory structure they desire.
var createFolderGlobs = function(fileTypePatterns) {
  fileTypePatterns = Array.isArray(fileTypePatterns) ? fileTypePatterns : [fileTypePatterns];
  var ignore = ['node_modules', 'bower_components', 'dist', 'temp'];
  var fs = require('fs');
  return fs.readdirSync(process.cwd())
    .map(function(file) {
      if (ignore.indexOf(file) !== -1 ||
        file.indexOf('.') === 0 ||
        !fs.lstatSync(file).isDirectory()) {
        return null;
      } else {
        return fileTypePatterns.map(function(pattern) {
          return file + '/**/' + pattern;
        });
      }
    })
    .filter(function(patterns) {
      return patterns;
    })
    .concat(fileTypePatterns);
};

module.exports = function(grunt) {

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    connect: {
      main: {
        options: {
          port: 9000,
          hostname: '0.0.0.0',
          middleware: function(connect, options) {
            if (!Array.isArray(options.base)) {
                options.base = [options.base];
            }
            // var proxy = require('grunt-connect-proxy/lib/utils').proxyRequest;
            var proxy = [require('grunt-connect-proxy/lib/utils').proxyRequest];
            // 代理每个base目录中的静态文件
            options.base.forEach(function(base) {
                proxy.push(connect.static(base));
            });

            // 让目录可被浏览（即：允许枚举文件）
            var directory = options.directory || options.base[options.base.length - 1];
            proxy.push(connect.directory(directory));

            return proxy;
            /*return [
              // Include the proxy first
              proxy,
              // Serve static files.
              connect.static(options.base[0]),
              // Make empty directories browsable.
              connect.directory(options.base[0])
            ];*/
          }
        },
        proxies: [{
          context: '/api',
          host: '101.201.146.103',
          port: 5003,
          https: false,
          changeOrigin: true,
          xforward: false,
          headers: {
            //"x-custom-added-header": value
          }
        }, {
          context: '/images',
          host: '101.201.146.103',
          port: 5003,
          https: false,
          changeOrigin: true,
          xforward: false,
          headers: {
            //"x-custom-added-header": value
          }
        }, {
          context: '/v1',
          host: '192.168.199.199',
          port: 80,
          https: false,
          changeOrigin: true,
          xforward: false,
          headers: {
            // "x-custom-added-header": value,
          }
        }]
      },
      local: {
        options: {
          port: 9000,
          hostname: '0.0.0.0',
          middleware: function(connect, options) {
            if (!Array.isArray(options.base)) {
                options.base = [options.base];
            }
            // var proxy = require('grunt-connect-proxy/lib/utils').proxyRequest;
            var proxy = [require('grunt-connect-proxy/lib/utils').proxyRequest];
            // 代理每个base目录中的静态文件
            options.base.forEach(function(base) {
                proxy.push(connect.static(base));
            });

            // 让目录可被浏览（即：允许枚举文件）
            var directory = options.directory || options.base[options.base.length - 1];
            proxy.push(connect.directory(directory));

            return proxy;
            /*return [
              // Include the proxy first
              proxy,
              // Serve static files.
              connect.static(options.base[0]),
              // Make empty directories browsable.
              connect.directory(options.base[0])
            ];*/
          }
        },
        proxies: [{
          context: '/api',
          host: '127.0.0.1',
          port: 5000,
          https: false,
          changeOrigin: true,
          xforward: false,
          headers: {
            // "x-custom-added-header": value
          }
        }, {
          context: '/images',
          host: '127.0.0.1',
          port: 5000,
          https: false,
          changeOrigin: true,
          xforward: false,
          headers: {
            // "x-custom-added-header": value
          }
        }, {
          context: '/v1',
          host: '127.0.0.1',
          port: 5000,
          https: false,
          changeOrigin: true,
          xforward: false,
          headers: {
            // "x-custom-added-header": value,
          }
        }]
      }
    },
    watch: {
      main: {
        options: {
          livereload: true,
          livereloadOnError: false,
          spawn: false
        },
        files: [createFolderGlobs(['*.js', '*.less', '*.html']), '!_SpecRunner.html', '!.grunt'],
        tasks: [] //all the tasks are run dynamically during the watch event handler
      }
    },
    throttle: {
      main: {
        remote_port: 9000,
        local_port: 8000,
        upstream: 5*1024,
        downstream: 10*1024,
        keepalive: true
      }
    },
    jshint: {
      main: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: createFolderGlobs('*.js')
      }
    },
    clean: {
      before: {
        src: ['dist', 'temp']
      },
      after: {
        src: ['temp']
      }
    },
    less: {
      production: {
        options: {},
        files: {
          'temp/app.css': 'app.less'
        }
      }
    },
    ngtemplates: {
      main: {
        options: {
          module: pkg.name,
          htmlmin: '<%= htmlmin.main.options %>'
        },
        src: [createFolderGlobs('*.html'), '!index.html', '!_SpecRunner.html'],
        dest: 'temp/templates.js'
      }
    },
    copy: {
      main: {
        files: [{
            cwd: 'static/',
            src: ['**'],
            dest: 'dist/',
            expand: true
          }, {
            src: ['bower_components/**/*'],
            dest: 'dist/',
            filter: 'isFile',
            expand: true
          }
          //{src: ['bower_components/angular-ui-utils/ui-utils-ieshiv.min.js'], dest: 'dist/'},
          //{src: ['bower_components/select2/*.png','bower_components/select2/*.gif'], dest:'dist/css/',flatten:true,expand:true},
          //{src: ['bower_components/angular-mocks/angular-mocks.js'], dest: 'dist/'}
        ]
      }
    },
    dom_munger: {
      read: {
        options: {
          read: [{
            selector: 'script[data-concat!="false"]',
            attribute: 'src',
            writeto: 'appjs'
          }, {
            selector: 'link[rel="stylesheet"][data-concat!="false"]',
            attribute: 'href',
            writeto: 'appcss'
          }]
        },
        src: 'index.html'
      },
      update: {
        options: {
          remove: ['script[data-remove!="false"]', 'link[rel="stylesheet"][data-remove!="false"]'],
          append: [{
            selector: 'body',
            html: '<script src="app.full.min.js"></script>'
          }, {
            selector: 'head',
            html: '<link rel="stylesheet" href="app.full.min.css">'
          }]
        },
        src: 'index.html',
        dest: 'dist/index.html'
      }
    },
    cssmin: {
      main: {
        src: ['temp/app.css', '<%= dom_munger.data.appcss %>'],
        dest: 'dist/app.full.min.css'
      }
    },
    concat: {
      main: {
        src: ['<%= dom_munger.data.appjs %>', '<%= ngtemplates.main.dest %>'],
        dest: 'temp/app.full.js'
      }
    },
    ngmin: {
      main: {
        src: 'temp/app.full.js',
        dest: 'temp/app.full.js'
      }
    },
    uglify: {
      main: {
        src: 'temp/app.full.js',
        dest: 'dist/app.full.min.js'
      }
    },
    htmlmin: {
      main: {
        options: {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true,
          removeEmptyAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true
        },
        files: {
          'dist/index.html': 'dist/index.html'
        }
      }
    },
    imagemin: {
      main: {
        files: [{
          expand: true,
          cwd: 'dist/',
          src: ['**/{*.png,*.jpg}'],
          dest: 'dist/'
        }]
      }
    },
    karma: {
      options: {
        frameworks: ['jasmine'],
        files: [ //this files data is also updated in the watch handler, if updated change there too
          '<%= dom_munger.data.appjs %>',
          'bower_components/angular-mocks/angular-mocks.js',
          createFolderGlobs('*-spec.js')
        ],
        logLevel: 'ERROR',
        reporters: ['mocha'],
        autoWatch: false, //watching is handled by grunt-contrib-watch
        singleRun: true
      },
      all_tests: {
        browsers: ['PhantomJS', 'Chrome']
      },
      during_watch: {
        browsers: ['PhantomJS']
      },
    }
  });

  grunt.registerTask('build', ['jshint', 'clean:before', 'less', 'dom_munger', 'ngtemplates', 'cssmin', 'concat', 'ngmin', 'uglify', 'copy', 'htmlmin', 'imagemin', 'clean:after']);
  grunt.registerTask('serve', ['dom_munger:read', 'jshint', 'configureProxies:main', 'connect:main', 'watch']);
  grunt.registerTask('serve_local', ['dom_munger:read', 'jshint', 'configureProxies:local', 'connect:local', 'watch']);
  grunt.registerTask('test', ['dom_munger:read', 'karma:all_tests']);

  grunt.event.on('watch', function(action, filepath) {
    //https://github.com/gruntjs/grunt-contrib-watch/issues/156

    var tasksToRun = [];

    if (filepath.lastIndexOf('.js') !== -1 && filepath.lastIndexOf('.js') === filepath.length - 3) {

      //lint the changed js file
      grunt.config('jshint.main.src', filepath);
      tasksToRun.push('jshint');

      //find the appropriate unit test for the changed file
      var spec = filepath;
      if (filepath.lastIndexOf('-spec.js') === -1 || filepath.lastIndexOf('-spec.js') !== filepath.length - 8) {
        spec = filepath.substring(0, filepath.length - 3) + '-spec.js';
      }

      //if the spec exists then lets run it
      if (grunt.file.exists(spec)) {
        var files = [].concat(grunt.config('dom_munger.data.appjs'));
        files.push('bower_components/angular-mocks/angular-mocks.js');
        files.push(spec);
        grunt.config('karma.options.files', files);
        tasksToRun.push('karma:during_watch');
      }
    }

    //if index.html changed, we need to reread the <script> tags so our next run of karma
    //will have the correct environment
    if (filepath === 'index.html') {
      tasksToRun.push('dom_munger:read');
    }

    grunt.config('watch.main.tasks', tasksToRun);

  });
};