# XMLHttpRequest in Elmish

In the previous chapter, we have seen how to use `XMLHttpRequest` in a non-Elmish context where we just execute the HTTP request and log the results to the console. In this section, we will examine a number of techniques to integrate `XMLHttpRequest` into an Elmish program.

### From `XMLHttpRequest` To Commands

The very first attempt to integrate any callback-based API such as that of `XMLHttpRequest` into an Elmish program is to implement them directly as commands. To turn an HTTP request into a command means that the command will be able to dispatch various messages from events that are triggered from the `XMLHttpRequest`, in particular the `onreadystatechange` event.

As a request is being processed, this event is triggered multiple times notifying the subscribers of the event about the current state the HTTP request. For the purposes of this section, we will only be interested in the state of the HTTP request when it has been processed (i.e. when ready state is `DONE`) and the response information is available for use. We will not be looking into the intermediate states of an ongoing HTTP request and that is enough to cover 99% of the requirements a web application has when it comes to making HTTP requests.

I hear you saying: "just get to the code already!?" and we will surely do! For our first attempt, let us model the types of the request and response first:
```fsharp
type Request = { url: string; method: string; body: string }
type Response = { statusCode: int; body: string }
```
Here we are defining very simplified representations of HTTP requests and responses. A HTTP request has the following:
 - A `url`: the location of the requested resource
 - A `method`: the so-called method of the request that determines the "type" of request the application sends such as `GET`, `POST`, `DELETE` etc.
 - A `body` to send along the request which is for now just a simple string.

On the other hand, an HTTP response has:
 - A `statusCode` which is a number that determines the status of the response
 - A `body` that the server has returned for the specific request that was processed, which in this simple case is also a string.

These definitions have some serious limitations because neither the `Request` nor the `Response` take HTTP headers into account  which are essential metadata about the data exchange for a single HTTP roundtrip and the subsequent requests. There is also the fact that the `body` of the response is a string which is not always the case as there are multiple formats the response `body` can have such as raw binary data encoded as `UInt8Array` or `Blob` but for the purposes of this sample implementation we will skip over these concerns.

With these types in mind, we can model the type of the command itself. Remember that a command is something that is able to dispatch messages (say of type `Msg`). Let's define the type of the command:
```fsharp
let httpRequest (request: Request) (responseHandler: Response -> 'Msg) : Cmd<'Msg> =
    (* . . . *)
```
As you can see, `httpRequest` is a function that takes in a `Request` as input along with a `reponseHandler` that *maps* the resulting `Response` into a message that is dispatched into our Elmish application. The function returns a command of that message type that is mapped from the `Response`. Basically this `httpRequest` function is saying: "Give me two things: the HTTP request you want to send as well as a way to map the response into a message *when* the response is available". Let's dive into the implementation:
```fsharp
let httpRequest (request: Request) (responseHandler: Response -> 'Msg) : Cmd<'Msg> =
    let command (dispatch: 'Msg -> unit) =
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
              let messageToDispatch =  responseHandler response
              dispatch messageToDispatch

        // send the request
        xhr.send(request.body)

    Cmd.ofSub command
```
Let us make a sample application using the command above to make something that looks like the following

<div style="margin-top: 40px; margin-bottom:40px; width:100%">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/lorem-ipsum.gif" />
  </div>
</div>

