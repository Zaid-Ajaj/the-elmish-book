# Understanding Fable Loader

Since the beginning of chapter, you introduced to the `webpack.config.js` file as the "compiler configuration" for building F# projects using Fable and turning them into Javascript. However, this file is used to configure [webpack](https://webpack.js.org/) using the so-called "loaders". These loaders allow for different "assets" to contribute to the final generated Javascript bundle which is the output of webpack. Before talking about assets and loaders, let us take a step back, discuss webpack from a birds-eye point of view, understand what problem does webpack solves and why it is called a "Javascript module bundler".

Traditionally, building web pages meant you have write a bunch of Javascript files and include them into an Html page so that the browser starts executing the code. As the page gets bigger and the scripts start to become a mess, people wrote them in seperate files and included them one after another in `<script>` tags. Of course, these script tags have to be included in the right order to ensure that one script does not use code it depends upon from another script before that dependency itself is loaded first. Building applications like this is fine when the application is really small or when you don't care about maintainability or your sanity.

Problems start to creep up when you introduce third-party packages which themselves have to included as `<script>` tags along with their (transitive) dependencies.

Meanwhile when writing Javascript applications to run on the server using the [Node.js](https://nodejs.org/en/) runtime, there was already a great development story: building applications using Javascript modules. These modules are Javascript files that can or `require` other modules by their path relative to the file that is importing them:
```js
// util.js
export const add = (x, y) => x + y;

// index.js
const { add } = require("./util.js")
console.log(add(2, 3))
```
This makes for a nice and simple way to build bigger and bigger Javascript applications. The same *module* resolutions follow for third-party packages. When a non-relative path is used, assume it is a third-patry package installed either locally on the project or globally on the system:
```js
const fancyStuff = require('third-party')
console.log(fancyStuff.run());
```
The crucial part of this module system in Node.js is that when the runtime executes a script, it will **dynamically** load the required modules, execute their code and require their dependent modules if they had any. This is the funny part, trying to use the same module system to build web applications was impossible: browsers do load have the ability (by default) to dynamically load dependent modules while executing the scripts. Everything has to be **static defined**.

Here is where webpack comes into play: it allows Javascript developers to use the same module system available for Node.js and statically generate a single Javascipt output file that browsers understand without any dynamic loading at runtime. In other words, webpack takes the Javascript modules and bundles them into a ready-to-run single Javascript file. That is the reason why webpack is called a "Javascript module bundler".

Of course, webpack is not the first tool to try to solve this problem, there were other module bundlers out there like [SystemJs](https://github.com/systemjs/systemjs), [Browserify](http://browserify.org/), [Rollup.js](https://rollupjs.org/guide/en/) and [Parcel](https://parceljs.org/) among others. Some of these are quite old like SystemJs and Browserify. Some provide a simplified getting started experience like Parcel. We go with Webpack because it the most feature-full solution and most widely used across the different kinds of front-end applications.