# Elmish Commands

A command in Elmish is a function with side-effects that can trigger events into the dispatch loop. Being able to trigger events means that a command has control over a dispatch function. Before we dive into examples and implementation, let us look at the signature of an Elmish command:
```fsharp
val command : Cmd<'Msg>
```
This type signifies that the value `command` is a command that can trigger events of type `'Msg`. An Elmish program using `Cmd<Msg>` is no longer a "simple program" and has an extended definition of the triplet `init`, `update` and `render`:
```fsharp
// Returns the initial state along with an initial command to execute
val init : unit -> State * Cmd<Msg>

// Computes the next state of the application and returns a command to be executed next
val update : Msg -> State -> State * Cmd<Msg>

// Computes how the user interface looks like based on the current state
val render : State -> (Msg -> unit) -> ReactElement
```
Here `render` has the same signature but `init` and `update` now return a tuple `State * Cmd<Msg>`. This means when initialising or updating the state, we don't just return state but also a command. This command executes a side-effect which in turn may trigger other event at some point in the future.

