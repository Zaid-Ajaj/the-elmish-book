# From `Async<'t>` to `Cmd<'t>`

In the previous section, we implemented a command that dispatches a message after a delay. A delay is one example of an asynchronous operation. In F# we usually encode these operations using `Async<'t>` expressions. Instead of creating custom commands every time we use `Async<'t>`, we can try to abstract it away into generic commands that convert `Async<'t>` to `Cmd<'t>`. Let's take the example from last example and put it in it's own function, say `incrementDelayed()`:
```fsharp
let incrementDelayed() : Cmd<Msg> =
    let incrementDelayedCmd (dispatch: Msg -> unit) : unit =
        let delayedDispatch = async {
            do! Async.Sleep 1000
            dispatch Increment
        }

        Async.StartImmediate delayedDispatch

    Cmd.ofSub incrementDelayedCmd
```
There are two specific variables that were hardcoded in the function: the delay of 1000 milliseconds and the message `Increment` that will be dispatched. We can extract these into parameters of the function:
```fsharp {highlight: [1]}
let incrementDelayed (delay: int) (msg: Msg) : Cmd<Msg> =
    let incrementDelayedCmd (dispatch: Msg -> unit) : unit =
        let delayedDispatch = async {
            do! Async.Sleep delay
            dispatch msg
        }

        Async.StartImmediate delayedDispatch

    Cmd.ofSub incrementDelayedCmd
```
Now the function shouldn't be called `incrementDelayed` anymore because the message is parameterized and isn't necessarily the `Increment` message anymore. Maybe `delayedMsg` is more appropriate?
```fsharp
let delayedMsg (delay: int) (msg: Msg) : Cmd<Msg> =
    let incrementDelayedCmd (dispatch: Msg -> unit) : unit =
        let delayedDispatch = async {
            do! Async.Sleep delay
            dispatch msg
        }

        Async.StartImmediate delayedDispatch

    Cmd.ofSub incrementDelayedCmd
```
Now it is a generic delay function that can be used in `update` like this:
```fsharp {highlight: [5]}
let update msg state =
    match msg with
    | Increment -> { state with Count = state.Count + 1 }, Cmd.none
    | Decrement -> { state with Count = state.Count - 1 }, Cmd.none
    | IncrementDelayed -> state, delayedMsg 1000 Increment
```
Much more readable like this. Now you could easily implement `DecrementDelayed` as well as follows:
```fsharp
let update msg state =
    match msg with
    | Increment -> { state with Count = state.Count + 1 }, Cmd.none
    | Decrement -> { state with Count = state.Count - 1 }, Cmd.none
    | IncrementDelayed -> state, delayedMsg 1000 Increment
    | DecrementDelayed -> state, delayedMsg 1000 Decrement
```
But we are not done yet, if you examine the function `delayedMsg` again you will notice that we are hardcoding some functionality: the `Async.Sleep` function itself
```fsharp {highlight: [4]}
let delayedMsg (delay: int) (msg: Msg) : Cmd<Msg> =
    let incrementDelayedCmd (dispatch: Msg -> unit) : unit =
        let delayedDispatch = async {
            do! Async.Sleep delay
            dispatch msg
        }

        Async.StartImmediate delayedDispatch

    Cmd.ofSub incrementDelayedCmd
```
Since `delay` and `Async.Sleep` are used together, we can extract both of them away in a parameter such that `delayedMsg` can be rewritten as follows:
```fsharp {highlight: [4, 13]}
let delayedSleepMsg (sleep: Async<unit>) (msg: Msg) : Cmd<Msg> =
    let delayedCmd (dispatch: Msg -> unit) : unit =
        let delayedDispatch = async {
            do! sleep()
            dispatch msg
        }

        Async.StartImmediate delayedDispatch

    Cmd.ofSub delayedCmd

let delayedMsg (delay: int) (msg: Msg) : Cmd<Msg> =
    delayedSleepMsg (Async.Sleep delay) msg
```
Here `delayedMsg` is rewritten in terms of another function `delayedSleepMsg`, that function takes two inputs of type `Async<unit>` and `Msg`, simply dispatching the input `Msg` after `sleep` finishes.

We are almost there because we can now combine `Async<unit>` and `Msg` into a single parameter of type `Async<Msg>` to make up the function that takes `Async<Msg>` to `Cmd<Msg>`:
```fsharp
let fromAsync (operation: Async<Msg>) : Cmd<Msg> =
    let delayedCmd (dispatch: Msg -> unit) : unit = =
        let delayedDispatch = async {
            let! msg = operation
            dispatch msg
        }

        Async.StartImmediate delayedDispatch

    Cmd.ofSub delayedCmd
```
There we have it! Now we can take any async operation that returns a *message* and turn into a command, dispatching that message as a result of the async operation. The function `delayedMsg` can now be re-written in terms of `fromAsync`:
```fsharp
let delayedMsg (delay: int) (msg: Msg) : Cmd<Msg> =
    let delay = async {
        do! Async.Sleep delay
        return msg
    }

    fromAsync delay
```
### Making `fromAsync` a library function
We implemented `fromAsync` to take a concrete `Msg` type, if you had named your `Msg` something else like `Event` or `Message` then you would need to change the function signature as well. A better approach is to modify the function slightly and make it a *generic* function for some type `'msg` such that you could use it across your projects:
```fsharp
let fromAsync (operation: Async<'msg>) : Cmd<'msg> =
    let delayedCmd (dispatch: 'msg -> unit) : unit = =
        let delayedDispatch = async {
            let! msg = operation
            dispatch msg
        }

        Async.StartImmediate delayedDispatch

    Cmd.ofSub delayedCmd
```
You could even add it as an extension of the existing `Cmd` module:
```fsharp
module Cmd =
    let fromAsync (operation: Async<'msg>) : Cmd<'msg> =
        (* implementation here *)
```

### Accounting for failures in asynchronous operations