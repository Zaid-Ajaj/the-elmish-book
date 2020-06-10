# Working with HTTP

So far in this chapter, we have learnt a lot about asynchronous operations in Elmish. Using commands, we are able to initiate these operations from our `update` function and process the events triggered by them. This was in preparation for understanding how to work with HTTP within the context of Elmish programs.

In any modern single page application, HTTP is at the core of the web application as the front-end exchanges data back and forth with a back-end by sending HTTP requests and processing HTTP responses.

Since we are only building a front-end, you might be wondering: "How will we work with HTTP if we don't have a back-end to communicate with?" and you would be almost right. The fact is, there *is* a back-end running and serving our front-end application while we are writing it during development: the webpack development server that acts a *static file server*. This means that the front-end we are building is able to ask the webpack development server for the content of static files inside the `dist` directory using HTTP the same way the browser itself asks for the index pages when navigating to the root URL at `http://localhost:8080`.

<div style="margin-top: 40px; margin-bottom:40px; width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/http-dev-server.png" />
  </div>
</div>

In the same way that the browser sends HTTP requests to the server, our Elmish application too can make HTTP requests, send them to webpack development server and process the HTTP responses it gets back. In the following sections, we will look into how that actually works and how we can can integrate HTTP communication into our Elmish applications from the very scratch.

### HTTP from the browser with JavaScript

A common question developers ask when getting started with Elmish is: "How to work with HTTP in Elmish?" The short answer is to use Elmish commands and asynchronous workflows, but before getting into any of that we should rephrase the question into "How to work with HTTP in JavaScript?" It is easy to forget that Fable compiles to plain old JavaScript and that the techniques used in plain old JavaScript are still very much applicable in Fable and Elmish applications.

There are many libraries in the JavaScript world to work with HTTP but they all depend upon a single foundational building block which is the so-called `XMLHttpRequest` object available in all browsers.

The object `XMLHttpRequest` can be used to make HTTP requests from the browser to a web server and make it possible to process the HTTP responses returned from that server. Despite the historical name, `XMLHttpRequest` is not tied to just XML as a data format for data exchange. In fact, it can use any generic data format like JSON or raw binary data.

To get started with `XMLHttpRequest` we need to install the API bindings for it in our application, so `cd` your way into the `src` directory and install the nuget package `Fable.Browser.XMLHttpRequest` into the project:
```bash
dotnet add package Fable.Browser.XMLHttpRequest
```
Here is an example on how to work with `XMLHttpRequest` in a non-Elmish context where we request the contents of a file from the webpack development server that is running locally and log the response to the console. Remember that the development server is a static file server so we can ask for the contents of any file in the `dist` directory, such as the contents of the `index.html` file that initiated the request itself:
```fsharp
open Browser.Types
open Browser

// create an instance
let xhr = XMLHttpRequest.Create()
// open the connection
xhr.``open``(method="GET", url="/index.html")
// setup the event handler that triggers when the content is loaded
xhr.onreadystatechange <- fun _ ->
    if xhr.readyState = ReadyState.Done
    then
      printfn "Status code: %d" xhr.status
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

As you can see, two messages are logged to the console, one that prints the status code and one that prints the response text of the response we got back for our request. This small snippet of code demonstrate how easy it is to request data from the server and get the response as text to further process it in the application. Let us go through the code snippet and discuss what happened.

First of all we created an instance of the `XMLHttpRequest` object using the static function `Create()`:
```fsharp
let xhr = XMLHttpRequest.Create()
```
We create an instance per request we want to send. It is common to give the value of the created instance the name `xhr`. Next we open up the communication using the `open` function, giving it two parameters: the HTTP "*method*" and the url that points to the resource we want to load, in this case the resource at path `/index.html` which points to the `index.html` file inside the `dist` directory:
```fsharp
xhr.``open``(method="GET", url="/index.html")
```
The server returned a response with status code 200 for the client which is what was printed to the console of the browser because the server was able to find the specified resource. Now if we ask for a resource that does not exist, i.e. a file that is not present in the `dist` directory such as `/non-existent.txt` and re-run the code, we get the following in our console:

<div style="width:100%;">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/xhr-demo-404.png" />
  </div>
</div>

Now the server responded with the infamous 404 status code, telling the client that it could not find the specified file we requested. This makes sense because the file does not exist. Also notice that the server still returned a HTML page that shows the error. This is same error page you get when you navigate the non existent page from your browser:

<div style="width:100%;">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/non-existent.png" />
  </div>
</div>

The `url` parameter we use in the `open` method contains a *relative* path: we don't need to specify the full url with the host or port etc. When using relative paths, the request is sent to the same "domain" from which the application was loaded in the first place. This means that when we request the resource at path `/index.html`, a HTTP request will be made to `http://localhost:8080/index` because `http://localhost:8080` is the "domain" from which we loaded our application. In other words, the request is sent to the "same origin" of the application itself.

