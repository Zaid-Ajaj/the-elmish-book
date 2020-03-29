# Hot Module Replacement

Very early on in chapter 1, we learnt about [Development Mode](../fable/development-mode) via the webpack development server. This server runs our front-end application and watches for changes in source files. Once any change is detected, only that part of the application and its dependencies are recompiled really fast and the page is refreshed automatically. However, this automatic refresh of the page is not optimal because it is a full-refresh: the application loses its state and data when the page refreshes itself.

Image you have an application where you first have to login to get to the page you are currently working on. Every time you make a change in the source code like changing the font size of some element, the page is refreshed and you are reset back to the login page where you have to login again to see your changes.

Here is where *hot module replacement* (HMR for short) comes into play. Instead of refreshing the entire page when some piece of code changes, only that piece is recompiled and *re-executed separately* to reflect the changes without needing a full page refresh.

Consider the following example **without** HMR where changing the source code resets the state:

<div style="margin-top: 40px; margin-bottom:40px; width:100%">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/dev-flow/without-hmr.gif" />
  </div>
</div>

However, when Hot Module Replacement is enabled, it is a whole new level of greatness for developer experience:

<div style="margin-top: 40px; margin-bottom:40px; width:100%">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/dev-flow/with-hmr.gif" />
  </div>
</div>

As you can see, changing certain pieces of the user interface updates automatically while *maintaining the state* without full refresh. This makes prototyping the user interface a real joy and once you get used, you never want to go back.

Now that I have hyped up this feature, let us see how to enable it in our project. Hot Module Replacement is enabled by just adding a webpack plugin. Just like with dotenv files, we will add the plugin to webpack for HMR. However, this time it will be a *development-specific* plugin: only available while developing because we don't want to enable it with our production builds since it adds some extra code to the bundle to communicate with webpack development server via web sockets.

We can add import by first importing the webpack module in the beginning of the `webpack.config.js`file
```js
var webpack = require("webpack");
```
Then, we change the plugins sections of the configuration from this:
```js {highlight: ['18-24']}
const path = require("path")
const DotenvPlugin = require("dotenv-webpack")
var webpack = require("webpack");

module.exports = (env, argv) => {
    // extract build mode from command-line
    const mode = argv.mode
    console.log(mode);

    return {
        mode: mode,
        entry: "./src/App.fsproj",
        devServer: {
            contentBase: path.join(__dirname, "./dist"),
            hot: true,
            inline: true
        },
        plugins: [
          new DotenvPlugin({
              path: path.join(__dirname, ".env"),
              silent: true,
              systemvars: true
          }),
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
To the following where we initialize the HMR plugin into the plugins array when are in development:
```js {highlight: ['18-37']}
const path = require("path")
const DotenvPlugin = require("dotenv-webpack")
var webpack = require("webpack");

module.exports = (env, argv) => {
    // extract build mode from command-line
    const mode = argv.mode
    console.log(mode);

    return {
        mode: mode,
        entry: "./src/App.fsproj",
        devServer: {
            contentBase: path.join(__dirname, "./dist"),
            hot: true,
            inline: true
        },
        plugins: mode === "development" ?
            // development mode plugins
            [
                new DotenvPlugin({
                    path: path.join(__dirname, ".env"),
                    silent: true,
                    systemvars: true
                }),

                new webpack.HotModuleReplacementPlugin()
            ]
            :
            // production mode plugins
            [
                new DotenvPlugin({
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
What is going on there? It is a simple check: if we are in development mode, the configured plugins are the dotenv and HMR plugin, otherwise in production just the dotenv plugin. Now you can easily add mode-specific plugins to your webpack configuration file.

Now adding just the HMR plugin is not enough to make our Elmish programs maintain their state while modifying the code. We have to modify the bootstrapping of the Elmish program a bit by first installing a package called `Fable.Elmish.HMR` like this:
```bash
cd src
dotnet add package Fable.Elmish.HMR
```
After installation completes, go to the `App.fs` F# file where the root program is bootstrapped like this at the end of the file:
```fsharp
Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```
Then modify it simply like this:
```fsharp {highlight: [1]}
open Elmish.HMR

Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```
That's it! Make absolutely sure that you open the `Elmish.HMR` namespace as the last one just before bootstrapping the root program. What happens is that functions from the `Program` module are *shadowed* by functions coming from the namespace `Elmish.HMR` which is why `Elmish.HMR` has to be the last opened namespace (before `Elmish` and `Elmish.React` anyways) when enabling Hot Module Replacement in our application.

Since the bootstrapping of the program currently always enables HMR in Elmish, we can go one step further and make it development-specific like we did with the plugin:
```fsharp
#if !DEBUG
open Elmish
open Elmish.React

Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run

#else
open Elmish
open Elmish.React
open Elmish.HMR

Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
#endif
```
That is it, we have enabled one of most useful features in web development and the template we started with is starting to look more like a very modern one used in real-world applications.
