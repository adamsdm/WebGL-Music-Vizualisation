var gulp = require('gulp'),
    connect = require('gulp-connect'),
    watch = require('gulp-watch');
 

 gulp.task('reload', () =>{

 });

gulp.task('watch', () => {
  gulp.watch(['./*', './**/*'], function() {   
    gulp.src('./**/*').pipe(connect.reload());
  });
});



gulp.task('webserver', ['watch'], () => {     
  connect.server({   
    livereload: true
  });
});
gulp.task('default', ['watch', 'webserver']);

