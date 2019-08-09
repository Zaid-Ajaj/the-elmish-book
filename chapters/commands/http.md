# Introducing HTTP

So far in this chapter, we have learnt a lot about asynchronous operations in Elmish. Using commands, we are able to initiate these operations from our `update` function and process the events triggered by them. This was in preparation for understanding how to work with HTTP within the context of Elmish programs.

In any modern single page application, HTTP is the at core of the web application as the front-end exchanges data back and forth with a back-end by sending HTTP requests and processing HTTP responses.

Since we are only building a front-end, you might be wondering: "How will we work with HTTP if we don't have a back-end to communicate with?" and you would be almost right. The fact is, there *is* a back-end running and serving our front-end application while we are writing it during development: the webpack development server that acts a *static file server*. This means that the front-end we are building is able to ask the webpack developement server for the content of static files inside the `public` directory using HTTP the same way the browser itself asks for the index pages when navigating to the root URL at `http://localhost:8080`.

<div style="margin-top: 40px; margin-bottom:40px; width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/http-dev-server.png" />
  </div>
</div>

In the same way that the browser sends HTTP requests to the server, our Elmish application too can make HTTP requests, send them to webpack development server and process the HTTP responses it gets back. In the following sections, we will look into how that actually works and how we can can integrate HTTP communication into our Elmish applications from the very scratch.