const path = require( 'path' );
const webpack = require( 'webpack' );

const CalypsoMinify = require( '@automattic/calypso-build/webpack/minify' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const DuplicatePackageCheckerWebpackPlugin = require( 'duplicate-package-checker-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const MiniCSSWithRTLPlugin = require( '@automattic/calypso-build/webpack/mini-css-with-rtl' );
const WebpackRTLPlugin = require( '@automattic/webpack-rtl-plugin' );

// Calypso's Minify doesn't default to preserving the WordPress i18n functions. Sigh.
const Minify = options =>
	CalypsoMinify( {
		...options,
		terserOptions: {
			mangle: { reserved: [ '__', '_n', '_nx', '_x' ] },
			...options?.terserOptions,
		},
	} );

// See README.md for explanations of all these settings.
// If you change something here, you'll probably need to update README.md to match.
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = ! isProduction;
const mode = isProduction ? 'production' : 'development';
const devtool = isProduction ? false : 'eval-cheap-module-source-map';
const output = {
	filename: '[name].min.js',
	chunkFilename: '[name]-[id].H[contenthash:20].min.js',
};
const optimization = {
	minimize: isProduction,
	minimizer: Minify(),
	concatenateModules: false,
};
const resolve = {
	extensions: [ '.js', '.jsx', '.ts', '.tsx', '...' ],
};

/****** Plugins ******/

const DefinePlugin = defines => [
	new webpack.DefinePlugin( {
		'process.env.FORCE_REDUCED_MOTION': 'false',
		global: 'window',
		...defines,
	} ),
];

const MomentLocaleIgnorePlugin = () => [
	new webpack.IgnorePlugin( {
		resourceRegExp: /^\.\/locale$/,
		contextRegExp: /moment$/,
	} ),
];

const MyMiniCssExtractPlugin = options => [ new MiniCssExtractPlugin( options ) ];

const RtlCssPlugins = options => [
	new MiniCSSWithRTLPlugin( options?.miniCssWithRtlOpts ),
	new WebpackRTLPlugin( options?.webpackRtlPluginOpts ),
];

const DuplicatePackageCheckerPlugin = options => [
	new DuplicatePackageCheckerWebpackPlugin( options ),
];

const DependencyExtractionPlugin = options => [ new DependencyExtractionWebpackPlugin( options ) ];

const StandardPlugins = options => {
	const exclude = new Set( options?.exclude || [] );
	return [
		...( exclude.has( 'DefinePlugin' ) ? [] : DefinePlugin() ),
		...( exclude.has( 'MomentLocaleIgnorePlugin' ) ? [] : MomentLocaleIgnorePlugin() ),
		...( exclude.has( 'MiniCssExtractPlugin' ) ? [] : MyMiniCssExtractPlugin() ),
		...( exclude.has( 'RtlCssPlugins' ) ? [] : RtlCssPlugins() ),
		...( exclude.has( 'DuplicatePackageCheckerPlugin' ) ? [] : DuplicatePackageCheckerPlugin() ),
		...( exclude.has( 'DependencyExtractionPlugin' ) ? [] : DependencyExtractionPlugin() ),
	];
};

/****** Module rules and loaders ******/

const TranspileRule = require( './webpack/transpile-rule' );
const FileRule = require( './webpack/file-rule' );
const MiniCssExtractLoader = options => ( {
	loader: MiniCssExtractPlugin.loader,
	options: options,
} );
const CssLoader = options => ( {
	loader: require.resolve( 'css-loader' ),
	options: {
		// By default we do not want css-loader to try to handle absolute paths.
		url: urlpath => ! urlpath.startsWith( '/' ),
		...options,
	},
} );
const CssCacheLoader = options => ( {
	loader: require.resolve( 'cache-loader' ),
	options: {
		cacheDirectory: path.resolve( '.cache/css-loader' ),
		...options,
	},
} );

// TODO: SASS loader and CSS loaders

// Note: For this cjs module to be used with named exports in an mjs context, modules.exports
// needs to contain only simple variables like `a` or `a: b`. Define anything more complex
// as a variable above, then use the variable here.
// @see https://github.com/nodejs/node/blob/master/deps/cjs-module-lexer/README.md#exports-object-assignment
module.exports = {
	webpack,
	isProduction,
	isDevelopment,
	mode,
	devtool,
	output,
	optimization,
	Minify,
	resolve,
	// Plugins.
	StandardPlugins,
	DefinePlugin,
	MomentLocaleIgnorePlugin,
	MiniCssExtractPlugin: MyMiniCssExtractPlugin,
	RtlCssPlugins,
	DependencyExtractionPlugin,
	DuplicatePackageCheckerPlugin,
	// Module rules and loaders.
	TranspileRule,
	FileRule,
	MiniCssExtractLoader,
	CssLoader,
	CssCacheLoader,
};
