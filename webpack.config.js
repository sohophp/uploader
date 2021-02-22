const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {CleanWebpackPlugin} = require("clean-webpack-plugin");

const config = {
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                sourceMap: true,
                extractComments: true,
                uglifyOptions: {
                    ie8: false,
                }
            })
        ]
    },
    performance: {
        maxAssetSize: 30000000,
        maxEntrypointSize: 50000000
    },
    entry: {
        'soho-uploader': ['./src/soho-uploader.js']
    },
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: '[name].js'
    },
    devtool: 'source-map',//'cheap-source-map',
    mode: 'development',//development,production
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": [
                            [
                                "@babel/preset-env"
                            ]
                        ],
                        "plugins": [
                            "@babel/plugin-transform-runtime"
                        ]
                    }
                }
            },
            {
                test: require.resolve('jquery'),
                use: [{
                    loader: 'expose-loader',
                    options: 'jQuery'
                }, {
                    loader: 'expose-loader',
                    options: '$'
                }]
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: true,
                            ident: 'postcss',
                            plugins: (loader) => [
                                require('postcss-import')({root: loader.resourcePath}),
                                require('postcss-cssnext')(),
                                require('cssnano')()
                            ]
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|gif|ico)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'images/'
                        }
                    }
                ]
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts/'
                        }
                    }
                ]
            }
        ]
    },

    resolve: {
        extensions: ['.js', '.ts', '.scss']
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
            // chunkFilename: '[id].css',
        }),
        new CleanWebpackPlugin()
    ]
};

module.exports = (env, argv) => {
    config.mode = argv.mode === 'production' ? 'production' : 'development';
    if (config.mode === 'development') {
        config.devtool = 'source-map';
        config.optimization.minimizer = [];
        config.module.rules.splice(0, 1);
    } else {
        config.devtool = 'source-map';
        // config.devtool = 'cheap-source-map';
    }
    return config;
};
