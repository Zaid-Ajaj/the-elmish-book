# Styling With Sass

In Elmish applications, we can add styling to our applications by simply customizing the `style` property of individual UI elements. This is called *inline-styling*. Another way to use styles is to write CSS files and include them in the `index.html` file. I think that if you are writing your application styling from scratch, that inline-styling would be the way to go because the API is nice to work with and you have the power of all the F# language to do all kinds of manipulations and transformations required for the styles.

However, chances are you will not write inline styles from scratch for the entire application. You will either be using some kind of CSS framework like Bulma or React library like AntDesign that has predefined styles or the designers on your team prefer to write the styling in a language that they are most familiar with: old-school CSS.

The CSS language has been around for quite sometime now. Nowadays, there are better tools to build the styling of an application. One such tool is the [Sass](https://sass-lang.com/) language: A modern *superset* of CSS that allows developers to build modular and maintainable style sheets for an application.

Sass has features that are indispensable when it comes to writing styles:
 - Use variables for styles
 - Override values of existing variables in third-party CSS frameworks
 - Nest styles for better selector control
 - Write sheets as modules and importing them from the main module
 - Introduce common mixins of the styles and use them everywhere
 - Superset of CSS means you can write CSS that you already know
 - Compile down to CSS

Learn more about Sass in this [Introductory Guide](https://sass-lang.com/guide)

### Using Sass Loader

In order to integrate Sass styling and use Sass stylesheets in our Elmish applications we will need a webpack loader. Luckily for us, it already exists. We will start off by installing the loader and its dependencies. We will need to install a bunch of things:
 - The `sass-loader` for webpack integration
 - The `node-sass` package which is the actual `Sass -> CSS` compiler
 - Extra loaders `style-loader` and `css-loader` for easily importing the styles directly from the application.

> The relation between `sass-loader` and `node-sass` is very much the same one between `fable-loader` and `fable-compiler`.

We can install these development dependencies in one go like this:
```bash
npm install --save-dev sass-loader node-sass style-loader css-loader
```
Then we add the loader into webpack modules as follows (see highlighted code below):
```js {highlight: ['54-61']}
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
            },

            {
                test: /\.(png|jpe?g|gif)$/i,
                use: "file-loader"
            },

            {
                test: /\.(css|sass|scss)$/i,
                use: [
                    "style-loader",
                    "css-loader",
                    "sass-loader"
                ]
            }]
        }
    }
}
```
Here, there is a rather interesting part: `use: ["style-loader", "css-loader", "sass-loader"]`. This is called *loader chaining*. One loader uses the output of the previous loader to build the final result. In this case, the output is actually not a CSS file but rather a Javascript module which applies the compiled styles once it is imported from a main application.

First things first, let us add a style sheet to the application. I like to add a `styles` directory inside of `src` where I would write my style sheets
```bash {highlight: [7]}
 src
  |
  | -- App.fs
  | -- App.fsproj
  | -- styles
        |
        | -- main.scss
```
I added a file called `main.scss` where I can start writing the style sheet in Sass. One cool thing you can do with them is import an external style sheet write into your application. For example you can add [Google Fonts](https://fonts.google.com/) directly like this:
```css
@import url('https://fonts.googleapis.com/css?family=Quicksand&display=swap');

$primary-color: red;

* {
    font-family: 'Quicksand', sans-serif;
}

body {
    background-color: $primary-color
}
```
Finally you can use it from the application by importing the file as a *"side-effect"*. These so-called side-effectful imports are those that do something when imported but don't return any value. In this case with styles, the side-effect is applying the stylesheet into the application. Other side-effectul modules can be those that add missing APIs into the page, also known as *polyfilling*.

Alright, now just like what we did with the static images, I like to write a specialized module for importing these stylesheets:
```fsharp
[<RequireQualifiedAccess>]
module Stylesheet

open Fable.Core.JsInterop

let inline apply (relativePath: string) : unit = importSideEffects relativePath
```
This time we are using the `importSideEffects` function that imports a side-effectful Javascript module like the one we are importing which will apply the styles in runtime. Afterwards, call the `Stylesheet.apply` function just before bootstrapping the application like this:
```fsharp
Stylesheet.apply "./styles/main.scss"
```
Now the application should have an ugly red background and a nice font on all texts (I didn't say I was a good designer). The cool thing about importing the stylesheet from our F# source code is that it all works with hot reloading and module replacement. Whenever you make changes to your `main.scss` file, the UI updates accordingly automatically.

### Overriding Variables of Third-Party Sass frameworks

In chapters 2 and 3 we used the [Bulma](https://bulma.io) library for styling. We did so by importing the link of the stylesheet directly into the `index.html` page and had all classes from Bulma available for use from within the application. Regardless of the simplicity of this approach, it has quite a number of disadvantages. First of all, we are importing the entire library with everything included, even the classes that don't use which only adds to the latency when downloading the stylesheet. Another problem is that maintaining the version of the package is manual: updating the package to a new version requires going the download page of Bulma and copying the URL that references the latest package. This is unlike how we manage the versions of npm dependencies using just npm. Finally and this is the biggest problem of all when using the direct links to stylesheets is that we cannot modify the defaults of the library.

> I am taking Bulma as an example but this applies to many other CSS frameworks.

Will will now fix these problems and allow our application to override the default colors used by Bulma. First of all, we install Bulma as an *npm package*:
```bash
npm install bulma
```
Once that is finished, we will have Bulma installed locally. The thing is, Bulma is written as Sass modules which means we can import the required modules and override them using custom Sass files, in our case the `main.scss` file that is imported into the application. You can import all modules of Bulma like this:
```css
/* main.scss */
@import "bulma";
```
Now all of Bulma modules are imported into the application. You can cherry pick the modules you want by first including the utilities that other modules require:
```css
/* main.scss */
@import "bulma/sass/utilities/_all.sass";
@import "bulma/sass/elements/button.sass";
```
Only classes related to buttons will be available for use from the application. Learn more about Bulma modules in the [Modularity Overview](https://bulma.io/documentation/overview/modular) from the documentation.

Moving on to the more interesting parts: overriding the defaults of Bulma. Even though the defaults of Bulma are quite nice to begin with, using custom color scheme will give your application a unique look and feel. Bulma has *a lot* of [variables](https://bulma.io/documentation/customize/variables/) and according to the docs: it says "To override any of these variables, just set them before importing Bulma". We can do that:
```css
/* define custom variables and colors */
$purple: #8A4D76;

/* override Bulma's variables */
$primary: $purple;

/* import Bulma modules*/
@import "bulma/sass/utilities/_all.sass";
@import "bulma/sass/elements/button.sass";
```
There you have it! Now the primary turquoise color of Bulma is turned into our version of purple (`#8A4D76`). Overriding more variables from Bulma follows a similar fashion.

### What about LESS?

Another language that compiles to CSS is [Less](http://lesscss.org) which is similar to Sass but is a bit different. You can use Less instead of CSS for the same reasons as to why you would use Sass: your team members are familiar with it or you want to override the behaviour of a third-party framework that is built with Less. The workflow is similar: add the [less-loader](https://github.com/webpack-contrib/less-loader) and its dependencies (the [less](https://github.com/less/less.js) compiler) to your webpack configuration and import a stylesheet file that has extension `.less` from the entry point of your Elmish application.

### Further Reading

Sass and less are entire world of their own. I would recommend you read the official documentation of both [Sass](https://sass-lang.com/documentation) and [Less](http://lesscss.org/features) to learn more about them. Even though if you don't plan on becoming a specialist in either technologies, it would benefit you and your team if you can read the code and be able to do just a tad more than what you would be able to do with CSS.

Last point I want to talk about is the fact that we are compiling the stylesheets into (side-effectful) Javascript modules which are imported at the entry point of the Fable project. Depending on how big your stylesheets are, the main generated bundle can become bigger than it should be and take longer to download on initial loading of the application. In many cases, we would like to *extract* the used stylesheets into a separate CSS output file. This requires a combination of using the awesome [mini-css-extract](https://github.com/webpack-contrib/mini-css-extract-plugin) plugin which is usually included in most webpack templates that you can come across.
