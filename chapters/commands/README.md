# Introduction

In the previous chapter we were introduced to the concept of an Elmish *program* which consists of a triplet of functions `init`, `update` and `render`. The signature of these function are defined as follows:

```fsharp
// Returns the initial state
val init : unit -> State

// Computes the next state based on the current state and an incoming event (of type Msg)
val update : Msg -> State -> State

// Computes the user interface based on the current state
val render : State -> (Msg -> unit) -> ReactElement
```
Here, `State` represents the the type that holds data we want to keep track of while the application is running and `Msg` encodes the different events that can be triggered.

An Elmish program revolves around the state that it manages and the events that change that cause the state to change. When we mention "events" we are talking about events that are triggered from the user interface. This is because the only way we can trigger an event is by using the `dispatch` function available as an argument of `render`:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
    button [ OnClick (fun _ -> dispatch Clicked) ] [
        str "Click Me"
    ]
```
In other words, the ability to dispatch a message (i.e. trigger an event) is a matter of having control over the `dispatch` function. From our definition of an Elmish program it follows that only `render` can trigger events. This means that nothing can happen in the application unless the user interacts with elements on the page. Moreover, the signature of the `update` function is synchronous by nature which means updating the state from asynchronous operations is not accounted for. This might make sense for very simple and limited applications like the ones we built in the previous chapter. We even constructed the program using the function `mkSimple`, which is short for "make simple":
```fsharp
Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```
However, in any real-world application, events can be triggered from many different sources with or without user interactions. Asynchronous state updates are not only ubiquitous but also an absolute necessity in today's web applications as they communicate back and forth with different web API's for data exchange. Not to forget that an application can subscribe or unsubscribe to an event stream such as Web Sockets or timers.

In this chapter, we will extend the definition of an Elmish program to account for these different sources of events. We will do by introducing the concept of *commands* which will be the main focus of the chapter. Along the way we will be learning about HTTP requests, working with JSON and understand program navigation. Ready? Let's jump right in