'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var through2 = require('through2');
var gulp = require('gulp');
var gulp_sass = require('gulp-sass');
var runSequence = require('run-sequence');
var concat = require('gulp-concat');
var UglifyJS = require('uglify-js');
var del = require('del');
var JSBeautify = require('js-beautify').js_beautify;


var inputSass = './static.diary.ymatou.com/diary/sass/**/*.scss';
var inputJs = './static.diary.ymatou.com/diary/src/*.js';
// sourcemap

var CleanCSS = require('clean-css');

//压缩js
var minijs = function (code) {
    return UglifyJS.minify(code, {
        fromString: true
    }).code;
};
//压缩css
var minicss = function (source) {
    return new CleanCSS({
        dvanced: false
    }).minify(source).styles;
};

//打包时是否自动压缩 1： 压缩，0：不压缩
global.compress = 1;

var config = {};
config.build = 'static.diary.ymatou.com/diary/build';
config.source = 'static.diary.ymatou.com/diary/src';
config.viewpath = './views';
config.sourcemapjs = '_sourcemap.js';

// 编译ymt_core.js
function task_ymtcore(next) {
    gulp.src(['./' + config.source + '/hui/hui.js', './' + config.source + '/hui/*.js', '!' + './' + config.source + '/hui/jsdoc.js'])
        .pipe(concat('ymt_core.js')) //合并所有js到main.js
        //.pipe(uglify()) //压缩
        .pipe(gulp.dest(config.build))
        .on('end', function () {
            next && next();
        });
}
gulp.task('task_ymtcore', task_ymtcore);

gulp.task('default', function () {
    runSequence('sourcemapCSSMD5', 'sourcemapJSMD5', 'watch');
});

gulp.task('build', function () {
    runSequence('sourcemapCSSMD5', 'sourcemapJSMD5');
});

function watch() {
    gulp.watch(inputSass, ['sourcemapCSSMD5']);
    gulp.watch(inputJs, ['sourcemapJSMD5']);
}
gulp.task('watch', watch);

