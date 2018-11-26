// モジュール読み込み
var gulp = require('gulp');								// gulpを呼び出す
var browser = require('browser-sync');					// LiveReload環境構築
var connect = require('gulp-connect-php');				// phpを扱うようにする
var plumber = require('gulp-plumber');					// watch中、エラーで処理を止めないようにする
var watch = require('gulp-watch');						// 追加ファイルも監視対象に追加する
var notify = require('gulp-notify');					// エラーメッセージをデスクトップ通知

var sass = require('gulp-sass');						// gulpでのsass利用
var pleeease = require('gulp-pleeease');				// sassやベンダープレフィックス付与、min化ができる
var uglify = require('gulp-uglify');					// JavaScriptの圧縮

var changed  = require('gulp-changed');					// 変更されたファイルだけを処理
var imagemin = require('gulp-imagemin');				// 画像最適化
var pngquant = require('imagemin-pngquant');			// png最適化
var mozjpeg  = require('imagemin-mozjpeg');				// jpg最適化
var jpegrec = require('imagemin-jpeg-recompress');		// jpg最適化 - macだと「imagemin-mozjpeg」がエラー起こすのでこっち使った方が良い
var imageminGif = require('imagemin-gifsicle');			// gif圧縮
var svgmin = require('gulp-svgmin');					// svg圧縮

// 処理前と処理後のディレクトリを定義
var paths = {
	srcDir : './src',						// 処理前
	dstDir : './public'						// 処理後
}

// サーバー実行
gulp.task("server", function() {
	connect.server({
		base:'./public',					// ベースとなるフォルダ
		port: 8000,
		bin: 'D:/xampp/php/php.exe',		// [win]xamppのphp.exe （xamppのApacheの起動は不要。必要があればパスを通す。）
		ini: 'D:/xampp/php/php.ini'			// [win]xamppのphp.ini
		// bin: '/Applications/XAMPP/xamppfiles/bin/php',       // [mac]xamppのphp.exe （xamppのApacheの起動は不要。必要があればパスを通す。）
		// ini: '/Applications/XAMPP/xamppfiles/etc/php.ini'    // [mac]xamppのphp.ini
	}, function (){
		browser({
			// open: 'external',			// Can be true, local, external, ui, ui-external, tunnel or false
			// tunnel: true,				// 外部アクセス制御
			proxy: 'localhost:8000/',		// proxyを設定することによってこの指定ページを表示するようになる
			files: './public/**/*.*',		// 監視対象のファイル
			port: 3000						// port番号
		});
	});
});

// jsファイル圧縮
gulp.task('js', function() {
	var srcGlob = paths.srcDir + '/js/*.js';
	var dstGlob = paths.dstDir + '/js';

	gulp.src(srcGlob)
		.pipe(uglify())
		.pipe(gulp.dest(dstGlob))
		// .pipe(browser.reload({stream:true}))
});

// sass
gulp.task('sass', function() {					// gulp.task(“タスク名”,function() {});でタスクの登録をおこないます。
	var srcGlob = paths.srcDir + '/sass/**/*.scss';
	var dstGlob = paths.dstDir + '/css';

	gulp.src(srcGlob)				// gulp.src(“MiniMatchパターン”)で読み出したいファイルを指定します。
		.pipe(plumber({
			// エラーメッセージをデスクトップ通知
			errorHandler: notify.onError('<%= error.message %>')
		}))							// watch中、エラーで処理を止めないようにする
		.pipe(sass({
			// 「node-reset-scss」から reset.css を入れ込む 「@import '_reset';」
			includePaths: require('node-reset-scss').includePath
		}))
		.pipe(pleeease({
			sass: false,						// trueにするとsass表記部分が完全に分離。falseだとsass表記に似せて出力
			autoprefixer: true,					// ベンダープレフィックス付与するか
				// 設定上書き
				// autoprefixer: { 'browsers': ['last 2 versions', 'ie 6', 'ie 7', 'ie 8', 'Safari 4', 'Android 2.3', 'iOS 4'] },
			minifier: false,					// 圧縮するか
			mqpacker: true						// メディアクエリでまとめるか
		}))
		.pipe(gulp.dest(dstGlob))		// gulp.dest(“出力先”)で出力先に処理を施したファイルを出力します。
});

// 画像最適化
gulp.task('imagemin', function(){
	var srcGlob = paths.srcDir + '/images/*.+(jpg|gif)';
	var dstGlob = paths.dstDir + '/images/';

	// jpg・gif
	gulp.src(srcGlob)
		.pipe(changed(dstGlob))					// 処理前・処理後で違いのあるものをチェック
		.pipe(imagemin([
			// gif
			imageminGif({
				interlaced: false,				// 
				optimizationLevel: 3,			// 1 - 3
				colors: 100						// 2 - 256
			}),

			// jpg
			// imagemin.jpegtran({quality:85, progressive: true})	// mozjpegはmacでエラーが発生するためjpegtranを利用する（少し圧縮率が低い）
			// jpegrec({quality:'low', min:40, max:85})				// [macではこちらを有効にする] quality: low, midium, high, veryhigh
			mozjpeg({quality:85, progressive: true})				// [winではこちらを有効にする]
		]))
		.pipe(gulp.dest(dstGlob));

	// png （画像が暗くなる現象対策のためpngだけ切り出し）
	srcGlob = paths.srcDir + '/images/*.+(png)';
	gulp.src(srcGlob)
		.pipe(changed(dstGlob))					// 処理前・処理後で違いのあるものをチェック
		.pipe(imagemin(
			[pngquant({quality: '40-80', speed: 1})] //40-70
		))
		.pipe(imagemin()) // pngquantで圧縮した画像が暗くなる現象対策（余計なガンマ情報を削除）
		.pipe(gulp.dest(dstGlob));
});

// svg画像の圧縮タスク
// $ gulp svgmin
gulp.task('svgmin', function(){
	var srcGlob = paths.srcDir + '/images/*.+(svg)';
	var dstGlob = paths.dstDir + '/images/';
	gulp.src(srcGlob)
		.pipe(changed(dstGlob))
		.pipe(svgmin())
		.pipe(gulp.dest(dstGlob));
});

// 「gulp」で実行のタスク （ファイルの監視/js/sass、サーバー実行）
gulp.task('default',['imagemin','svgmin','js','sass','server'], function() {
	//ファイルの監視をして変化があったらタスクを実行
	gulp.watch([paths.srcDir + '/js/*.js','!./src/js/bubdle/**/*.js'],['js']);
	// gulp.watch(['./src/js/**/*.js'],['js']);
	// gulp.watch('./src/sass/**/*.scss',['sass']);
	gulp.watch([paths.srcDir + '/sass/**/*.scss'],['sass']);

	// 既存のファイルに変化があったとき
	gulp.watch([paths.srcDir + '/images/**/*'],['imagemin','svgmin']);
	// 新規ファイルが追加されたとき
	return watch([paths.srcDir + '/images/**/*'], () => {
		return gulp.start(['imagemin','svgmin']);
	});
});
