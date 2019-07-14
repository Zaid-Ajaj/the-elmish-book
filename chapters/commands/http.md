# Working with HTTP

### The Basics
In the first chapter, we were introduced to the webpack development server, the server that starts when we run the command `npm start`. This server runs locally on your machine using port 8080 by default, which is why we navigate to it using a browser to the link `http://localhost:8080`. Notice here the link starts with `http://`, this instructs the browser to communicate with the server using HTTP: a communication protocol for applications to talk to each other via a shared network.

Communication is always in the context of two parties, one that *initiates* the communication, *requesting* data and one that *answers* to these requests returning *responses* that contain the requested data.