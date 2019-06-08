# Elmish Commands

A command in Elmish is a function that can trigger events into the dispatch loop. Being able to trigger events means that a command has control over a dispatch function. Before we dive into examples and implementation, let us look at the signature of an Elmish command:
```fsharp
val command : Cmd<'Msg>
```
This type signifies that the value `command` is a command that can trigger events of type `'Msg`. An Elmish program using `Cmd<'Msg>` is no longer a "simple program" and has an extended definition of the triplet `init`, `update` and `render`:
```fsharp
// Returns the initial state along with an initial command to execute
val init : unit -> State * Cmd<Msg>

// Computes the next state of the application and returns a command to be executed next
val update : Msg -> State -> State * Cmd<Msg>

// Computes how the user interface looks like based on the current state
val render : State -> (Msg -> unit) -> ReactElement
```
Here `render` has the same signature but `init` and `update` now return a tuple of the type `State * Cmd<Msg>`. This means when initializing or updating the state, we don't just return a state but also a command. This command is a function that may trigger (i.e. dispatch) a message.

### Counter With Commands
The Elmish library includes many built-in commands under the `Cmd` module. A very useful command is `Cmd.none` which is a command that doesn't do anything, i.e. doesn't dispatch any message. Following here is the [Counter](/chapters/elm/counter.md) example but with commands:

```fsharp {highlight: [9, 13, 14, 23]}
open Elmish

type State = { Count : int }

type Msg =
  | Increment
  | Decrement

let init() = { Count = 0 }, Cmd.none

let update msg state =
    match msg with
    | Increment -> { state with Count = state.Count + 1 }, Cmd.none
    | Decrement -> { state with Count = state.Count - 1 }, Cmd.none

let render state dispatch =
    div [ ] [
        h1 [ ] [ ofInt state.Count ]
        button [ OnClick (fun _ -> dispatch Increment) ] [ str "Increment" ]
        button [ OnClick (fun _ -> dispatch Decrement) ] [ str "Decrement" ]
    ]

Program.mkProgram init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```
Notice above a couple of things: returning `Cmd.none` as the second item of the tuple when returning the state, both in `init` and `update` functions. Also the use of `Program.mkProgram` instead of `Program.mkSimple` to construct an Elmish program that has commands.
