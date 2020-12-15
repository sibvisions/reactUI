const fs = require('fs')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');

let inputObj = {};

async function tsFilesToInput(dir) {
    try {
        const files = await fs.promises.readdir(dir);
        for (const file of files) {
            const filePath = (process.platform === 'win32') ? path.win32.join(dir, file) : path.posix.join(dir, file);
            const stat = await fs.promises.stat(filePath)
            if (stat.isFile() && path.extname(filePath) === '.tsx') {
                let correctedPath
                if (process.platform === 'win32') {
                    correctedPath = filePath.replace(/\\/g, '/');
                }
                else {
                    correctedPath = filePath;
                }
                let inputKey = correctedPath.split('src/').pop().split('.')[0];
                inputObj[inputKey] = './' + correctedPath.split(/(?=src)/).pop();
            }
            else if (stat.isDirectory()) {
                await tsFilesToInput(filePath);
            }
        }
        return inputObj
    }
    catch (e) {
        console.error("THROWN ERROR", e)
    }
}

module.exports = () => {
    return {
        //entry: await tsFilesToInput('./src'),
        entry: './src/moduleIndex.ts',
        output: {
            filename: 'moduleIndex.js',
            path: path.resolve(__dirname, 'dist'),
            //filename: '[name].js',
            library: 'JVXReactUI',
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
                    use: 'ts-loader',
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