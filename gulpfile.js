'use strict'

const gulp = require('gulp')
const { src, dest, watch, series } = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const autoprefixer = require('autoprefixer')
var gcmq = require('gulp-group-css-media-queries')
const cleancss = require('gulp-clean-css')
const terser = require('gulp-terser')
const uglify = require('gulp-uglify')
const concat = require('gulp-concat')
const postcss = require('gulp-postcss')
const cssnano = require('cssnano')
const imagemin = require('gulp-imagemin')
const htmlmin = require('gulp-htmlmin')
const imagewebp = require('gulp-webp')
const browserSync = require('browser-sync').create()
const dependents = require('gulp-dependents')
const sourcemaps = require('gulp-sourcemaps')
const plumber = require('gulp-plumber')
const babel = require('gulp-babel')
const webpack = require('webpack-stream')

gulp.task('scssTaskRunner', () => {
  return gulp
    .src(['./src/' + 'sass/**/*.scss'], {
      since: gulp.lastRun('scssTaskRunner')
    })
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(dependents())
    .pipe(sass())
    .pipe(
      sass().on('error', (err) => {
        console.log(
          `Error: ${err.message} on line: ${err.lineNumber} in: ${err.fileName}`
        )
      })
    )
    .pipe(
      postcss([
        autoprefixer({
          overrideBrowserlist: [
            'last 2 versions',
            'Chrome >= 35',
            'Firefox >= 38',
            'Edge >= 12',
            'Explorer >= 10',
            'iOS >= 8',
            'Safari >= 8',
            'Android 2.3',
            'Android >= 4',
            'Opera >= 12'
          ]
        }),
        cssnano()
      ])
    )
    .pipe(gcmq())
    .pipe(cleancss())
    .pipe(sourcemaps.write('.'))
    .pipe(concat('style.css'))
    .pipe(gulp.dest('./dist/' + 'css'))
    .pipe(browserSync.stream())
})

gulp.task('jsTaskRunner', () => {
  return gulp
    .src(['./src/' + 'scripts/**/*.js'], {
      since: gulp.lastRun('jsTaskRunner')
    })
    .pipe(plumber())
    .pipe(
      webpack({
        mode: 'production'
      })
    )
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['@babel/env']
      })
    )
    .pipe(concat('all.js'))
    .pipe(uglify())
    .pipe(terser())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/' + 'js'))
    .pipe(browserSync.stream())
})

gulp.task('optimizeImages', () => {
  return gulp
    .src(['./src/' + 'assets/**/*.+(png|jpg|jpeg|gif|svg|ico)'], {
      since: gulp.lastRun('optimizeImages')
    })
    .pipe(plumber())
    .pipe(imagemin())
    .pipe(gulp.dest('./dist/' + 'images'))
    .pipe(browserSync.stream())
})

gulp.task('htmlTaskRunner', () => {
  return gulp
    .src(['./src/' + '**/*.html'], {
      base: './src/',
      since: gulp.lastRun('htmlTaskRunner')
    })
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('./dist/'))
    .pipe(browserSync.stream())
})

gulp.task('serve', () => {
  return browserSync.init({
    server: {
      baseDir: ['dist']
    },
    port: 8000,
    open: true,
    notify: true,
    browser: 'default',
    online: true
  })
})

gulp.task(
  'build',
  gulp.series(
    'htmlTaskRunner',
    'scssTaskRunner',
    'jsTaskRunner',
    'optimizeImages'
  )
)

gulp.task(
  'dev',
  gulp.series('htmlTaskRunner', 'scssTaskRunner', 'jsTaskRunner')
)

gulp.task('watch', () => {
  const watchImages = ['./src/' + 'assets/**/*.+(png|jpg|jpeg|gif|svg|ico)']

  const watch = [
    './src/' + '**/*.html',
    './src/' + 'sass/**/*.scss',
    './src/' + 'scripts/**/*.js'
  ]

  gulp.watch(watch, gulp.series('dev')).on('change', browserSync.reload)
  gulp
    .watch(watchImages, gulp.series('optimizeImages'))
    .on('change', browserSync.reload)
})

gulp.task('default', gulp.series('build', gulp.parallel('serve', 'watch')))
