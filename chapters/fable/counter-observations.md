# Counter app: Observations 

You might be wondering why we made the trivial counter application in the previous section and had it implement some silly requirements. Well, this is because it is simple enough to qualify as "Hello world" and at the same time shows you what Fable is all about, so let us go through the main points I wanted conclude from the timy counter app:

### 1 - Fable is a general-purpose compiler 

Assuming you have done any javascript developement before, you surely have noticed how similar the F# code looked like in the first listing. In fact, if I was using pure javascript to implement the same app it would something like this: 
```js
const increase = document.getElementById("increase")
const decrease = document.getElementById("decrease")
const countViewer = document.getElementById("countViewer")

var count = 0;

increase.onclick = function(ev) {
    count = count + 1;
    countViewer.innerText = `Count is at ${count}`
};

decrease.onclick = function (ev) {
    count = count + 1;
    countViewer.innerText = `Count is at ${count}`;
};

countViewer.innerText = `Count is at ${count}`;
```
Crazy right?! this is almost what we wrote but with F# instead! This goes to say that Fable is not a specific framework to build web apps but rather a compiler toolchain that translates to javascript to let our code run in any javascript runtime, let it be the browser, [node.js](https://nodejs.org/en/), [react-native](http://facebook.github.io/react-native/), [github electron](https://electronjs.org/) or others. 

### 2 - Fable provides *bindings* to interact with native javascript APIs

Already introduced in [Hello World](hello-world.md) section, a Fable *binding* is a special F# library that contains type definitions and method signatures of native javascript APIs (similar to `.ts.d` files of typescript). In the previous samples, we used `document` from the `Fable.Import.Browser` binding, but the library includes a very large and comprehensive subset of bindings for many browser APIs such as [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest), [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [CanvasRenderingContenxt2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) just to name a few. This is one example of a Fable binding, later on we will explore many other bindings not only support native APIs like the browsers' but also APIs from third-party libraries that can be seemlessly consumed from within our Fable Apps. 


### 3 - Fable supports a subset of the BCL. 

The base class library or *BCL* for short are those native APIs from dotnet that F# can use in normal F# applications. Think the namespaces that start with `System.*`. In the previous counter example, we used `System.Random` to generate random numbers which is a class from the BCL that we were able to use and run in the browser. Many will then ask: "What functionality does Fable support from the BCL?" 

Well, let me put this way, Fable tries to support thse APIs when *"it makes sense"*. Think about this way, Fable compiles F# with the idea in mind that the code will run inside a javascript runtime, like V8 in the browser on node.js on the server. In many cases, the APIs provided from the BCL don't work out of the box in javascript environments.  