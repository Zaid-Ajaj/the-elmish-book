# The Elm Architecture

The Elm Achitecture or TEA for short, is an architecture for building modular user interfaces. It was popularized by the [Elm](https://elm-lang.org/) programming language which mainly uses the TEA programming model for building web applications. 

Despite the name, this programming model is not restricted to the Elm language and many other programming languages use a variant of this architecture that fits within the context of the language. For example, in the javascript world, you have [React](https://reactjs.org/) and [Redux](https://redux.js.org/) as one of most popular TEA implementations. In Fable and F#, we have the [Elmish](https://elmish.github.io/elmish/) library: another implementation of TEA that fits very well with F# constructs. 

Our primary focus in this chapter will be the concepts of The Elm Architecture and how they are implemented within the Elmish library. 

### The Problem: User Interfaces

Whatever application you might be building, there are almost always *two* main concerns that a UI application has to deal with
 - How to keep track of and maintain the state of the application
 - How to keep the user interface in-sync with the state as it changes

The Elm Architecture provides a systematic approach for these problems using a number of building blocks. These blocks are divided into the following: 

 - State: also known as the *Model* is a type that represents the data you want to keep track of while the application is running
 
 - Messages: are the types of events that can change your state, these messages can either be triggered from the user interface or from external sources. The messages are usually modelled with a discriminated union. 

 - The Update function: is a function such that it takes a triggered message or event with the current state, then calculates the *next* state of the application.

 - The Render function: also known as the "view" function, takes the current state and builds user interface from it. The user interface can trigger messages or events. 

These concepts take time and a lot of practice to get used to. They might seem a bit vague at this point and you might have tons of questions. That is fine for now, we are just getting started and we will take it step by step. The next section [Counter with Elmish](counter) will cover the concepts in great detail by example.