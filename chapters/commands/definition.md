# What Are Commands?

I will spare you the confusion and vagueness of metaphores of commands, let's just get to the implementation already because it is a lot simpler than one might think in the beginning. A command is *essentially* a function takes a `dispatch` function as input and returns `unit`:
```fsharp
//           dispatch function
//                 ↓
val command : (Msg -> unit) -> unit
```
The function can decide when to `dispatch` a message, whether it is immediate or at some point in future as a result of an asynchronous operation. Not calling the dispatch function is another option, for example a command that doesn't do anything or doesn't dispatch any message is implemented as follows:
```fsharp
let none (dispatch: Msg -> unit) : unit = ()
```
Yup, that's it!

One caveat though, the type `(Msg -> unit) -> unit` in Elmish is technically *not* exactly of type `Cmd<'Msg>`. To make it a proper `Cmd<'Msg>` you need to *lift* the command into it's appropriate container type. The library function `Cmd.ofSub` does exactly that:

```fsharp
let none : Cmd<Msg> = Cmd.ofSub (fun (dispatch: Msg -> unit) -> ())
```

<div style="padding:20px; border: 1px solid lightgrey;border-radius:5px;">
The current container type for commands is a list. This means the Cmd.ofSub just takes the input function and puts in a list and it becomes a proper command. However, this is an implementation detail that *we*, consumers of the library, shouldn't be concerned with.
</div>

Although there are many built-in commands in the `Cmd` module, I have decided that we will write the commands we need from *scratch* because this is the best way to learn and understand them.