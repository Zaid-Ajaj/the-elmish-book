# XMLHttpRequest in Elmish

In the previous chapter, we have seen how to use `XMLHttpRequest` in a non-Elmish context where we just execute the HTTP request and log the results to the console. In this section, we will examine a number of techniques to integrating `XMLHttpRequest` into an Elmish program.

### From `XMLHttpRequest` To Commands

The very first attempt to integrating any callback-based API such as that of `XMLHttpRequest` into an Elmish program is to implement them directly as commands. To turn a HTTP request into a command means that the command will be able to dispatch various messages from events that are triggered from the `XMLHttpRequest`, in particular the `onreadystatechange` event.

As a HTTP request is being processed, this event is triggered multiple times notifying the subscribers of the event about the current state the HTTP request. For the purposes of this section, we will only interested in the state of the HTTP request when it has `DONE` processing and the response information is available for use. We will not be looking into the intermediate states of an ongoing HTTP request and that is enough to cover 99% of the requirements a web application has when it comes to making HTTP requests.

I hear you saying: "just get to the code already!?" and we will surely do! For our first attempt, let's define some types first
```fsharp
type Request = { url: string; method: string; body: string }
type Response = { statusCode: int; body: string }
```
Here we are defining very simplified representations of HTTP requests and responses. A HTTP request has the following:
 - A `url`: the location of the requested resource
 - A `method`: the so-called method of the request that determines the "type" of request the application sends such as `GET`, `POST`, `DELETE` etc.
 - A `body` to send along the request which is for now just a simple string.

On the other hand, a HTTP response has:
 - A `status code` which is a number that determines the status of the response
 - A `body` that the server has returned for the specific request that was processed, which in this simple case is also a string.

These definitions have some serious limitations because neither the `Request` nor the `Response` take HTTP headers into account  which are essential metadata about the data exchange for a single HTTP roundtrip and the subsequent requests. There is also the fact that the `body` of the response is a string which not always the case as there are multiple formats the response `body` can have such as raw binary data encoded as `UInt8Array` or `Blob` but for the purposes of this sample implementation we will skip over these concerns.

With these types in mind, we can the model the type of the command itself. Remember that a command is something that is able to dispatch messages (say of type `Msg`). Let's define the type of the command:
```ocaml
let request (req: Request) (responseHandler: Response -> 'Msg) : Cmd<'Msg> = (* . . . *)
```