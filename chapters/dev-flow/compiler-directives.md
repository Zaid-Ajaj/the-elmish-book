# Using Compiler Directives

In the previous section, we looked into how we can extract the compilation mode and use it in our webpack configuration file. Now we will propagate the same `mode` variable from the webpack configuration and make it available from *our F# code* as a compiler directive. More specifically, we will introduce the `DEVELOPMENT` compiler directive to allow for conditional compilation blocks which make it possible to compile or not compile certain pieces of code based on the used directive.

First we will need to extend the options for the used `fable-loader` in webpack. Currently it looks like the highlighted lines of code:
```js {highlight: [15, 16, 17, 18]}
const path = require("path")

module.exports = (env, argv) => {
    // extract build mode from command-line
    const mode = argv.mode
    console.log(mode);

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
Notice the `use: "fable-loader"` part. Here we telling webpack to use the `fable-loader` module (which internally uses the Fable compiler) to compile any file or project file that satisfies the given regex in the `test: /\.fs(x|proj)?$/` using default options. These options can be extended as follows:
```js {highlight: [18, 19, 20, 21]}
const path = require("path")

module.exports = (env, argv) => {
    // extract build mode from command-line
    const mode = argv.mode
    console.log(mode);

    return {
        mode: mode,
        entry: "./src/App.fsproj",
        devServer: {
            contentBase: path.join(__dirname, "./dist")
        },
        module: {
            rules: [{
                test: /\.fs(x|proj)?$/,
                use: {
                    loader: "fable-loader",
                    options: {
                        define: mode === "development" ? ["DEVELOPMENT"] : []
                    }
                }
            }]
        }
    }
}
```
The extended options for `fable-loader` allow to customize the compilation workflow of Fable. In this case, we assign `options.define` the value `["DEVELOPMENT]` when in development mode, otherwise just an empty array. This array defines the constants for conditional compilation and can be used from the code as follows:
```fsharp
[<RequireQualifiedAccess>]
module Mode

/// Returns whether the application is in development or production mode
let isDevelopment =
  #if DEVELOPMENT
  true
  #else
  false
  #endif
```
Then you could this `isDevelopment` value in your code to change behavior of certain pieces of code to be optimized in either modes. The best example of this is when you do some logging during development to the console. When in development, you want to see all errors but in production you don't want that. Usually we log errors that happens outside of our control such as HTTP errors when the external services are unavailable for example. This is how we would do it. First define a module for logging functions, for now with only one function that logs the error to the console when in development mode:
```fsharp
[<RequireQualifiedAccess>]
module Log

/// Logs the exception to console when in development.
let developmentError (error: exn) =
    if Mode.isDevelopment
    then Browser.Dom.console.error(error)
```
Then you can use this `Log.developmentError` function when making HTTP requests:
```fsharp
let loadData = async {
    try
        let! data = Data.fromExternalService()
        return DataLoaded (Finished (Ok data))
    with error ->
        Log.developmentError(error)
        return DataLoaded (Finished (Error "Error while retrieving data from the external service"))
}
```
Here we are assuming that the function `Data.fromExternalService()` is *unsafe* and it might throw. Even though it is recommended to always use safe functions in Elmish application, sometimes we use third-party functions that can be problematic and we don't have control over them so we trap them into a `try-catch` block and log the errors into the console if they happen.


### `DEBUG` Already Available

We just learnt how to introduce a new compiler directive called `DEVELOPMENT` into the compilation process and actually use it to determince whether the application is being compiled in development or production mode. This was a nice exercise into getting to the know the `define` option of Fable. However, in this very use-case, it was not necessary. Fable already defines a `DEBUG` compiler directive during development mode without any extra configuration. It can be used just like we did with `DEVELOPMENT`:
```fsharp {highlight: [6]}
[<RequireQualifiedAccess>]
module Mode

/// Returns whether the application is in development or production mode
let isDevelopment =
  #if DEBUG
  true
  #else
  false
  #endif
```
You might think: "Well, this was unnecessary to go through all configuration steps if was already built-in". Understanding how to customize the `define` option and add more values to it is crucial: a lot of times we would want to introduce more variables for different scenarios. One of these scenarios would be when we are running the F# code in a different *environment* other than a browser like in a Node.js environment. This is common when you want to unit-test some functions of your Elmish application and run the unit tests inside a CI server using Node.js. If you are using browser-specific APIs in your code, the tests will fail so you will have to accomodate the functions you use to suit multiple envionments. This is where multiple compiler directives can come into play.