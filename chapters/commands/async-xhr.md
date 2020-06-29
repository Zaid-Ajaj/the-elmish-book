# Asynchronous XMLHttpRequest

In the previous section, we looked into how to use `XMLHttpRequest` in an Elmish program with a custom command `httpRequest` of the type:
```fsharp
type httpRequest : Request -> (Response -> Msg) -> Cmd<Msg>
```
Although this implementation works nicely when you have to make a single HTTP request, it starts to become really hard when you have multiple requests and you want to combine and manipulate their responses in a single expression. That's why it is way better to turn callback based APIs such as that of `XMLHttpRequest` into `Async<'T>` expressions such that we can compose them together with the built-in `async` computation expression. Once we have an `Async<'T>` expression, we know how to make `Cmd<'T>` out of it as discussed in [From Async<'t> to Cmd<'t>](async-to-cmd.md) where we implemented `Cmd.fromAsync`. To be exact, we are looking to implement a function of the type
```fsharp
type httpRequest : Request -> Async<Response>
```
Before that, let us discuss some background on the subject matter.

### On the composability of JavaScript callbacks
In a JavaScript environment, almost all asynchronous operations are implemented using callbacks attached to events, just like with the `onreadystatechange` event, we attach a callback to it and kick off the asynchronous operation (i.e. calling the `xhr.send()` function), then wait for the event to trigger which in turn runs the code we attached in the event handler. Another name for JavaScript callbacks is continuations: a fancy word for saying "Do something that might take a while and when you finish it, do something else."

Now combining multiple callbacks together in JavaScript can be a cumbersome task, take the `setTimeout` function as an example. The function takes a callback and timeout in milliseconds, waits for the timeout and runs the callback. Now suppose we want to print five messages to the console, waiting for one second between each print statement, we would have to the following:
```js
setTimeout(() => {
    console.log("First");
    setTimeout(() => {
        console.log("Second");
        setTimeout(() => {
            console.log("Third");
            setTimeout(() => {
                console.log("Four");
                setTimeout(() => {
                    console.log("Five");
                }, 1000)
            }, 1000)
        }, 1000)
    }, 1000)
}, 1000)
```
Here, in every callback, we trigger another `setTimeout` operation in the callback of the one before it in order to run the next print statement in sequence and we end up with the infamous "callback pyramid of hell" of JavaScript where code starts to get really hard to read and confusing because of the nesting of callbacks.

You might say "Well, this is just a silly example code, real-world code doesn't look like this, right?" Actually, real-world JavaScript can be even uglier, because when loading data from a server, especially for a RESTful API, the front-end code ends up with having to request data from multiple endpoints. However, this problem is not specific to calling web APIs and also applies to any callback based API such as the file system API when running JavaScript in a Node.js environment.

Now since this is a common problem in the JavaScript world, developers have found solutions to make it easier to combine multiple callbacks in a linear fashion instead of the nesting applied in the code snippet above: Enter Promises!

Promises are constructs that help JavaScript developers combine callbacks, writing them in a linear fashion that *looks* synchronous even though the code is running asynchronously. Here is an example `Promise` that is created from `setTimeout`:
```js
const wait = timeout => {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), timeout);
    })
}
```
Here we are defining a `wait` function that takes a timeout which is an integer and returns a Promise. This Promise "resolves" when the callback of the `setTimeout` triggers. "Resolving the Promise" means "to complete the operation". Now with this `wait` function, we can write the same snippet we wrote above with `setTimeout` without nesting the callbacks:
```js
wait(1000)
  .then(() => {
    console.log("One")
    return wait(1000)
  })
  .then(() => {
    console.log("Two")
    return wait(1000)
  })
  .then(() => {
    console.log("Three")
    return wait(1000);
  })
  .then(() => {
    console.log("Four");
    return wait(1000);
  })
  .then(() => {
      console.log("Five");
  });
```
Much much better, easy to read and to understand. Promises don't change the computation, they provide a nice syntactic sugar (using the `.then()` function) around callback-based APIs and make them easier to reason about.

Alright, after this little detour you must be wondering why this is relevant to our F# implementation of `httpRequest`. To put it simply: F#'s `Async` expressions compiled with Fable are more or less the equivalent of JavaScript's Promises, they are just syntax sugar around callback-based APIs.

In the same way we created the `wait` function that returns a Promise from the `setTimeout` function in JavaScript, we could write a `wait` function in F# that does exactly the same thing, except it is implemented as `Async<unit>`:
```fsharp
open Browser

