// need to set the template root for Swig
require('swig').init({ root: __dirname + "/docs" });

module.exports = function(grunt) {
	"use strict";

	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON('package.json'),
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
			' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
		// Task configuration.
		concat: {
			apeye: {
				options: {
					banner: '<%= banner %>',
					stripBanners: true
				},
				src: ['src/apeye.js' ],
				dest: 'dist/apeye.js'
			},
			codemirror: {
				files: {
					'dist/codemirror.js': [
						'src/codemirror/lib/codemirror.js',
						'src/codemirror/mode/javascript/javascript.js',
						'src/codemirror/mode/xml/xml.js',
						'src/codemirror/mode/http/http.js',
						'src/codemirror/lib/util/formatting.js',
						'src/codemirror/lib/util/multiplex.js'
					],
					'dist/codemirror.css': 'src/codemirror/lib/codemirror.css'
				}
			}
		},
		uglify: {
			dist: {
				src: 'dist/apeye.js',
				dest: 'dist/apeye.min.js'
			},
			codemirror: {
				src: 'dist/codemirror.js',
				dest: 'dist/codemirror.min.js'
			}
		},
		qunit: {
			all: ['tests/runner.html']
		},
		jshint: {
			options: {
				curly: false,
				camelcase: true,
				eqnull: true,
				eqeqeq: true,
				undef: true,
				forin: true,
				latedef: true,
				newcap: true,
				unused: true,
				strict: true,
				jquery: true,
				browser: true,
				globals: {
					CodeMirror: false,
					DOMParser: false
				}
			},
			gruntfile: {
				options: { globals: { module: false, require: false, "__dirname": false } },
				src: 'Gruntfile.js'
			},
			src: {
				src: 'src/apeye*.js'
			},
			test: {
				options: {
					unused: false,
					strict: false,
					sub: true,
					globals: {
						// we create a global, modifiable APEye instance in tests for simplicity
						apeye: true,
						// following are standard QUnit globals
						module: false,
						assertInvisible: false,
						assertVisible: false,
						assertFieldValue: false,
						sinon: false,
						test: false,
						ok: false,
						strictEqual: false,
						deepEqual: false
					}
				},
				src: 'tests/apeye*.js'
			}
		},
		less: {
			compile: {
				options: {
					compress: true
				},
				files: {
					'dist/apeye.css': 'src/apeye.less'
				}
			}
		},
		template: {
			index: {
				src: 'docs/index.swig',
				dest: 'docs/index.html',
				variables: { curTab: "home" }
			},
			download: {
				src: 'docs/customDownload.swig',
				dest: 'docs/customDownload.html',
				variables: { curTab: "download" }
			},
			standaloneRpc: {
				src: 'docs/standalone-rpc.swig',
				dest: 'docs/standalone-rpc.html',
				variables: {}
			}
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			src: {
				files: '<%= jshint.src.src %>',
				tasks: ['jshint:src', 'qunit']
			},
			test: {
				files: '<%= jshint.test.src %>',
				tasks: ['jshint:test', 'qunit']
			},
			docs: {
				files: 'docs/*.swig',
				tasks: ['template']
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-templater');

	// Default task.
	grunt.registerTask('default', ['jshint', 'less', 'qunit', 'concat', 'uglify', 'template']);
};
