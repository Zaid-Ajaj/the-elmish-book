# Development Mode

Before we dive any further, we have to talk about the development workflow. So far we were building the project using the commands `npm install` and then `npm run build`. These commands execute a *full build* which is what you are used to whenever you compile an F# project in .NET. However, when we are building web applications, recompiling the whole project with every little change will result in a very slow iteration cycle. Javascript developers have already figured out that they want a development tool that picks up only the code that was changed and refreshes the web page: enter webpack development server.

### Webpack development server

Along with the *full build* configuration in file `webpack.config.js` there is a section called `devServer`:
```js {highlight: [6, 7, 8]}
var path = require("path");

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
Within the section, you see the `contentBase` options pointing to the `dist` directory. These options are the configuration for the development server of webpack. This setup says: "Start a local server that serves files from the `dist` directory". The development server runs on port 8080 by default. To use the development server, run the commands:
```bash
npm install
npm start
```
The command `npm start` will start the development server of webpack, compiles the project *only once* and will keep watching the project files for any changes. You can then navigate to `http://localhost:8080` to see your project running.

> Learn how `npm start` relates to webpack development server in the paragraph [Npm Scripts](node-packages#npm-scripts) of section [Node.js Packages](node-packages)

Once you start modifying your F# source code, only a subset of the project will be recompiled: the code you changed and other pieces that depend on the code you changed. After a successful recompilation cycle, webpack will refresh the browser for you to see the changes you made.

These recompilation cycles are very fast, a lot faster than a full build and make for a pleasant development workflow. From now on, I will assume that we will be working in development mode.
