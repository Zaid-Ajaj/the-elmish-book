# Understanding Webpack Loaders

Since the beginning of first chapter, you introduced to the `webpack.config.js` file within [fable-getting-started](https://github.com/Zaid-Ajaj/fable-getting-started) template as the "compiler configuration" for building F# projects using Fable and turning them into Javascript. However, this file is used to configure [webpack](https://webpack.js.org/) using the so-called "loaders". These loaders allow for different "assets" to contribute to the final generated Javascript bundle which is the output of webpack. Before talking about assets and loaders, let us take a step back, discuss webpack from a bird's-eye view and try to understand what problem webpack solves.

### A bit of history

Traditionally, building web pages meant you have write a bunch of Javascript files and include them into an Html page so that the browser starts executing the code. As the page gets bigger and the scripts start to become a mess, people wrote them in separate files and included them one after another in `<script>` tags. Of course, these script tags have to be included in the right order to ensure that one script does not use code it depends upon from another script before that dependency itself is loaded first. Building applications like this is fine when the application is really small or when you don't care about maintainability or your sanity.

Problems start to creep up when you introduce third-party packages which themselves have to be included as `<script>` tags along with their (transitive) dependencies.

Meanwhile when writing Javascript applications to run on the server using the [Node.js](https://nodejs.org/en/) runtime, there was already a great development story: building applications using Javascript modules. These modules are Javascript files that can or `require` other modules by their path relative to the file that is importing them:
```js
// util.js
export const add = (x, y) => x + y;

// index.js
const { add } = require("./util.js")
console.log(add(2, 3))
```
This makes for a nice and simple way to build bigger and bigger Javascript applications. The same *module* resolutions follow for third-party packages. When a non-relative path is used, assume it is a third-party package installed either locally on the project or globally on the system:
```js
const fancyStuff = require('third-party')
console.log(fancyStuff.run());
```
The crucial part of this module system in Node.js is that when the runtime executes a script, it will **dynamically** load the required modules, execute their code and require their dependent modules if they had any. This is the funny part, trying to use the same module system to build web applications was impossible: browsers do not have the ability (by default) to dynamically load dependent modules while executing the scripts. Everything has to be **statically defined**.

Here is where webpack comes into play: it allows Javascript developers to use the same module system available for Node.js and statically generate a single Javascript output file that browsers understand without any dynamic loading at runtime. In other words, webpack takes the Javascript modules and bundles them into a ready-to-run single Javascript file. That is the reason why webpack is called a "Javascript module bundler".

Of course, webpack is not the first tool to try to solve this problem, there were other module bundlers out there like [SystemJs](https://github.com/systemjs/systemjs), [Browserify](http://browserify.org/), [Rollup.js](https://rollupjs.org/guide/en/) and [Parcel](https://parceljs.org/) among others. Some of these are quite old like SystemJs and Browserify. Some provide a simplified getting started experience like Parcel. We go with webpack because it the solution with most features and most widely used across the different kinds of front-end applications.

### Webpack Loaders

Webpack has gone a long way from being able to generate a Javascript file to be served from the browser. Today, it doesn't only bundle Javascript modules, but it bundles anything that **can become** a Javascript module. Let that sink in for a second and think about the implications.

If something can be compiled into a Javascript module then it can be used with webpack and benefit from all the nice features like bundling, code minimization, HMR and more. This is where webpack loaders come into play: they are packages that can be used to take something (let us call it an "asset") and compile that asset into a Javascript module. The `fable-loader` package is one perfect example of this. It takes a Fable/F# project (the asset) and turns it into Javascript modules which are then handed off to webpack for further processing like bundling with other modules, tree-shaking of unused code, easy interop with external and local Javascript code and third-party packages etc.

`fable-loader` is not the Fable compiler, that is a different npm package called `fable-compiler` which is used by `fable-loader` to do the actual compilation of the F# project. Both of these packages are installed as development dependencies from npm along with webpack:
```json {highlight: [9, 10]}
{
  "private": true,
  "scripts": {
    "build": "webpack",
    "start": "webpack-dev-server"
  },
  "devDependencies": {
    "@babel/core": "^7.8.7",
    "fable-compiler": "^2.4.21",
    "fable-loader": "^2.1.9",
    "webpack": "^4.38.0",
    "webpack-cli": "^3.3.6",
    "webpack-dev-server": "^3.7.2"
  }
}
```
Of course, `fable-loader` is just one kind of loader that can be used in webpack. There are many [loaders available out there](https://webpack.js.org/loaders) to be used and integrated into our webpack build pipeline to bundle different kinds of assets. In the next sections, we will learn how to use a couple of those loaders to extend the capabilities of our projects and enable them to integrate static images and use [Sass](https://sass-lang.com) for styling instead of CSS.
