# Fable bindings

Bindings are specialized Fable packages that allow a Fable project to access native JavaScript APIs. These packages hide away the complexity of JavaScript libraries behind type-safe and idiomatic F# code, checked for correctness by the powerful F# compiler and type system.

When we talk about bindings, we are just talking about a shell for an underlying JavaScript API or library. This means that a Fable binding is *always* used in combination with some specific JavaScript code that the binding calls or interacts with under the hood.

Which binding you can use depends entirely on the platform or environment in which your compiled F# code is running. Different platforms provide different APIs. For example, the APIs available in the browser are different than those available on a Node.js runtime. In the browser, you can manipulate user interface elements and draw 2D shapes on a canvas. Meanwhile, on the Node.js side of things, you can read file contents, call cryptographic functions or host a web server.

In addition to the browser APIs and Node.js, there are other popular platforms that Fable can target. Fable can target [Github Electron](https://electronjs.org/) which combines both Node.js *and* the browser APIs to build powerful desktop applications. Another platform is [React Native](https://facebook.github.io/react-native/), which runs a Node.js-like environment for creating mobile apps.

### Types of bindings

Because there are different platforms that Fable can target, we end up with different types of bindings that are applicable in each one of these platforms. Let's break down all the possibilities of JavaScript code that a Fable binding can interact with:

 - Type 1: Globally available functions in every JavaScript runtime
   - `Math.*` functions such as `Math.random()`, `Math.sin()`, `Math.cos()` etc.
   - `JSON.*` functions such as `JSON.parse` and `JSON.stringify`
   - `console.*` functions such as `console.log` and `console.error`
   - `Array` functions such as `Array.from` and `Array.isArray`
   - `Object` functions such as `Object.keys()`
   - Misc. functions such as `parseInt`, `parseFloat`, `setInterval`, `setTimeout`
   - etc.

 - Type 2: Browser-specific APIs
   - The `window` object
   - The `document` that lets you manipulate UI elements
   - `XMLHttpRequest` type that allows us to make HTTP calls
   - `FileReader` allows you to read content of files in the browser
   - `CanvasRenderingContext2D` allows you to draw 2d shapes on a `canvas` element
   - `WebSocket` allows for duplex communication with server-side technologies
   - `IndexedDb` a client-side database API
   - `Blob` types that represent binary data
   - Many, [many more](https://developer.mozilla.org/en-US/docs/Web/API) you didn't even know existed
   - Libraries included in the page through script tags.

 - Type 3: Node-specific APIs
  - the `global` object
  - the `__dirname` variable
  - All system modules
    - `fs` for file system operations
    - `http` module, well, for HTTP
    - `crypto` module contains cryptographic functions
    - `path` module contains function to resolve relative and absolute paths
    - See [the rest](https://nodejs.org/dist/latest/docs/api/) of the modules

 - Type 4: JavaScript libraries published to npm, which is the heart of the JavaScript ecosystem. These can be further divided into the following:
  - Type 4.1: Libraries made to run inside a browser
  - Type 4.2: Libraries made to run inside a Node.js host
  - Type 4.3: Libraries made to run everywhere, the so-called "isomorphic" libraries.

The list above is quite involved, which is a consequence of how JavaScript code is used and distributed throughout the different platforms. Historically, you could only use JavaScript inside a browser, and the only libraries you could use were the ones you included in a web page using a script tag. A library included this way becomes globally available on the page as an object under the global `window` variable. Later on, a proper package registry was introduced along with the Node.js runtime, what is known today as [npm](https://www.npmjs.com/): the largest package registry of libraries in the world.

Interacting with libraries included using a script tag in a web page is a different story than interacting with a library that is downloaded using `npm`. The former uses global variables, and the latter uses JavaScript modules for exposing the code.
Let's go through some example Fable bindings and explain on which target they would be compatible.

### Examples of Fable bindings

The first example is one we used in the very first [Hello World](hello-world.md) application, the package `Fable.Browser.Dom`. Using this package, we were able to interact with the `document` object and manipulate UI elements on the page. `Fable.Browser.Dom` is a binding for Type 2 JavaScript code. This package is one of the family of Fable packages under the [Fable.Browser](https://www.nuget.org/packages?q=Fable.Browser) namespace designed to be used in the browser.

The packages [Thoth.Json](https://github.com/thoth-org/Thoth.Json) and [Fable.SimpleJson](https://github.com/Zaid-Ajaj/Fable.SimpleJson), two general-purpose libraries for working with JSON are bindings of Type 1 because they both use the `JSON.*` module under the hood. These two can be used both inside the browser and Node.js runtime.

<resolved-image source="/images/fable/type-one.png" />

Some Fable packages may build upon existing bindings, such as [Fable.SimpleHttp](https://github.com/Zaid-Ajaj/Fable.SimpleHttp) which provides an idiomatic F# API for working with HTTP instead of the low-level `XMLHttpRequest` API.

<resolved-image source="/images/fable/type-two.png" />

As for Type 3 packages, there is the package [Fable.Node](https://github.com/fable-compiler/fable-node) that covers most system modules of the Node.js runtime.

<resolved-image source="/images/fable/type-three.png" />

Type 4 packages are by far the most common bindings in Fable's ecosystem, simply because there are literally millions of useful packages distributed to npm that we want to use in Fable applications. These are further divided into those packages that can be used inside a browser and those that can be used in Node.js runtime.

<resolved-image source="/images/fable/type-four.png" />

Fable bindings will usually prefer the modern `npm` modules. This means that a Fable binding, distributed to NuGet, has a *dependency* on a JavaScript package distributed to `npm`. In order to use these bindings of Type 4, you need to install the binding from NuGet and the actual library from npm. Let's take the [Fable.DateFunctions](https://github.com/Zaid-Ajaj/Fable.DateFunctions) package which is a binding for the native JavaScript library [date-fns](https://date-fns.org/). This library provides many useful functions to manipulate `DateTime`, and you can use it in your Fable projects through this binding.

To use it inside your project, you have to install both `Fable.DateFunction` from NuGet and `date-fns` from npm:

```bash
# inside src directory:
dotnet add package Fable.DateFunctions
# inside repo directory
npm install --save date-fns
```

This may sound worrisome since you have to know which versions of npm packages go with which versions of the nuget packages. I would say not to worry about it because it is a problem that is pretty much solved. We will talk about the solution later in chapter five in section [Introducing Femto](../dev-flow/introducing-femto.md).

### Authoring Fable libraries and bindings

This was just a glimpse at how Fable packages can integrate native JavaScript modules into Fable applications. 

In chapter 5 <strong>[TODO]</strong>, we will be looking into interoperability in great detail and the different ways of authoring a Fable package.

If you would like to find out more about how to write bindings, here is a write-up of my own on Medium. It is a little out of date, e.g. Pojo attributes, but the ideas are pretty much the same. [F# Interop with Javascript in Fable: The Complete Guide](https://medium.com/@zaid.naom/f-interop-with-javascript-in-fable-the-complete-guide-ccc5b896a59f).
