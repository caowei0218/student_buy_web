var path = require('path');

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            vendor: {
                files: [
                    {
                        expand: true, cwd: 'bower_components/backbone/',
                        src: ['backbone.js'], dest: 'public/vendor/backbone/'
                    },
                    {
                        expand: true, cwd: 'bower_components/bootstrap/',
                        src: ['js/**', 'less/**'], dest: 'public/vendor/bootstrap/'
                    },

                    {
                        expand: true, cwd: 'bower_components/fontawesome/',
                        src: ['fonts/**', 'less/**'], dest: 'public/vendor/fontawesome/'
                    },
                    {
                        expand: true, cwd: 'bower_components/jquery/dist/',
                        src: ['jquery.js'], dest: 'public/vendor/jquery/'
                    },
                    {
                        expand: true, cwd: 'bower_components/jquery.cookie/',
                        src: ['jquery.cookie.js'], dest: 'public/vendor/jquery.cookie/'
                    },
                    {
                        expand: true, cwd: 'bower_components/jquery.validation/dist',
                        src: ['jquery.validate.js'], dest: 'public/vendor/jquery.validation/'
                    },
                    {
                        expand: true, cwd: 'bower_components/jquery-autosize',
                        src: ['jquery.autosize.js'], dest: 'public/vendor/jquery-autosize/'
                    },
                    {
                        expand: true, cwd: 'bower_components/jquery.slimscroll',
                        src: ['jquery.slimscroll.js'], dest: 'public/vendor/jquery.slimscroll/'
                    },
                    {
                        expand: true, cwd: 'bower_components/momentjs/',
                        src: ['moment.js'], dest: 'public/vendor/momentjs/'
                    },
                    {
                        expand: true, cwd: 'bower_components/nprogress/',
                        src: ['nprogress.js', 'nprogress.css'], dest: 'public/vendor/nprogress/'
                    },
                    {
                        expand: true, cwd: 'bower_components/respond/src/',
                        src: ['respond.js'], dest: 'public/vendor/respond/'
                    },
                    {
                        expand: true, cwd: 'bower_components/html5shiv/dist/',
                        src: ['html5shiv.js'], dest: 'public/vendor/html5shiv/'
                    },
                    {
                        expand: true, cwd: 'bower_components/underscore/',
                        src: ['underscore.js'], dest: 'public/vendor/underscore/'
                    },
                    {
                        expand: true, cwd: 'bower_components/qrcodejs/',
                        src: ['qrcode.min.js'], dest: 'public/vendor/qrcodejs/'
                    },
                    {
                        expand: true, cwd: 'bower_components/jquery.iframe-transport/',
                        src: ['jquery.iframe-transport.js'], dest: 'public/vendor/jquery.iframe-transport/'
                    }
                ]
            }
        },
        concurrent: {
            dev: {
                tasks: ['nodemon', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        nodemon: {
            dev: {
                script: 'start_app.js',
                options: {
                    ignore: [
                        'node_modules/**',
                        'public/**'
                    ],
                    ext: 'js'
                }
            }
        },
        watch: {
            clientJS: {
                files: [
                    'public/common/**/*.js', '!public/common/**/*.min.js',
                    'public/core/**/*.js', '!public/core/**/*.min.js',
                    'public/views/**/*.js', '!public/views/**/*.min.js'
                ],
                tasks: ['newer:uglify', 'newer:jshint:client']
            },
            serverJS: {
                files: ['views/**/*.js'],
                tasks: ['newer:jshint:server']
            },
            clientLess: {
                files: [
                    'public/core/**/*.less',
                    'public/views/**/*.less',
                    'public/less/**/*.less'
                ],
                tasks: ['newer:less']
            },
            layoutLess: {
                files: [
                    'public/core/**/*.less',
                    'public/views/**/*.less',
                    'public/less/**/*.less'
                ],
                tasks: ['less:layouts']
            }
        },
        uglify: {
            options: {
                sourceMap: false,
                sourceMapName: function (filePath) {
                    return filePath + '.map';
                }
            },
            layouts: {
                files: {
                    'public/core/core.min.js': [
                        'public/vendor/jquery/jquery.js',
                        'public/vendor/jquery.cookie/jquery.cookie.js',
                        'public/vendor/jquery.validation/jquery.validate.js',
                        'public/vendor/jquery.slimscroll/jquery.slimscroll.js',
                        'public/vendor/underscore/underscore.js',
                        'public/vendor/backbone/backbone.js',
                        'public/vendor/bootstrap/js/affix.js',
                        'public/vendor/bootstrap/js/alert.js',
                        'public/vendor/bootstrap/js/button.js',
                        'public/vendor/bootstrap/js/carousel.js',
                        'public/vendor/bootstrap/js/collapse.js',
                        'public/vendor/bootstrap/js/dropdown.js',
                        'public/vendor/bootstrap/js/modal.js',
                        'public/vendor/bootstrap/js/tooltip.js',
                        'public/vendor/bootstrap/js/popover.js',
                        'public/vendor/bootstrap/js/scrollspy.js',
                        'public/vendor/bootstrap/js/tab.js',
                        'public/vendor/bootstrap/js/transition.js',
                        'public/vendor/momentjs/moment.js',
                        'public/vendor/nprogress/nprogress.js',
                        'public/common/constants.js',
                        'public/core/applayout.js',
                        'public/core/plugins.js',
                        'public/core/core.js'
                    ],
                    'public/core/ie-sucks.min.js': [
                        'public/vendor/html5shiv/html5shiv.js',
                        'public/vendor/respond/respond.src.js'
                    ]
                }
            },
            views: {
                files: [{
                    expand: true,
                    cwd: 'public/views/',
                    src: ['**/*.js', '!**/*.min.js'],
                    dest: 'public/views/',
                    ext: '.min.js'
                }]
            }
        },
        less: {
            options: {
                compress: true
            },
            layouts: {
                files: {
                    'public/core/core.min.css': [
                        'public/vendor/nprogress/nprogress.css',
                        'public/less/bootstrap/*.less',
                        'public/less/fontawesome/*.less',
                        'public/less/*.less'
                    ]
                }
            },
            views: {
                files: [{
                    expand: true,
                    cwd: 'public/views/',
                    src: ['**/*.less'],
                    dest: 'public/views/',
                    ext: '.min.css'
                }]
            }
        },
        clean: {
            js: {
                src: [
                    'public/core/**/*.min.js',
                    'public/core/**/*.min.js.map',
                    'public/views/**/*.min.js',
                    'public/views/**/*.min.js.map'
                ]
            },
            jsmap: {
                src: [
                    'public/core/**/*.min.js.map',
                    'public/views/**/*.min.js.map'
                ]
            },
            css: {
                src: [
                    'public/core/**/*.min.css',
                    'public/css/**/*.min.css',
                    'public/views/**/*.min.css'
                ]
            },
            vendor: {
                src: ['public/vendor/**']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-newer');

    grunt.registerTask('default', ['copy:vendor', 'newer:uglify', 'newer:less', 'concurrent']);
    grunt.registerTask('build', ['clean:js', 'copy:vendor', 'uglify', 'less']);
    grunt.registerTask('cleanjsmap', ['clean:jsmap']);
};
