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
But we are not done yet, if you examine the function `delayedMsg` again you will notice that we are hardcoding something: the delay itself with the `Async.Sleep` function:
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

We are almost there because we can now combine `Async<unit>` and `Msg` into a generic `Async<Msg>`: an async operation that returns the message that will dispatched:
```fsharp
let fromAsync (operation: Async<Msg>) : Cmd<Msg> =
    let delayedCmd (dispatch: Msg -> unit) : unit = =
        let delayedDispatch = async {
            let! msg = operation
            dispatch msg
        }

        Async.StartImmediate delayedDispatch

    Cmd.ofSub delayedCmd

let delayedMsg (delay: int) (msg: Msg) : Cmd
```