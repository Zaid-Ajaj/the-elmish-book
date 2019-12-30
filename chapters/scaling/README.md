# Introduction

Up until now, all of the examples we have seen in this book were Elmish applications initialized from a single Elmish *program*: the triplet of `init`, `update` and `render` along with their associated types.

There are two types of such programs: the "simple" programs where the `update` function doesn't have commands and the programs where their `update` functions do have commands and side-effects. Let us review the *definition* of these programs. Frist of all, given two types `Msg` and `State`:
```fsharp
type State = (* ... *)
type Msg   = (* ... *)
```
A simplified program is a triplet of functions
```fsharp
val init : unit -> State
val update : Msg -> State -> State
val render : State -> (Msg -> unit) -> ReactElement
```
Where as the non-simplified program has an extended definition that includes commands
```fsharp
val init : unit -> State * Cmd<Msg>
val update : Msg -> State -> State * Cmd<Msg>
val render : State -> (Msg -> unit) -> ReactElement
```
The applications we have building so far were made out of a *single* program
<div style="width:100%; margin: 50px">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/simple-app.png" />
  </div>
</div>
In this chapter, we will learn the systematic techniques of breaking a single program into multiple mini programs and understand the data flow between them.

<div style="width:100%; margin: 50px">
  <div style="margin: 0 auto; width:80%;">
    <resolved-image source="/images/scaling/multi-program-app.png" />
  </div>
</div>