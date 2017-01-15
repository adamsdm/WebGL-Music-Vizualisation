var gulp = require('gulp'),
    connect = require('gulp-connect'),
    babel = require('gulp-babel'),
    rename = require('gulp-rename'),
    watch = require('gulp-watch');
 

gulp.task('watch', () => {
  gulp.watch(['./js/*.js'], () => {   
    gulp.src('index.html').pipe(connect.reload());
  });
  
});


gulp.task('js', () => {
     return gulp.src('js/app.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('js'));
})


gulp.task('webserver', ['watch'], () => {     
  connect.server({   
    livereload: true
  });
});


gulp.task('build', ['js', 'webserver']);
gulp.task('default', ['watch', 'webserver']);