let wait (timeout: int) : Async<unit> =
  Async.FromContinuations <| fun (resolve, reject, _) ->
    window.setTimeout((fun _ -> resolve()), timeout)
    |> ignore
```
This `wait` function is implemented using `Async.FromContinuations` which creates an `Async<'t>` that completes when the `resolve` function is called, i.e. in this case when the callback in the `setTimeout` function is called. We can now use this `wait` function as follows:
```fsharp
async {
  do! wait 1000
  printfn "One"
  do! wait 1000
  printfn "Two"
  do! wait 1000
  printfn "Three"
  do! wait 1000
  printfn "Four"
  do! wait 1000
  printfn "Five"
}
|> Async.StartImmediate
```
Converting callback-based APIs from JavaScript into F#'s `async` is really powerful and will allow to build abstractions upon existing JavaScript libraries into idiomatic F# API that uses the `async` computation expressions.

### Implementing `httpRequest`

Now powered-up with the knowledge of continuations and how to translate to `async` expressions, we can implement the `httpRequest` function as follows:
```fsharp
let httpRequest (request: Request) : Async<Response> =
    Async.FromContinuations <| fun (resolve, reject, _) ->
        // create an instance
        let xhr = XMLHttpRequest.Create()
        // open the connection
        xhr.``open``(method=request.method, url=request.url)
        // setup the event handler that triggers when the content is loaded
        xhr.onreadystatechange <- fun _ ->
            if xhr.readyState = ReadyState.Done
            then
              // create the response
              let response = { statusCode = xhr.status; body = xhr.responseText }
              // transform response into a message
              resolve response

        // send the request
        xhr.send(request.body)
```
That is all there is to it! Now in combination with `Cmd.fromAsync` that we implemented in [From Async<'t> to Cmd<'t>](async-to-cmd.md), we can rewrite the `update` function from the previous section as follows:
```fsharp
let update msg state =
    match msg with
    | LoadLoremIpsum Started ->
        let nextState = { state with LoremIpsum = InProgress }
        let loadLoremIpsum =
            async {
                let request = { url = "/lorem-ipsum.txt"; method = "GET"; body = "" }
                let! response = httpRequest request
                if response.statusCode = 200
                then return LoadLoremIpsum (Finished (Ok response.body))
                else return LoadLoremIpsum (Finished (Error "Could not load the content"))
            }

        nextState, Cmd.fromAsync loadLoremIpsum

    | LoadLoremIpsum (Finished result) ->
        let nextState = { state with LoremIpsum = Resolved result }
        nextState, Cmd.none
```
There we have it, HTTP requests with Elmish in an idiomatic F# API. By this time, I hope we have gained a better understanding applying HTTP in Elmish applications but more importantly how to work with JavaScript callbacks and turn them into F# `async` expressions.

Now that we have seen how to implement a simple HTTP request, we are only scratching the surface of the full API provided by `XMLHttpRequest`, you might have the idea of implementing a nice F#/Fable library that covers that API but yours truly has already done it for you, let us take a look at [Fable.SimpleHttp](https://github.com/Zaid-Ajaj/Fable.SimpleHttp) for working with HTTP.

### Introducing `Fable.SimpleHttp`

In our implementation of `httpRequest : Request -> Async<Response>` we had defined the request and response types as the following:
```fsharp
type Request = { url: string; method: string; body: string }
type Response = { statusCode: int; body: string }
```
We also talked about their limitations such as the fact that they don't account for request and response headers, nor do they account for different request and response body types, i.e. string vs raw binary blob etc. Of course, these `Request` and `Response` types where used for demonstration purposes. Going forward, we will be using a library called [Fable.SimpleHttp](https://github.com/Zaid-Ajaj/Fable.SimpleHttp) that fully supports operations of `XMLHttpRequest` implemented with F# asynchronous expressions that can be easily incorporated in our Elmish applications.

Let us see the library in action replacing the `httpRequest` we used in the above `update` function. First of all, install the library from nuget:
```
dotnet add package Fable.SimpleHttp
```
Now use it in your application:
```fsharp {highlight: [1, 9]}
open Fable.SimpleHttp

let update msg state =
    match msg with
    | LoadLoremIpsum Started ->
        let nextState = { state with LoremIpsum = InProgress }
        let loadLoremIpsum =
            async {
                let! (statusCode, responseText) = Http.get "/lorem-ipsum.txt"
                if statusCode = 200
                then return LoadLoremIpsum (Finished (Ok responseText))
                else return LoadLoremIpsum (Finished (Error "Could not load the content"))
            }

        nextState, Cmd.fromAsync loadLoremIpsum

    | LoadLoremIpsum (Finished result) ->
        let nextState = { state with LoremIpsum = Resolved result }
        nextState, Cmd.none
```
Issuing a GET request is as simple as `Http.get "/lorem-ipsum.txt"`, this function returns `Async<int * string>` where `int` is the status code of the response and `string` is the response body. All of the functions included in the `Http` module *do not throw exceptions* and that makes them fit perfectly in combination with `Cmd.fromAsync`.

