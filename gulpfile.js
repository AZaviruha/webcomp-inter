var gulp       = require('gulp');
var shell      = require('gulp-shell');

// var path       = require('path');
// var fs         = require('fs');
var args       = require('yargs').argv;

var browserify = require('browserify');
var sourcemaps = require('gulp-sourcemaps');
var source     = require('vinyl-source-stream');
var buffer     = require('vinyl-buffer');
var watchify   = require('watchify');
var babel      = require('babelify');
// var babelify   = require("babelify");


gulp.task('run-server', shell.task([
    './node_modules/.bin/hs --cors ' 
    + (args.addr ? ('-a ' + args.addr) : '')
    + (args.port ? ('-p ' + args.port) : '')
]));


var MAIN_JS_SRC = './src/js/main.js';


function compile(watch) {
  var bundler = watchify(browserify(MAIN_JS_SRC, { debug: true }).transform(babel));

  function rebundle() {
    return bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('bundle.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./dist'));
  }

  if (watch) {
    bundler.on('update', function() {
      console.log('-> bundling...');
      rebundle();
    });
  }

  return rebundle();
}


function watch() { return compile(true); };

gulp.task('build', function() { return compile(); });
gulp.task('watch', function() { return watch(); });

gulp.task('default', ['watch']);


// browserify({ debug: true }) 
//     .transform(babelify) 
//     .require(".src/main.js", { entry: true }) 
//     .bundle() 
//     .on("error", function (err) { console.log("Error: " + err.message); }) 
//     .pipe(fs.createWriteStream("bundle.js"));
