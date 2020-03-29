# Importing Static Images

In this section, we pick the template project from we left it off after integrating [Hot Module Replacement](hot-module-replacement) and enable it to import static images into the project. First things first, what does it even mean to import an image into our Elmish project? Imagine having the following structure of source code in an Elmish project:
```bash {highlight: [3]}
 src
  |
  | -- fable_logo.png
  | -- App.fs
  | -- App.fsproj
```
How would you be able to *reference* the `fable_logo.png` file from your source files in `App.fs`? You can try writing this:
```fsharp
// App.fs

Html.img [
    prop.src "./fable_logo.png"
    prop.alt "Fable Logo"
]
```
It will not work: the problem comes from the fact that after compiling the project, the source files are turned into a single Javascript file and the relative paths that were used in the source files wouldn't mean anything at that point to the generated Javascript bundle because the output file is generated in another directory.

One solution would be to put the images into the same output directory, the `dist` directory in our template and reference the images in the `prop.src` as if they were relative to the path of the generated Javascript bundle. However, that solution it is not ideal because now all images and other static files have to be included in the output directory while being referenced from multiple source files. You will easily lose track of which images are used from which files and it becomes a mess.

Isn't there a way to be able to reference images by their relative path from source files and have it *just work* even after compiling the application? Webpack loaders to the rescue!

"Wait a second, I thought you said loaders were used for assets that can compile to Javascript modules. Images cannot be compiled to Javascript modules, right?" Yes, you are correct but that doesn't stop webpack loaders from being able to *modify* the paths of static files that are relatively referenced from source files and copy them into the output directory automatically. In fact, that is exactly what the [file-loader](https://github.com/webpack-contrib/file-loader) does to help us import the images easily.

### Using `file-loader`

We can start off by installing the `file-loader` package from npm into the project:
```bash
npm install file-loader --save-dev
```
Then add it as a module into the `webpack.config.js` file as follows (scroll down to the highlighted code):
```js {highlight: [49, 50, 51, 52]}
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
            }]
        }
    }
}
```
With that in place, we can import images by their relative paths when they have extension `.png`, `.jpeg`, or `.gif` as specified in the regex of the `test` option. What I always do is create a helper module for referencing relative images as follows:
```fsharp
[<RequireQualifiedAccess>]
module Image =
    open Fable.Core.JsInterop

    let inline load (relativePath: string) : string = importDefault relativePath
```
This module has one function: `Image.load` which is basically an alias for `importDefault` function coming from the `Fable.Core.JsInterop` namespace. The function `importDefault` is the equivalent of `require` in Javascript and depending on what you are importing, it can return different things, that is why I made a specialized module dedicated to loading images. This is also the reason why the function returns `string`: it is the modified path of the imported image.

To use this module, simply call it with the input being a relative path and it will give you the modified path of the image that itself can be used as input for `prop.src` as follows:
```fsharp
Html.img [
  prop.src (Image.load "./fable_logo.png")
  prop.alt "Logo"
]
```
That is it! You are now able to use images placed relative to the source files from which they are used. To make you believe that the modified path is actually different, you can print out this new path into the browsers console:
```fsharp
let fableLogo = Image.load "./fable_logo.png"

printfn "Fable logo path %s" fableLogo

Html.img [
  prop.src fableLogo
  prop.alt "Logo"
]
```
From which my local project prints out:
```fsharp
// browser console
Fable logo path dce2757cef5f2cc7b1dbc1416f3732ed.png
```
Alternatively, you can run `npm run build` to see how this same file is copied into the output directory and is now referenced property from the image tag that we used. When I run `npm run build` I get these files in the `dist` directory:
```
 dist
  |
  | -- index.html
  | -- main.js
  | -- dce2757cef5f2cc7b1dbc1416f3732ed.png
```
This is result of the `file-loader` package, it rewrites the path into a hash string and copies the required files into the output directory to have them referenced like you would expect them to be.
