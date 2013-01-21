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
				options: { banner: '<%= banner %>' },
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
				options: { globals: { 'module': false } },
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

	// Default task.
	grunt.registerTask('default', ['jshint', 'less', 'qunit', 'concat', 'uglify']);
};
