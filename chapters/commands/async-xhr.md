# Asynchronous XMLHttpRequest

In the previous section, we looked into how to use `XMLHttpRequest` in an Elmish program with a custom command `httpRequest` of the type:
```fsharp
type httpRequest : Request -> (Response -> Msg) -> Cmd<Msg>
```
Although this implementation works nicely when you have to make a single HTTP request, it starts to become really annoying when you have multiple requests and you want to combine and manipulate their responses in a single expression. That's why it is way better to turn callback based APIs such as that of `XMLHttpRequest` into `Async<'T>` expressions such that we can compose them together with the built-in `async` computation expression. Once we have an `Async<'T>` expression, we know how to make `Cmd<'T>` out of it as discussed in [From Async<'t> to Cmd<'t>](async-to-cmd.md) where we implemented `Cmd.fromAsync`. To be exact, we are looking to implement a function of the type
```fsharp
type httpRequest : Request -> Async<Response>
```
