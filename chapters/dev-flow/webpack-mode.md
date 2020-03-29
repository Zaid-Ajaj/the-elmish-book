# Webpack Mode

At the heart of the build pipeline for the entire compilation process stands webpack. The role of webpack is central in Fable project and many types of modern front-end projects. It is the tool that calls the Fable to subsequently compile your F# project into Javascript. The contents of the file `webpack.config.js` define the build configuration for a project. The [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started) template configures the build pipeline in the simplest possible way:
```js {highlight: [4]}
const path = require("path")

module.exports = {
    mode: "none",
    entry: "./src/App.fsproj",
    devServer: {
        contentBase: path.join(__dirname, "./dist")
    },
    module: {
        rules: [{
            test: /\.fs(x|proj)?$/,
            use: "fable-loader"
        }]
    }
}
```

> The webpack configuration file is actually a Javascript module that runs when webpack starts and returns (exports) the configured options at the end.

Webpack includes many more options to fine-tune the build pipeline. One of the most important variables to configure is the [webpack mode](https://webpack.js.org/configuration/mode/) highlighted above. Mode can have values `none`, `development` or `production`. Using either `development` or `production` will *optimize* the compilation process significantly for the configured environment: using 'production' for example optimizes the build pipeline for production use by removing unused code from the generated Javascript bundle and obfuscates the code. Likewise, using `development` mode will make the project nicer to work with during development and makes that information available for the application to use in the code so that you can execute development-specific code.

To get a taste of just how important `mode` is, clone the [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started) template from scratch and build it using:
```bash
cd elmish-getting-started
npm install
npm run build
```
At the time of writing using webpack v4.38.0, the generated `main.js` file is 1414KB big! that is 1.4 megabytes for the simple counter application before we even get started to write more code or add more libraries. This size of an application is simply not acceptable in production because the users have to download the application before they can use it: time is wasted not just on downloading but also parsing and evaluating 1.4MB of Javascript code.

Now set mode to `production` and run `npm run build` again. The generated `main.js` has now become 161KB! That is just crazy; webpack used all the tricks of the trade to shave off every possible bit of unused code in a process called tree-shaking then made the bundle even smaller during obfuscation by removing comments, whitespace and renaming functions and variables to a very short equivalent.

### Automatically Configuring Mode

Now while you are writing your application, you don't to want to manually change the mode from `development` to `production` manually. First of all because it is tedious and because we want to configure multiple things based on the mode. To do that, we can provide the `mode` from the place where we call webpack: npm scripts. There, we can simply provide the `mode` as a command-line argument for webpack:
```json {highlight: [4, 5]}
{
  "private": true,
  "scripts": {
    "start": "webpack-dev-server --mode development",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "react": "^16.8.0",
    "react-dom": "^16.8.0"
  },
  "devDependencies": {
    "@babel/core": "^7.1.2",
    "fable-compiler": "^2.4.16",
    "fable-loader": "^2.1.8",
    "webpack": "^4.38.0",
    "webpack-cli": "^3.3.6",
    "webpack-dev-server": "^3.7.2"
  }
}
```
This way, when using `npm run build`, the npm script will provide the `production` mode for webpack. Likewise, when we run `npm start` to spin up the webpack development server, we provide the `development` mode for webpack. However, webpack will not pick up those values automagically, we need to extract them from the command-line arguments and use them in the configuration. This will require a bit of a change in the `webpack.config.js` file:
```js {highlight: [3, 5, 8]}
const path = require("path")

module.exports = (env, argv) => {
    // extract build mode from command-line
    const mode = argv.mode

    return {
        mode: mode,
        entry: "./src/App.fsproj",
        devServer: {
            contentBase: path.join(__dirname, "./dist")
        },
        module: {
            rules: [{
                test: /\.fs(x|proj)?$/,
                use: "fable-loader"
            }]
        }
    }
}
```
Here, the configuration module doesn't export the configuration object anymore but rather exports a *function* that returns the build configuration. That function takes in the command-line arguments in the form of `argv` parameter from which we extract the `mode` and supply it to the returned object.

That is pretty much it. We have optimized the workflow to use the proper build mode based on the npm script that we run. Using `npm run build` now passes the `production` mode and using `npm start` passes `development` mode to webpack automatically.

The extracted mode will form the basis for fine-tuning the build in the coming chapters. To put the cherry on top, you can add a bit more logging to see for yourself in the terminal or shell what mode you provided:
```js {highlight: [6]}
const path = require("path")

module.exports = (env, argv) => {
    // extract build mode from command-line
    const mode = argv.mode
    console.log("Building application in " + mode + " mode");
    return {
        mode: mode,
        entry: "./src/App.fsproj",
        devServer: {
            contentBase: path.join(__dirname, "./dist")
        },
        module: {
            rules: [{
                test: /\.fs(x|proj)?$/,
                use: "fable-loader"
            }]
        }
    }
}
```
