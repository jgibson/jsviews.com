var noop = function () {},

	gulp = require('gulp'),
//browserSync = require('browser-sync'),
	qunit = require('node-qunit-phantomjs'),
	plugins = require('gulp-load-plugins')(),
	browserify = require('browserify'),
	fs = require('fs'),

	DOWNLOAD = 'download/',
	DEST_JSR = '../jsrender/',
	DEST_JSV = '../jsviews/',
	DEST_NODESTARTER = '../jsrender-node-starter/',
	DEST_JSVCOM = './',
	SRC = '_src/',
	packageJSON  = require('./package'),
	jshintConfig = packageJSON.jshintConfig,
	jscsConfig = packageJSON.jscsConfig;
	jshintConfig.lookup = false;

function buildTemplate(template, minify, folder, from, to) {
	var stream = gulp.src([SRC + 'templates/' + (folder || '') + template])
		.pipe(plugins.fileInclude({                           // Compose js files from src templates
			basepath: SRC
		}));
	if (!from) {
		stream = stream.pipe(plugins.jshint(jshintConfig))    // Run JsHint
			.pipe(plugins.jscs(jscsConfig))                     // Enforce JsCS dode style 
			.on('error', noop)                                  // Don't stop on error
			.pipe(plugins.jscsStylish.combineWithHintResults()) // Combine with JsHint and JsCS results 
			.pipe(plugins.jshint.reporter('jshint-summary', {
				reasonCol: 'blue,bold',
				errorsCol: 'black,bold'
				//statistics: true
			}));
		//.pipe(plugins.jshint.reporter('fail'))
	}
	stream = stream.pipe(gulp.dest(to || ((from||DOWNLOAD) + (folder || '')))) // Output js file
		.pipe(plugins.debug({title: "built:"}));

	if (minify) {
		stream = stream.pipe(plugins.sourcemaps.init())       // Prepare sourcemap
		.pipe(plugins.uglify({                                // Minify
			preserveComments: 'some'
		}))
		.pipe(plugins.rename(function (path) {                // Rename minified file to min.js
			path.basename += '.min';
		}))
		.pipe(plugins.sourcemaps.write('./'))                 // Output sourcemap file
		.pipe(plugins.debug({title: "minified:"}))
		.pipe(gulp.dest(DOWNLOAD + (folder || '')))           // Output min.js file
	}
	return stream;
}

//================================= DEFAULT - Build and test =================================//

gulp.task('default', ['test']);

//================================= COPY - Copy to jsrender and jsviews projects =================================//

gulp.task('preparejsr', function() {
	return buildTemplate('package.json', false, 'jsrender/', SRC);
});

gulp.task('preparejsv', function() {
	return buildTemplate('package.json', false, 'jsviews/', SRC);
});

gulp.task('preparestarter', function() {
	return buildTemplate('package.json', false, 'jsrender-node-starter/', SRC);
});

gulp.task('preparejsvcom', function() {
	return buildTemplate('package.json', false, 'jsviews.com/', SRC, DEST_JSVCOM);
});

gulp.task('copy', ['preparejsr', 'preparejsv', 'preparestarter', 'preparejsvcom'], function() {
	gulp.src([DOWNLOAD + 'jsrender.*js*', DOWNLOAD + 'jsrender-node.js', SRC + 'jsrender/package.json'])
		.pipe(gulp.dest(DEST_JSR));

	gulp.src([DOWNLOAD + 'tmplify/index.js'])
		.pipe(gulp.dest(DEST_JSR + 'tmplify/'));

	gulp.src([DOWNLOAD + 'jsrender.*js*', DOWNLOAD + 'jsviews.*js*', DOWNLOAD + 'jquery.observable.*js*', DOWNLOAD + 'jquery.views.*js*', SRC + 'jsviews/package.json'])
		.pipe(gulp.dest(DEST_JSV));

	gulp.src(['test/unit-tests/tests-jsrender*.js', 'test/unit-tests/requirejs-config.js'])
		.pipe(gulp.dest(DEST_JSR + 'test/unit-tests/'));

	gulp.src(['test/unit-tests/tests-js*.js', 'test/unit-tests/requirejs-config.js'])
		.pipe(gulp.dest(DEST_JSV + 'test/unit-tests/'));

	gulp.src([SRC + 'jsrender-node-starter/package.json'])
		.pipe(gulp.dest(DEST_NODESTARTER));
});

