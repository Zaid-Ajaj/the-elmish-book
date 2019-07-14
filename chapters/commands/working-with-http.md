# Working with HTTP

A common question beginners ask when getting started with Fable is "How to work with HTTP in Elmish?" The short answer is to use Elmish commands and asynchronous workflows, but before getting into any of that we should rephrase the question into "How to work with HTTP in vanilla Javascript?" It is easy to forget that Fable compiles to plain old Javascript and that the techniques used in vanilla Javascript are still very much applicable in Fable and Elmish applications.

There are many libraries in the javascript world to work with HTTP but they all depend upon a single foundational building block which is the so-called `XMLHttpRequest` object available in all browsers.

### Working with `XMLHttpRequest`

The object `XMLHttpRequest` can be used to make HTTP requests from the browser to a web server and make it possible to process the HTTP responses returned from that server. Despite the historical name, `XMLHttpRequest` is not tied to just XML and it can make any generic HTTP request. To get started with `XMLHttpRequest` we need to install the API bindings for it in our Elmish application, so `cd` your way into the `src` directory and install the nuget package `Fable.Browser.XMLHttpRequest` into the project:
```bash
dotnet add package Fable.Browser.XMLHttpRequest
```
Here is an example on how to work with `XMLHttpRequest` in a non-Elmish context where we request the the contents of a file from the webpack development server and log it to the console, remember that the development server is a static file server so we can ask for the contents of any file in the `public` directory, such as the `index.html` file:
```fsharp
open Browser.Types
open Browser

// create an instance
let xhr = XMLHttpRequest.Create()
// open the connection
xhr.``open``(method="GET", url="/index.html")
// setup the event handler that triggers when the content is loaded
xhr.onreadystatechage <- fun _ ->
    if xhr.readyState = ReadyState.Done
    then
      printfn "Status code: %d" int xhr.status
      printfn "Content:\n%s" xhr.responseText

// send the request
xhr.send()
```
Before dissecting this code snippet, let us see what it does by running the code and inspecting the browser's console:

<div style="width:100%;">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/xhr-demo.png" />
  </div>
</div>

As you can see, two messages are logged to the console, one that prints the the "status code" and one the prints the "response text". This small snippet of code demonstrate how easy it is to request data from the server and get the response as text to further process it in the application. Let us go through the code snippet and discuss what happened.

First of all we created an instance of the `XMLHttpRequest` object using the static function `Create()`:
```fsharp
let xhr = XMLHttpRequest.Create()
```
We create an instance per request we want to send. It is common to give the value of the created instance the name `xhr`. Next we open up the communication using the `open` function, giving it two parameters: the HTTP "*method*" and the url that points to the resource we want to load, in this case the `index.html` file:
```fsharp
xhr.``open``(method="GET", url="/index.html")
```
Every HTTP request has a specific method, each of which tell the server how to respond to our request. The method "GET" says "Hey server, can you please GET me the data that is available at the specified URL?" In which case the server goes: "Yeah sure thing, I will first check if I can find what you are asking me for". After thinking a for bit, the server responds to the client with "There you go, I was able to find the contents you requested, here they are and everything is OK!".

An "OK" from the server is status code 200 for the client which is what was printed to the console of the browser because the server was able to find the specified resource. Now if we ask for a resource that does not exist, i.e. a file that is not present in the `public` directory such as `/non-existent.txt` and re-run the code, we get the following in our console:

<div style="width:100%;">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/xhr-demo-404.png" />
  </div>
</div>

Now the server responded with the infamous 404 status code, telling the client that it could not find the specified file we requested. This makes sense because the file does not exist. Also notice that the server still returned a HTML page that shows the error.