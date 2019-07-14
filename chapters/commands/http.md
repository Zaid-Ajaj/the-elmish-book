# Introducing HTTP

In the first chapter, we were introduced to the webpack development server, the server that starts when we run the command `npm start`. This server runs locally on your machine using port 8080 by default, which is why we navigate to it using a browser to the link `http://localhost:8080`. Notice here the link starts with `http://`, this instructs the browser to communicate with the server using HTTP: a communication protocol for applications to talk to each other via a shared network.

Communication is always in the context of two parties, one that *initiates* the communication, *requesting* data and one that *answers* to these requests returning *responses* that contain the requested data. We call the party the initiates the communication the "client" and the party that responds to requests, the "server".

In the case of the webpack development server, the browser is the client because it requested the server for the page, which the server returned so that the browser could render it on screen, here the webpack development server acts as a *static file server*, it serves the files that are present in the `public` directory (except for `bundle.js` because it generates that dynamically and returns it to the browser, i.e. the client)

<div style="margin-top: 40px; margin-bottom:40px; width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/http-dev-server.png" />
  </div>
</div>

In the same way that the browser sends HTTP requests to the server, our Elmish application too can make HTTP requests, send them to webpack development server and process the HTTP responses it gets back. In the following sections, we will look into how that actually works and how we can can integrate HTTP communication into our Elmish applications from the very scratch.

We will apply the techniques we have learned in this chapter to model HTTP requests and responses in terms of Elmish commands and asynchronous workflows.