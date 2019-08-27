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

### On the composability of Javascript callbacks
In a Javascript environment, almost all asynchronous operations are implemented using callbacks attached to events, just like with the `onreadystatechange` event, we attach a callback to it and kick off the asynchronous operation (i.e. calling the `xhr.send()` function), then wait for the event to trigger which in turn runs the code we attached in the event handler. Another name for Javascript callbacks is continuations: a fancy word for saying "Do something that might take a while and when you finish it, do something else."

Now combining multiple callbacks together in Javascript can be a cumbersome task, take the `setTimeout` function as an example. The function takes a callback and timeout in milliseconds, waits for the timeout and runs the callback. Now suppose we want to print five messages to the console, waiting for one second between each print statement, we would have to the following:
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
Here, in every callback, we trigger another `setTimout` operation in the callback of the one before it in order to run the next print statement in sequence and we end up with the infamous "callback pyramid of hell" of Javascript where code starts to get really hard to read and confusing because of the nesting of callbacks.

You might say "Well, this is just a silly example code, real-world code doesn't look like this, right?" Actually, real-world Javascript can be even uglier, because when loading data from a server, especially for a RESTful API, the front-end code ends up with having to request data from multiple endpoints. However, this problem is not specific to calling web APIs also applies to any callback based API such that of the file system when running Javascript in a Node.js environment.

Now since this is a common problem in the Javascript world, developers have found solutions to make it easier to combine multiple callbacks in a linear fashion instead of the nesting applied in the code snippet above: Enter Promises!

Promises are constructs that help Javascript developers combine callbacks, writing them in a linear fashion that *looks* synchronous even though the code is running asynchronously. Here is an example `Promise` that is created from `setTimeout`:
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

Alright, after this little detour you must be wondering why this is relevant to our F# implementation of `httpRequest`. To put it simply: F#'s `Async` expressions compiled with Fable are more or less the equivalent of Javascript's Promises, they are just syntax sugar around callback-based APIs.

In the same way we created the `wait` function that returns a Promise from the `setTimeout` function in Javascript, we could write a `wait` function in F# that does exactly the same thing, except it is implemented as `Async<unit>`:
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
Converting callback-based APIs from Javascript into F#'s `async` is really powerfull and will allow to build abstractions upon existing Javascript libraries into idiomatic F# API that uses the `async` computation expressions.

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
        let loadLoremInpsum =
            async {
                let request = { url = "/lorem-ipsum.txt"; method = "GET"; body = "" }
                let! response = httpRequest request
                if response.statusCode = 200
                then return LoadLoremIpsum (Finished (Ok response.body))
                else return LoadLoremIpsum (Finished (Error "Could not load the content"))
            }

        nextState, Cmd.fromAsync loadLoremInpsum

    | LoadLoremIpsum (Finished result) ->
        let nextState = { state with LoremIpsum = Resolved result }
        nextState, Cmd.none
```