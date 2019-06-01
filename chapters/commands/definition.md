# What Are Commands?

I will spare you the confusion and vagueness of metaphores of commands, let's just get to the implementation already because it is a lot simpler than one might think in the beginning. A command is *essentially* a function takes a `dispatch` function as input and returns `unit`:
```fsharp
//           dispatch function
//                 ↓
val command : (Msg -> unit) -> unit
```
The function can decide when to `dispatch` a message. Not calling the dispatch function is another option, for example a command that doesn't do anything or doesn't dispatch any message is implemented as follows:
```fsharp
let none (dispatch: Msg -> unit) : unit = ()
```
Yup, that's it!

One caveat though, the type above in Elmish is technically *not* exactly of type `Cmd<'Msg>`. To make it a proper `Cmd<'Msg>` you need to *lift* the command into it's appropriate container type. The library function `Cmd.ofSub` does exactly that:

```fsharp
let none : Cmd<Msg> = Cmd.ofSub (fun (dispatch: Msg -> unit) -> ())
```
From now I will be using `Cmd.ofSub` when implementing our own commands.