# Introduction

In the previous chapter we were introduced to the concept of an Elmish *program*. Every triplet of functions `init`, `update` and `render` makes up a single program and their signatures are:

```fsharp
// Returns the initial state
val init : unit -> State

// Computes the next state based on the current state and an incoming event (of type Msg)
val update : Msg -> State -> State

// Computes the user interface based on the current state
val render : State -> (Msg -> unit) -> ReactElement
```
Here, `State` represents the the type that holds data we want to keep track of while the application is running and `Msg` encodes the different events that can be triggered.

When we mention "events" we are talking about events that are triggered from the user interface. This is because the only way we can trigger an event is by using the `dispatch` function available as an argument of `render`:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
    button [ OnClick (fun _ -> dispatch Clicked) ] [
        str "Click Me"
    ]
```
We say a function "can trigger events" because "it has control over the dispatch function". When you break the `render` function in smaller pieces, you pass the `dispatch` function over to these smaller parts so that they too can trigger events, i.e. they have control over the dispatch function.

Following from the definition of a "simple program" is the fact that only `render` can trigger events. This means that nothing can happen in the application unless the user interacts with elements on the page. Moreover, the signature of the `update` function is synchronous by nature which means updating the state from asynchronous operations is not accounted for. This might make sense for very simple and limited applications like the ones we built in the previous chapter. We even constructed the program using the function `mkSimple`, which is short for "make simple":
```fsharp
Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```
However, in any real-world application, events can be triggered from many different sources such as HTTP requests, Web socket events, delayed events with timers and many others. All these events can be triggered without user interaction. These different sources are commonly referred to as the "side-effects" of an Elmish program.

Side-effects will be the main focus of this chapter, we will be extending the definition of an Elmish program to account for these side-effects and along the way we will be covering HTTP requests, working with JSON and generic program subscriptions such as timers and application navigation. Ready? Let's jump right in [Commands](commands.md)