//================================= MINIFY - Build and minify =================================//

gulp.task('minify', function() {
	return buildTemplate('*.js', true);
});

gulp.task('minify2', function() {
	var stream = gulp.src([DOWNLOAD + 'sample-tag-controls/jsviews-jqueryui-widgets.js']);
		stream = stream.pipe(plugins.sourcemaps.init())       // Prepare sourcemap
		.pipe(plugins.uglify({                                // Minify
			preserveComments: 'some'
		}))
		.pipe(plugins.rename(function (path) {                // Rename minified file to min.js
			path.basename += '.min';
		}))
		.pipe(plugins.sourcemaps.write('./'))                 // Output sourcemap file
		.pipe(plugins.debug({title: "minified:"}))
		.pipe(gulp.dest(DOWNLOAD + 'sample-tag-controls/'))   // Output min.js file
});

//================================= TMPLIFY - Build tmplify/index.js =================================//

gulp.task('tmplify', function() {
	return buildTemplate('index.js', false, 'tmplify/');
});

//================================= ALL - Build, minify, copy to projects and test =================================//

gulp.task('all', ['minify', 'tmplify', 'copy', 'minify2'], function() {
//	qunit('./test/unit-tests-all-jsviews.html');
//	qunit('./test/unit-tests-all-observable-render-views.html');
//	qunit('./test/unit-tests-all-render-observable-views.html');
//	qunit('./test/unit-tests-jsobservable-no-jsrender.html');
});

//================================= TEST - Build and test =================================//

gulp.task('test', ['build'], function() {
	qunit('./test/unit-tests-all-jsviews.html');
});

//================================= BUILD - Build =================================//

gulp.task('build', function() {
	return buildTemplate('*.js');
});

//================================= JSVIEWS - Build jsviews.js only =================================//

gulp.task('jsviews', function() {
	return buildTemplate('jsviews.js');
});

//================================= WATCH - Build jsviews.js and load browser. Watch for changes =================================//

//// Task that ensures the 'jsviews' task is complete before reloading browsers
//gulp.task('build-browse', ['jsviews'], browserSync.reload);

//// Task to launch BrowserSync and watch JS files
//gulp.task('watch', function () {
//	// Serve files from the root of this project
//	browserSync({
//		server: {
//			baseDir: "./"
//		}
//	});

//	// add browserSync.reload to the tasks array to make
//	// all browsers reload after tasks are complete.
//	gulp.watch([SRC + '*.js', 'index.html'], ['build-browse']);
//});

//================================= BUNDLE - Run Browserify - create client bundles for test cases =================================//
// See https://github.com/gulpjs/gulp/blob/master/docs/recipes/browserify-with-globs.md

// Task to create Browserify client-side bundle scripts for Browserify test cases.
gulp.task('bundle', function() {
	var tmplify = require('jsrender/tmplify');
	var gs = require('glob-stream');

	return gs.create('./test/browserify/*-unit-tests.js')
		.on('data', function(file) {
			// file has path, base, and cwd attrs
			var fileName = file.path.slice(file.base.length, -14);
			browserify(file.path, {debug:true})
				.transform(tmplify)
				.bundle()
				.pipe(fs.createWriteStream('./test/browserify/bundles/' + fileName + "-bundle.js"))
				.on('error', function(err) {
					// Make sure failed tests cause gulp to exit non-zero 
					throw err;
				});
		});
});