function sourcemapJSMD5() {

    del(['./' + config.build + '/_sourcemap.*.js', './' + config.build + '/ymt_core.*.js']).then(function (paths) {

        task_ymtcore(function () {

            var sourcemapMD5 = {};
            var ymtcoreMD5 = 'ymt_core.js';
            gulp.src([inputJs, config.build + '/ymt_core.js'])
                .pipe(gulp.dest(config.build))
                .pipe(through2.obj(function (file, encoding, next) {
                    var content = String(file.contents);
                    // console.log(content.substr(0, 80));

                    // 排除注释对hui.define的影响
                    var result = minijs(content);
                    var md5 = crypto.createHash('md5');
                    md5.update(result, 'utf8');
                    var version = md5.digest('hex');

                    // c:\ymt\00diary\node-community\static.diary.ymatou.com\diary\src\demo.js
                    var filename = file.history[0].replace(/\\/ig, '/');
                    var subPathMd5 = 'static.diary.ymatou.com/diary/' + filename.split('static.diary.ymatou.com/diary/')[1];
                    subPathMd5 = subPathMd5.replace(config.source, config.build).replace(/\.js$/, '.' + version.substr(0, 10) + '.js');

                    var filenameMD5 = subPathMd5.split('static.diary.ymatou.com')[1];

                    if (filename.indexOf('ymt_core.js') !== -1) {
                        ymtcoreMD5 = 'ymt_core.' + version.substr(0, 10) + '.js';
                    }
                    else {
                        var vlist = result.match(/hui.define\("[^"]*"/g) || [];
                        for (var i = 0, len = vlist.length; i < len; i++) {
                            var n = vlist[i].replace(/hui.define\("/, '').replace(/"/, '');
                            if (sourcemapMD5[n]) {
                                if (sourcemapMD5[n].push) {
                                    sourcemapMD5[n].push(filenameMD5);
                                }
                                else {
                                    sourcemapMD5[n] = [sourcemapMD5[n], filenameMD5];
                                }
                            }
                            else {
                                sourcemapMD5[n] = filenameMD5;
                            }
                        }
                    }

                    var str = file.path.replace(/\\/ig, '/');
                    var filepath = (str.split('static.diary.ymatou.com/diary/')[0] + subPathMd5).split('/').join(path.sep);
                    //file.path = filepath;
                    // console.log('>>Create files/folders:\n', filepath);
                    // console.log(filepath);

                    var includeFile = filename.replace(config.source, config.build);

                    del([includeFile.replace('.js', '.*.js'), '!' + filepath]).then(function (paths) {
                        console.log('>>Deleted files/folders:\n', paths.join('\n'));
                        // 将内容写入zepto.md5.js
                        fs.writeFile(filepath, (global.compress ? result : content), 'utf8', function (er) {
                            if (er) throw er;
                            console.log('>>basejs: ' + '==' + filepath);
                            next();
                        });
                    });

                }))
                .pipe(gulp.dest(config.build))
                .on('end', function () {
                    /**
                     * 创建 _sourcemap.md5.js
                     */
                    var code = 'var sourcemap_local = \n' + JSON.stringify(sourcemapMD5) + ';\n' + '(typeof hui !== "undefined")&&hui.define&&hui.define.loadLeft&&hui.define.loadLeft();';

                    var formattedMD5Code = JSBeautify(code, {
                        indent_size: 4
                    });
                    // MD5版本

                    var md5 = crypto.createHash('md5');
                    md5.update(formattedMD5Code, 'utf8');
                    var version = md5.digest('hex');

                    var sourcemapMD5filename = config.sourcemapjs.replace(/\.js$/, '.' + version.substr(0, 10) + '.js');

                    fs.writeFile(config.build + '/' + sourcemapMD5filename, formattedMD5Code, 'utf8', function (er) {
                        if (er) throw er;
                        var basejs = 'hui.loadjs(\'{{config.staticDomain}}/diary/build/' + sourcemapMD5filename + '\');\n' +
                            'hui.loadjs(\'{{config.staticDomain}}/diary/build/' + ymtcoreMD5 + '\');';

                        // 创建views/basejs.html
                        fs.writeFile(config.viewpath + '/basejs.html', basejs, 'utf8', function (er) {
                            if (er) throw er;

                            console.log(config.sourcemapjs + '==' + 'OK');
                        });
                    });


                });

        });


    });

}

gulp.task('sourcemapJSMD5', sourcemapJSMD5);


function sourcemapCSSMD5() {
    var sourcemap = [];
    gulp.src(inputSass)
        .pipe(gulp_sass().on('error', gulp_sass.logError))
        .pipe(gulp.dest('./static.diary.ymatou.com/diary/css'))
        .on('end', function () {

            sourcemapFONTMD5(function () {
                gulp.src([
                        './static.diary.ymatou.com/diary/css/base/global.css',
                        './static.diary.ymatou.com/diary/css/base/icon.css',
                        './static.diary.ymatou.com/diary/css/base/lib.css',
                        './static.diary.ymatou.com/diary/css/base/reset.css',
                        './static.diary.ymatou.com/diary/css/base/loadingline.css',
                        './static.diary.ymatou.com/diary/css/tools/dialog.css',
                        './static.diary.ymatou.com/diary/css/tools/mask.css'
                    ])
                    .pipe(concat('diary.css'))
                    .pipe(gulp.dest('./static.diary.ymatou.com/diary/css'))
                    .on('end', function () {


                        gulp.src('./static.diary.ymatou.com/diary/css/**/+([a-zA-Z0-9_]).css')
                            .pipe(through2.obj(function (file, encoding, next) {
                                var content = String(file.contents);
                                // console.log(content.substr(0, 80));

                                var result = minicss(content);
                                var md5 = crypto.createHash('md5');
                                md5.update(result, 'utf8');
                                var version = md5.digest('hex');

                                // c:\ymt\00diary\node-community\static.diary.ymatou.com\diary\src\demo.js
                                var filename = file.history[0].replace(/\\/ig, '/');
                                var filepath = filename.replace(/\.css$/, '.' + version.substr(0, 10) + '.css');

                                var filenameMD5 = '/diary/' + (filepath.split('static.diary.ymatou.com/diary/')[1] || '');
                                sourcemap.push(filenameMD5);

                                del([filename.replace('.css', '.*.css'), '!' + filepath]).then(function (paths) {
                                    console.log('>>Deleted files/folders:\n', paths.join('\n'));
                                    // 将内容写入zepto.md5.js
                                    fs.writeFile(filepath, (global.compress ? result : content), 'utf8', function (er) {
                                        if (er) throw er;
                                        var cssurl = config.viewpath + '/' + filename.split('static.diary.ymatou.com/diary/')[1] + '.html';
                                        var csstxt = '<link rel="stylesheet" type="text/css" href="{{config.staticDomain}}' + filenameMD5 + '">';
                                        // 创建views/basejs.html
                                        fs.writeFile(cssurl, csstxt, 'utf8', function (er) {
                                            if (er) throw er;
                                            console.log('>>basecss: ' + '==' + cssurl);
                                            next();
                                        });

                                    });
                                });
                            }))
                            .pipe(gulp.dest('./static.diary.ymatou.com/diary/css'))
                            .on('end', function () {

                                var basecss = [];
                                for (var i = 0, len = sourcemap.length; i < len; i++) {
                                    basecss.push('    <link rel="stylesheet" type="text/css" href="{{config.staticDomain}}' + sourcemap[i] + '">\n');
                                }

                                // 创建views/basejs.html
                                fs.writeFile(config.viewpath + '/basecss.html', basecss.join(''), 'utf8', function (er) {
                                    if (er) throw er;
                                });

                                console.log('basecss.html' + '==' + 'OK');
                            });
                    });
                });
        });
}

gulp.task('sourcemapCSSMD5', sourcemapCSSMD5);


function sourcemapFONTMD5(callback) {

    var sourcemap = [];
    del('./static.diary.ymatou.com/diary/fonts/*.*.*').then(function (paths) {
        console.log('>>Deleted files/folders:\n', paths.join('\n'));

        gulp.src(['./static.diary.ymatou.com/diary/fonts/*.*', '!./static.diary.ymatou.com/diary/fonts/*.*.*'])
            .pipe(through2.obj(function (file, encoding, next) {
                var content = String(file.contents);
                // console.log(content.substr(0, 80));

                var result = content;
                var md5 = crypto.createHash('md5');
                md5.update(result, 'utf8');
                var version = md5.digest('hex');
                // console.log('md5 ===>' + version);

                // c:\ymt\00diary\node-community\static.diary.ymatou.com\diary\src\demo.js
                var filename = file.history[0].replace(/\\/ig, '/');
                var filepath = filename.replace(/(\.[^\.]+)$/, '.' + version.substr(0, 10) + '$1');

                var filenameMD5 = '/diary/' + (filepath.split('static.diary.ymatou.com/diary/')[1] || '');
                sourcemap.push(filenameMD5);

                fs.createReadStream(filename).pipe(fs.createWriteStream(filepath));
                next();

            }))
            .pipe(gulp.dest('./static.diary.ymatou.com/diary/fonts'))
            .on('end', function () {
                var fontFile = './static.diary.ymatou.com/diary/css/base/icon.css';
                // 创建views/basejs.html
                fs.readFile(fontFile, function (er, data) {
                    if (er) throw er;
                    var fontCSS = String(data);
                    var m, n;

                    // console.log(fontCSS.substr(0, 400));

                    for (var i = 0, len = sourcemap.length; i < len; i++) {
                        console.log('==>> ' + sourcemap[i]);

                        m = sourcemap[i].split('/diary/fonts/')[1];
                        n = m.replace(/\.[a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9]\./ig, '.');

                        console.log('m >>' + m);
                        console.log('n >>' + n);

                        fontCSS = fontCSS.split(n).join(m);
                    }
                    // console.log(fontCSS.substr(0, 400));
                    // 创建views/basejs.html
                    fs.writeFile(fontFile, fontCSS, 'utf8', function (er) {
                        if (er) throw er;
                        console.log(fontFile);
                    });
                });


                console.log('font => icon.css' + '==' + 'OK');

                callback && callback();
            });
    });

}

gulp.task('sourcemapFONTMD5', sourcemapFONTMD5);