Module functions of `Http` such as `get`, `post`, `patch` etc. all account for the simple cases of HTTP requests where you are only interested in the status code and response text which the case for a lot of cases but the moment you want to configure a more complex request, adding headers and modifying body content types, then you can use the `Http.request` function that allows you to configure the request by chaining configuration functions of `Http` module, let us see how to use it instead of `Http.get`
```fsharp {highlight: ['9-12']}
open Fable.SimpleHttp

let update msg state =
    match msg with
    | LoadLoremIpsum Started ->
        let nextState = { state with LoremIpsum = InProgress }
        let loadLoremIpsum =
            async {
                let! response =
                    Http.request "/lorem-ipsum.txt"
                    |> Http.method GET
                    |> Http.send

                if response.statusCode = 200
                then return LoadLoremIpsum (Finished (Ok response.responseText))
                else return LoadLoremIpsum (Finished (Error "Could not load the content"))
            }

        nextState, Cmd.fromAsync loadLoremIpsum

    | LoadLoremIpsum (Finished result) ->
        let nextState = { state with LoremIpsum = Resolved result }
        nextState, Cmd.none
```
To learn more, refer to the documentation of [Fable.SimpleHttp](https://github.com/Zaid-Ajaj/Fable.SimpleHttp) available in the README section of the repository. From now on, we will be using this library when it comes to making HTTP requests.

### `Fable.Fetch` as an alternative to `Fable.SimpleHttp`

The use of `XMLHttpRequests` API directly in modern JavaScript applications is nowadays considered "too old school" and in some cases, not even recommended! This is because `XMLHttpRequest` mainly uses callbacks for handling the requests and responses. We have seen how callbacks cannot be easily composed, making it hard to issue multiple requests in sequence without bloating the code with noise.

Modern JavaScript application will opt for the so-called `fetch()` API when it comes to working with HTTP because it uses Promises for chaining and processing requests and because the API of `fetch` is relatively simpler compared to that of `XMLHttpRequest`. Of course, since this `fetch()` thing is really cool, the Fable community has built a binding library around it which is the `Fable.Fetch` package. Since `fetch` uses Promises, `Fable.Fetch` uses `Fable.Promise` as a dependency to implement the API to implement the binding because `Fable.Promise` provides a `promise` computation expression to work with Promises as a generic `Promise<'t>` similar to how the `async` computation expression makes it easy to work with `Async<'t>`. This means that with `Fable.Fetch` we are able to compose requests just as easy as with `Fable.SimpleHttp`.

However, I would still recommend using `Fable.SimpleHttp` over `Fable.Fetch` and here is why

> No, not because I built `Fable.SimpleHttp` thank you very much ;)

First of all, Promises follow different semantics (meaning) than `async` expressions of F#: once a value of type `Promise<'t>` is created which is basically a description of an asynchronous operation just like that of `Async<'t>`, the operation is immediately started. This is a different behavior than that of `Async<'t>` with which you need to initiate the asynchronous operation yourself by calling `Async.StartImmediate`. This behavior of Promises is usually referred to as "hot" tasks as opposed to the "cold" tasks of F# with `Async<'t>` expressions that separate the instantiation of the asynchronous operation and actually starting it. This is not to say that "`Async<'t>` is better than `Promise<'t>`" but it is a difference that will confuse most F# developers at first sight, especially those who will assume similar execution semantics when using `Promise<'t>`.

The second reason which is of most importance is that the `fetch` API mainly uses *exceptions* for error handling and so does `Fable.Fetch` as opposed to using standards of handling HTTP errors by checking the status code of the response which is what `Fable.SimpleHttp` does by never throwing an exception and always returning a status code and a response text (or a full response value with all the metadata when you use `Http.request`).

The last reason which could be of importance to those who need to support old browsers such as IE11, the `fetch` API in these browsers will require a [polyfill](https://github.com/github/fetch) to be added to the page in order to use `fetch` where as `Fable.SimpleHttp` only relies on `XMLHttpRequest` under the hood which is supported in all browsers without requiring additional polyfills.

