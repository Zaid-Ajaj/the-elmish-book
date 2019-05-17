# Fable Bindings

Bindings are specialized Fable packages that allow a Fable project to access native javascript APIs. These packages hide away the complexity of javascript libraries behind type-safe and idiomatic F# code, checked for correctness by the powerful F# compiler and type system.  

When we talk about bindings, we are just talking about a shell for an underlying javascript API or library. This means that a Fable binding is *always* used in combination with some specific javascript code that the binding calls or interacts with under the hood. 

Which binding you can use depends entirely on the platform or environment in which your compiled F# code is running. Different platforms provide different APIs, for example the APIs available in the browser are different than those available on a node.js runtime. In the browser you have APIs that can manipulate user interface elements, meanwhile on the node.js side of things can read file contents or host a web server. 

There are more popular platforms that Fable can target, one of which is [Github Electron](https://electronjs.org/) which combines both node.js *and* the browser APIs to build beautiful desktop applications. Another is [React Native](https://facebook.github.io/react-native/) which runs a node.js-like environment that lets you create mobile applications.  

### Types of Bindings

Because there are different platforms to run our code, we end up with different types of bindings that are applicable in each one of these platforms. Let's break down all the possibilities of javascript code that a Fable binding can interact with:

 - Type 1: Globally available functions in every javascript runtime
   - `Math.*` functions such as `Math.random()`, `Math.sin()`, `Math.cos()` etc.
   - `JSON.*` functions such as `JSON.parse` and `JSON.stringify`
   - `console.*` functions such as `console.log` and `console.error`
   - `Array` functions such as `Array.from` and `Array.isArray`
   - `Object` functions such as `Object.keys()`
   - Misc. functions such as `parseInt`, `parseFloat`, `setInterval`, `setTimeout`
   - etc.
 
 - Type 2: Browser-specific APIs
   - The `window` object
   - The `document` that let's manipulate UI elements
   - `XMLHttpRequest` type that allows us to make HTTP calls
   - `FileReader` allows you to read content of files in the browser
   - `CanvasRenderingContext2D` allows you to draw 2d shaped on a `canvas` element
   - `WebSocket` allows for duplex communication with server-side technologies
   - `IndexedDb` a client-side database API 
   - `Blob` types that represent binary data
   - Many [many more](https://developer.mozilla.org/en-US/docs/Web/API) you didn't even know they existed

 - Type 3: Node-specific APIs
  - the `global` object
  - All system modules
    - `fs` for file system operations
    - `http` well, for http
    - `crypto` module contains cryptographic function
    - See [the rest](https://nodejs.org/dist/latest/docs/api/) of the modules


 - Type 4: Javascript libraries published to npm, basically the entire javascript ecosystem. 


### Examples Of Bindings Per Type