const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = () => {
    return {
        entry: './src/moduleIndex.ts',
        output: {
            filename: 'moduleIndex.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'JVxReactUI',
            libraryTarget: 'umd'
        },
        devtool: 'inline-source-map',
        plugins: [
            new MiniCssExtractPlugin({
                filename: '[name].css',
                chunkFilename: '[id].css'
            }),
            new CircularDependencyPlugin({
                exclude: /a\.js|node_modules/,
                include: /dir/,
                failOnError: true,
                allowAsyncCycles: false,
                cwd: process.cwd(),
            }),
            new CleanWebpackPlugin()
        ],
        module: {
            rules: [
                {
                    test: /\.(ts|js)x?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-typescript',
                                '@babel/preset-react'
                            ],
                            plugins: ['@babel/plugin-proposal-class-properties']
                        }
                    }
                },
                {
                    test: /\.s?[ac]ss$/i,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                        },
                        'css-loader',
                        'sass-loader',
                    ],
                },
                {
                    test: /\.(png|svg|jpg|gif|webP)$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            name: 'resources/assets/[name].[ext]',
                        }
                    },
                },
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            name: 'resources/fonts/[name].[ext]',
                        }
                    },
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            compilerOptions: {
                                "noEmit": false
                            }
                        }
                    }
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.json'],
            alias: {
                react: path.resolve('./node_modules/react'),
                assets: path.resolve('./src/assests')
            }
        },
        externals: {
            react: "react",
            "react-dom": "react-dom"
        }
    }
}