### Cross-Origin HTTP Requests

We can use relative URLs to access content from same origin but this begs the question: can we use *absolute* URLs in our HTTP requests such that we can access content from other external websites? It depends, unlike desktop and mobile applications that can make HTTP requests to any website or domain, HTTP requests made from a browser application cannot reach any arbitrary website unless that website *gives permission* for access by means of [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) or CORS for short.

When a browser tries to communicate via HTTP with an external website or application, it is making a "cross origin" request. These requests are called "cross origin" because the web page initiating the request is trying to access a resource that is not from the same server (i.e. same origin) that the web page was served from.

These "cross origin" requests are blocked by default in many web applications and authors have to explicitly enable them. You can give it a try yourself by requesting the content of the home page of Google:
```fsharp
xhr.``open``(method="GET", url="http://www.google.com")
```
You will get the following error, along with a status code of zero and an empty response text

<div style="width:100%;">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/cross-origin-error.png" />
  </div>
</div>

The error you see above says: "Access to XMLHttpRequest at https://www.google.com [...] has been blocked by CORS policy: No `Access-Control-Allow-Origin` header is present on the requested resource".

This goes to say that you should not assume that a web page can access any arbitrary website freely. However, there are some external web applications that *do* allow cross-origin resource sharing, one of which will be very important in this chapter which is the [Hacker News Web API](https://github.com/HackerNews/API). Let us give it a try by requesting the top stories:

```fsharp
xhr.``open``(method="GET", url="https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty")
```

This is the response you get back:

<div style="width:100%;">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/hacker-news-api.png" />
  </div>
</div>

We get a status code of 200 (OK) and the response text containing an array of the identities of the latest top stories which you then can load in subsequent requests. The data returned from Hacker News API is formatted as JSON, the de-facto data format of the web. We will learn how to process JSON data into typed F# entities and vice-versa in the following sections of this chapter.

### HTTP requests without webpack development server

The webpack development server is just that: a tool to use *during development*. When you compile your F# project with Fable using the command `npm run build`, the compilation generates static files like `main.js` inside the `dist` directory and that's it, webpack is out of play after compilation has finished.

Now if you compile your project and run the `index.html` page directly in your favorite web browser, it will be *unable* to send HTTP requests giving you the following error:

<div style="width:100%;">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/origin-null.png" />
  </div>
</div>

The summary of the error is: "Access to XMLHttpRequest at [...] from origin 'null' has been blocked by CORS policy". I know many of these errors look cryptic but it is basically saying that we are trying to make HTTP requests from a web page without that web page being served from an "origin" or a domain (i.e. the `origin 'null'` part of the message). This means that in order to being able to send HTTP requests, the page that is initiating these requests **has** to be served from some server, at the very minimum, using a static file server.

Let's see how our application behaves after a full build with `npm run build` while being served from a *different* static file server instead of webpack. For that, we can install a development dependency called `http-server` from npm:
```
npm install http-server --save-dev
```
Now you should have the dependency added to your development dependencies in `package.json`:
```json {highlight: [11]}
{
    "private": true,
    "scripts": {
        "build": "webpack",
        "start": "webpack-dev-server",
    },
    "devDependencies": {
        "@babel/core": "^7.1.2",
        "fable-compiler": "^2.3.14",
        "fable-loader": "^2.1.8",
        "http-server": "^0.11.1",
        "webpack": "^4.38.0",
        "webpack-cli": "^3.3.6",
        "webpack-dev-server": "^3.7.2"
    }
}
```
Now we can add another npm script to let the `http-server` serve the files inside the `dist` directory:
```json {highlight: [6]}
{
    "private": true,
    "scripts": {
        "build": "webpack",
        "start": "webpack-dev-server",
        "serve": "http-server ./dist"
    },
    "devDependencies": {
        "@babel/core": "^7.1.2",
        "fable-compiler": "^2.3.14",
        "fable-loader": "^2.1.8",
        "http-server": "^0.11.1",
        "webpack": "^4.38.0",
        "webpack-cli": "^3.3.6",
        "webpack-dev-server": "^3.7.2"
    }
}
```
Now we are all set, run the `serve` script by running `npm run serve` to run the static file server. You should then be able to navigate to `http://localhost:8080/index.html` and the application should be behaving exactly the same as with the webpack development server:

<div style="width:100%;">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/http-server.png" />
  </div>
</div>

But you might wondering, why bother with a different static file server other than webpack development server? The reason is that the development server is kind of special and injects a lot of JavaScript artifacts in your `index.html` during development, for example to make the web page refreshed after you edit your source files. These added artifacts could be incompatible with many browsers and might break your actual application in a production environment.