As you can see, the application loads, the screen turns into the "loading" state and after a short delay, the famous [lorem ipsum](https://www.lipsum.com/) text is shown on screen.

We start building the application by adding the lorem ipsum text into a `.txt` file inside the `public` directory called `lorem-ipsum.txt`:
```{highlight: [4]}
dist
  ├─── index.html
  ├─── fable.ico
  └─── lorem-ipsum.txt
```
We will load the contents of this file when the application starts using HTTP. Like always, we starting building the Elmish application by modelling the state of the application, for that we will use two important types we came up with in the [Modelling Asynchronous State](async-state.md) section:
```fsharp
type Deferred<'t> =
  | HasNotStartedYet
  | InProgress
  | Resolved of 't

type AsyncOperationStatus<'t> =
  | Started
  | Finished of 't
```
The `Deferred<'t>` type is used to model the state and the `AsyncOperationStatus<'t>` type is used for the events, they can be used as follows:
```fsharp
type State = {
    LoremIpsum : Deferred<Result<string, string>>
}

type Msg =
    | LoadLoremIpsum of AsyncOperationStatus<Result<string, string>>
```
I use `Result<string, string>` for the generic `'t` type argument because when making a HTTP request, you could either get a successful result when the status code is 200 or an error otherwise.

When the application starts up, the loading starts as well, so we implement `init()` as follows:
```fsharp
let init() = { LoremIpsum = HasNotStartedYet }, Cmd.ofMsg (LoadLoremIpsum Started)
```
Notice the initial command is `Cmd.ofMsg (LoadLoremIpsum Started)` which triggers the `LoadLoremIpsum Started` message. This message is responsible for initialing the HTTP request in the `update` function, let's see how it is done and discuss the individual parts afterwards
```fsharp
let update msg state =
    match msg with
    | LoadLoremIpsum Started ->
        let nextState = { state with LoremIpsum = InProgress }
        let request = { url = "/lorem-ipsum.txt"; method = "GET"; body = "" }
        let responseMapper (response: Response) =
            if response.statusCode = 200
            then LoadLoremIpsum (Finished (Ok response.body))
            else LoadLoremIpsum (Finished (Error "Could not load the content"))

        nextState, httpRequest request responseMapper

    | LoadLoremIpsum (Finished result) ->
        let nextState = { state with LoremIpsum = Resolved result }
        nextState, Cmd.none
```
Inside the branch of `LoadLoremIpsum Started` we make a GET request to `/lorem-ipsum.txt` to load the contents of the text file we added to the `public` directory, changing the state of `LoremIpsum` to `InProgress` and when the response comes back, we map it to a `LoadLoremIpsum (Finished result)` where `result` is either `Ok response.body` when the status code is 200 or `Error "Could not load the content"` otherwise.

Lastly, the easiest part of this Elmish program is the `render` function which is self-explanatory:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
    match state.LoremIpsum with
    | HasNotStartedYet ->
        Html.none

    | InProgress ->
        Html.div "Loading..."

    | Resolved (Ok content) ->
        Html.div [
            prop.style [ style.color.green ]
            prop.text content
        ]

    | Resolved (Error errorMsg) ->
        Html.div [
            prop.style [ style.color.red ]
            prop.text errorMsg
        ]
```
This program will always succeed, i.e. the HTTP request will always find the contents of the file and the status code will be 200 assuming there are no network errors. To make the status code return something else other than 200 to see how the program behaves, change the url of the HTTP request to a non-exitent resource such as `/non-existent.txt`:
```fsharp
let request = { url = "/non-existent.txt"; method = "GET"; body = "" }
```
The application ends up as follows:

<div style="margin-top: 40px; margin-bottom:40px; width:100%">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/http-error.png" />
  </div>
</div>

### Composability problems with `httpRequest`

In the section, we have seen how easy it is to use `XMLHttpRequest` in Elmish applications using the custom command `httpRequest` but it has one big problem which is that it does not compose: if you had to make multiple HTTP requests where each request has to be issued separately via a command, it would unnecessarily blow up the code with noise and your update function would be really hard to read. One could implement yet another custom command that issues multiple HTTP requests and lets you handle multipe responses (feel free to implement it by making a monadic `cmd` computation expression) but there is a much better approach that lets issue multiple requests and manipulate their responses easily with a single command which implements an asynchronous function:
```fsharp
type httpRequest : Request -> Async<Response>
```
Using this function, we can make multiple HTTP requests in a single `Async<'T>` expression:
```fsharp
async {
  let! response1 = httpRequest request1
  let! response2 = httpRequest request2
  let! response3 = httpRequest request3
  // etc.
  return ResponsesLoaded (response1, response2, response3)
}
```
This way we could do things with responses and map their results into Elmish messages. Not to mention that we could parallelize the execution of the requests and do all the fancy things you could do with `Async` expressions. In the next section, we will look closely into asynchronous `XMLHttpRequest`.

### Source code reference

You can find the source code used in this section in [this repository](https://github.com/Zaid-Ajaj/xmlhttprequest-in-elmish)