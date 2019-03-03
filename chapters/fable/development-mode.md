# Development Mode

Before we dive any further we have to talk about the development workflow. So far we were building the project using the commands `npm install` and then `npm run build`. These commands execute a *full build* which is what you are used to whenever you compile a F# project in dotnet. However, when we are building web applications, recompiling the whole project with every little change will result in a very slow iteration cycle. Javascript developers have already figured out that they want a development tool that picks up only the code that was changed and refreshes the web page: enter webpack development server.  

### Webpack development server

Along with the *full build* configuration in file `webpack.config.js` there is a section called `devServer`:
```js {highlight: ['10-13']}
var path = require("path");

module.exports = {
    mode: "development",
    entry: "./src/App.fsproj",
    output: {
        path: path.join(__dirname, "./public"),
        filename: "bundle.js",
    },
    devServer: {
        contentBase: "./public",
        port: 8080,
    },
    module: {
        rules: [{
            test: /\.fs(x|proj)?$/,
            use: "fable-loader"
        }]
    }
}
```
Within the section, you see the `contentBase` options pointing to the `public` directory and there a `port` option as well. These options are the configuration for the development server of webpack. This setup says: "Start a local server that serves files from the `public` directory and run this server on port 8080". To use the development server, run the commands:
```bash
npm install # if you haven't already
npm start
```
The command `npm start` will start the development server, compiles the project *only once* and will keep watching the project files for any changes. You can then navigate to `http://localhost:8080` to see your project running. 

Once you start modifying your F# source code, only a subset of the project will be recompiled: the code you changed and other pieces of the code that depend on the code you changed. After a succesful recompilation cycle, the browser is refreshed. 

These recompilation cycles are very fast, a lot faster that a full build and make for a pleasant development workflow. From now on, I will assume that we will be working in development mode. 