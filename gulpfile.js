let {src, dest} = require('gulp');
let gulp = require('gulp');
let browsersync = require('browser-sync').create();
let del = require('del');
let scss = require('gulp-sass');
let autoprefixer = require('gulp-autoprefixer');
let groupMedia = require('gulp-group-css-media-queries');
let cleanCss = require('gulp-clean-css');
let rename = require('gulp-rename');
let uglify = require('gulp-uglify-es').default;
let concat = require('gulp-concat');
let imagemin = require('gulp-imagemin');
let webp = require('gulp-webp');
let ttf2woff = require('gulp-ttf2woff');
let ttf2woff2 = require('gulp-ttf2woff2');

let distFolder = 'dist';
let srcFolder = '#src';

let path = {
	build: {
		html: distFolder + '/',
		css: distFolder + '/css/',
		js: distFolder + '/js/',
		img: distFolder + '/img/',
		fonts: distFolder + '/fonts/',
	},
	src: {
		html: srcFolder + '/*.html',
		css: srcFolder + '/scss/style.scss',
		js: srcFolder + '/js/main.js',
		img: srcFolder + '/img/**/*.*',
		fonts: srcFolder + '/fonts/*.ttf',
		fontsconverted: srcFolder + '/fonts/*.+(woff|woff2)'
	},
	watch: {
		html: srcFolder + '/**/*.html',
		css: srcFolder + '/scss/**/*.scss',
		js: srcFolder + '/js/**/*.js',
		img: srcFolder + '/img/**/*.*'
	},
	clean: './' + distFolder + '/'
}

// Таск для html
function html() {
	return src(path.src.html)
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream())
}

// Таск для fonts
function fonts() {
	return src(path.src.fontsconverted)
		.pipe(dest(path.build.fonts))
}

// Таск для fonts woff2, woff
function fontsconvert() {
	src(path.src.fonts)
		.pipe(ttf2woff())
		.pipe(dest('#src/fonts/'))
	return src(path.src.fonts)
		.pipe(ttf2woff2())
		.pipe(dest('#src/fonts/'))
}

// Таск для css dev
function cssdev() {
	return src(path.src.css)
		.pipe(scss({outputStyle: 'compressed'}))
		.pipe(rename({extname: ".min.css"}))
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream())
}

// Таск для css build
function cssbuild() {
	return src(path.src.css)
		.pipe(scss({outputStyle: 'expanded'}))
		.pipe(groupMedia())
		.pipe(autoprefixer({
		 	overrideBrowserslist: ["last 5 versions"],
		 	cascade: false
		}))
		.pipe(dest(path.build.css))
		.pipe(rename({extname: ".min.css"}))
		.pipe(cleanCss())
		.pipe(dest(path.build.css))
}

// Собираем библиотеку css
function cssLib() {
	return src([
			'node_modules/normalize.css/normalize.css'
		])
		.pipe(concat('_lib.scss'))
		.pipe(dest('#src/scss'))
}

// Таск для js
function js() {
	return src(path.src.js)
		.pipe(uglify())
		.pipe(rename({extname: '.min.js'}))
		.pipe(dest(path.build.js))
		.pipe(browsersync.stream())
}

// Собираем библиотеку js
function jsLib() {
	return src([
			'node_modules/slick-carousel/slick/slick.js'
		])
		.pipe(concat('lib.min.js'))
		.pipe(uglify())
		.pipe(dest(path.build.js))
}

// Оптимизация изображений
function images() {
	return src(path.src.img)
		.pipe(webp({quality: 70}))
		.pipe(dest(path.build.img))
		.pipe(src(path.src.img))
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{ removeViewBox: false }],
			interlaced: true,
			optimizationLevel: 3 //0 to 7
		}))
		.pipe(dest(path.build.img))
		.pipe(browsersync.stream())
}

// Наблюдение за изменениями
function watcher() {
	browsersync.init({
		server: {
			baseDir: './' + distFolder + '/'
		},
		notify: false
	})
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], cssdev);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.img], images);
}

// Удалить папку dist
function clean() {
	return del(path.clean);
}

let build = gulp.series(clean, cssLib, gulp.parallel(jsLib, js, cssbuild, html, images, fonts));
let dev = gulp.series(clean, cssLib, gulp.parallel(jsLib, js, cssdev, html, images, fonts), watcher);

exports.images = images;
exports.js = js;
exports.jsLib = jsLib;
exports.cssdev = cssdev;
exports.cssbuild = cssbuild;
exports.cssLib = cssLib;
exports.html = html;
exports.fonts = fonts;
exports.fontsconvert = fontsconvert;
exports.build = build;
exports.default = dev;