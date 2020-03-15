# Using Configuration Variables

In many applications, hard-coding configuration values into the source code is frowned upon. This is because hard-coded values sometimes have to be configured differently from machine to machine. Moreover, it is not secure to publish the values into the repository source code as per [The Twelve-Factor App](https://12factor.net/config) config recommendations.

It might be an API key to some service that your application uses or it can be a version number that is only available in the environment variables of your CI server. Instead of using hard-coded configuration values, we use configuration variables: these are key-value pairs that are configurable from outside your application source code but they can be made available during runtime.

In this section, we will make it possible to use configuration variables inside the [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started) template repository. For the sake of simplicity, we will make the *color* and *text* of a welcome message configurable.

Suppose we had the following `render` function:
```fsharp
let render state dispatch =
    Html.h1 [
        prop.style [ style.color.black ]
        prop.text "Welcome to Fable"
    ]
```
We want to make the both the text used in `prop.text` and the color used in `prop.style` configurable and not hard-coded like they are now. To do that, we need some *source* for these variables to come from. A common way to define these configuration variables in front-end applications is to use the so-called `dotenv` files. These are files that have extension `.env` (hence the name) which are specifically made to define key-value pairs in the format where each line is written as `{KEY}={VALUE}`:
```
KEY=VALUE
MESSAGE=Hello from F#
MESSAGE_COLOR=red
```
Start by creating such file named `.env` *next* to the `webpack.config.js` file with the following content:
```
MESSAGE=Welcome to Fable from config
MESSAGE_COLOR=blue
```
Even though we don't use any secrets or API keys in this example, it is good pratice to put this file in the list of `git-ignored` files and only use it during development per developer machine. Later on if you are building your application inside of a CI server, the variables will be loaded from the configured envionment variables which every CI server supports instead of the values in this file.

After you have added file, you need to install a webpack plugin that will load the key-pair values as well as all environment variables and make them available for use from within the application. Install this plugin using `npm`:
```bash
npm install --save-dev dotenv-webpack
```
After installation completes, configure the plugin in `webpack.config.js`:
```js {highlight: [2, '15-21']}
const path = require("path")
const DotenvPlugin = require("dotenv-webpack")

module.exports = module.exports = (env, argv) => {
    // extract build mode from command-line
    const mode = argv.mode
    console.log(mode);

    return {
        mode: mode,
        entry: "./src/App.fsproj",
        devServer: {
            contentBase: path.join(__dirname, "./dist")
        },
        plugins: [
            new  DotenvPlugin({
                path: path.join(__dirname, ".env"),
                silent: true,
                systemvars: true
            })
        ],
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
That is it! These variables are now available for use from within the application. To use and extract a value from the variables using a key, we do it like this in Javascript:
```js
const value = process.env["KEY"]
```
However, there is no such module to use from F# in Fable. We can use a bit of Fable interop capabilities with Javascript to write a function that takes a key and returns the value of a configured variable if it exists or returns an empty string otherwise:
```fsharp
[<RequireQualifiedAccess>]
module Config

open Fable.Core
open Fable.Core.JsInterop

/// Returns the value of a configured variable using its key.
/// Retursn empty string when the value is not defined
[<Emit("process.env[$0] ? process.env[$0] : ''")>]
let variable (key: string) : string = jsNative
```
I promise to cover Fable and Javascript interop in a separate chapter. Since it is a very big and important topic, I want to cover it properly and do it justice. One section won't be enough for it so please bear with me for now and believe that the function `Config.variable` will return you the value of configured variable if it exists in the `.env` file or if it is available in the environment where the application was compiled.

You can the function like this in your `render` functions or any other place for that matter:
```fsharp
let render state dispatch =
    Html.h1 [
        prop.style [ style.color(Config.variable "MESSAGE_COLOR") ]
        prop.text (Config.variable "MESSAGE")
    ]
```
