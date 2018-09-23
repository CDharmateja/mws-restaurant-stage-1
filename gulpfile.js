/**
 *  To use this file you need to have gulp installed. To install gulp you can use command 'npm i gulp-cli -g'.
 *
 * 'gulp' alone creates a new folder dist containing minified code
 * 'gulp clean' removes all the files and folders in dist folder
 * 'gulp responsive images' generates responsive images
 * 'gulp minify-html' minifies html
 * 'gulp minify-css' minifies css
 * 'gulp minify-js' minifies js
 * 'gulp copy' copies needed files to dist to run website
 */

const gulp = require('gulp');

const responsive = require('gulp-responsive');
const clean = require('gulp-clean');

const htmlmin = require('gulp-htmlmin');

const cleanCSS = require('gulp-clean-css');

const uglifyjs = require('uglify-es');
const composer = require('gulp-uglify/composer');
const pump = require('pump');

const minify = composer(uglifyjs, console);

// Cleans the files and folders in dist folder
gulp.task('clean', () => {
  return gulp.src('dist/*', {read: false})
    .pipe(clean());
});

// Generates images of different widths for different screen sizes
gulp.task('responsive-images', () => {
  return gulp.src('img_src/*.jpg')
    .pipe(responsive({
      '*.jpg': [
        {
          width: 250,
          quality: 30,
          rename: {
            suffix: '-250small'
          }
        },
        {
          width: 300,
          quality: 30,
          rename: {
            suffix: '-300small'
          }
        },
        {
          width: 400,
          quality: 30,
          rename: {
            suffix: '-400medium'
          }
        },
        {
          width: 550,
          quality: 30,
          rename: {
            suffix: '-550medium'
          }
        },
        {
          width: 800,
          quality: 30,
          rename: {
            suffix: '-800large'
          }
        }
      ]
    }))
    .pipe(gulp.dest('dist/img'));
});

// Minifies javascript
gulp.task('minify-js', cb => {
  const options = {};

  pump([
    gulp.src('js/*.js'),
    minify(options),
    gulp.dest('dist/js')
  ]);

  pump([
    gulp.src(['sw.js', 'idb.js']),
    minify(options),
    gulp.dest('dist')
  ], cb);
});

// Minifies HTML
gulp.task('minify-html', () => {
  return gulp.src('*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('dist'));
});

// Minifies CSS
gulp.task('minify-css', () => {
  return gulp.src('css/*.css')
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest('dist/css'));
});

// Copies some files needed to run website
gulp.task('copy', () => {
  return gulp.src(['manifest.json', 'restaurant.svg', 'restaurant-192.png', 'restaurant-512.png'])
    .pipe(gulp.dest('dist'));
});

// Default task for gulp
gulp.task('default', ['clean', 'responsive-images', 'minify-js', 'minify-html', 'minify-css', 'copy']);