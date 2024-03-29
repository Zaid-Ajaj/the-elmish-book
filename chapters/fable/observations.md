# Observations

You might be wondering why we made the trivial counter application in the previous section and had it implement some silly requirements. Well, this is because it is simple enough to qualify as "Hello world" and at the same time shows you what Fable is all about. So let us go through the main points I wanted to conclude from the tiny counter app.

### Fable is a general-purpose compiler

Assuming you have done any JavaScript development before, you surely noticed how similar the F# code looked to a JavaScript program. In fact, if I was using pure JavaScript to implement the same app it would look something like this:
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
    count = count - 1;
    countViewer.innerText = `Count is at ${count}`;
};

countViewer.innerText = `Count is at ${count}`;
```
Crazy, right?! This is almost what we wrote but with F# instead. This goes to say that Fable is not a specific framework to build web apps but rather a compiler that translates your F# code, whatever it does, to JavaScript. It lets your code run in any JavaScript runtime, whether it is the browser, [Node.js](https://nodejs.org/en/), [react-native](http://facebook.github.io/react-native/), [github electron](https://electronjs.org/) or others.


### Fable uses *bindings* to interact with native JavaScript APIs

Already introduced in section [Hello World](/chapters/fable/hello-world), a Fable *binding* is a special F# library that contains type definitions and method signatures of native JavaScript APIs (similar to `.ts.d` files of TypeScript). In the previous samples, we used `document` from the `Fable.Browser.Dom` binding package which was included in the template. The library consists of very large and comprehensive bindings for many browser APIs such as [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest), [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) and [CanvasRenderingContenxt2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) to name a few. Later on, we will explore many other bindings that not only support native APIs like the ones from the browsers but also APIs from third-party libraries that can be seamlessly consumed from within our Fable applications.

### Fable preserves F# semantics
One of the most essential aspects of Fable is that it preserves the semantics of F# code and has full support for the F# core library modules such as `List`, `Seq`, `Array`, `Option`, `Map`, `Set`, `Async`, `String` etc. This means that your F# code should run the same way you would expect F# to behave on .NET. The following language constructs are supported: pattern matching, active patterns, object expressions, structural equality, sequence and list comprehensions, lazy values, anonymous records, classes and computation expressions.

In the previous example, we used two different constructs: mutability and `async` computation expressions. Although mutability is to be avoided in F# applications, sometimes it makes sense to use it for performance gains and Fable supports it.

### F# Async in JavaScript

As for `async`, it is natural for Fable to support that construct because the JavaScript runtime makes heavy use of continuations, also known as callbacks. In fact, many if not all native JavaScript callback-based APIs can be turned into `async` expressions quite easily, for example, to convert [setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout) in JavaScript into an async "sleep" function, you can write the following:

```fsharp
open Fable.Core
open Fable.Core.JsInterop

[<Emit("setTimeout($0, $1)")>]
let setTimeout (callback: unit -> unit) (timeout: int) = jsNative

let sleep (n: int) : Async<unit> =
    Async.FromContinuations (fun (resolve, reject, _) ->
        // native javascript function
        // runs callback after n milliseconds
        setTimeout (fun () -> resolve()) n
        |> ignore)

async {
    printfn "Before"
    do! sleep 1000
    printfn "After one second"
}
```

<div style="padding:20px; border: 1px solid lightgrey;border-radius:5px;">
<code>Async.Sleep</code> with Fable is implemented using <code>setTimeout</code> under the hood, however the implementation is more advanced and provides built-in support for cancellation.
</div>

The above snippet uses native JavaScript and makes use of Fable's interop capabilities. Don't worry if you do not understand this right away because of the `Emit` attribute or the `jsNative` value; there will be a whole chapter devoted to interoperability from Fable. The take away from this is that it is straightforward and easy to use native functionality when needed.


### Unsupported Features

At the time of writing, a couple of F# features are not yet supported, for example, F# code quotations and `query` computation expressions because it depends on the quotations feature.
