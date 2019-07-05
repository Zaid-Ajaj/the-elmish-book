# Asynchronous Recursive Updates

In the previous section, we talked about how the command `Cmd.ofMsg` made our update function implicitly recursive. We also saw how to eliminate the use of said command using plain old control flow. This is not to say that recursive state updates are "bad" or shouldn't be utilized, it is just helpful to identity the implicit recursion pattern and simplify the code when possible. That said, recursive state updates can be really interesting and actually quite fun when *combined* with asynchronous workflows.

Similar to recursive functions, asynchronous recursive workflows can either be running indefinitely or stop running upon satisfying a base condition. An indefinite workflow can be a simple timer application that shows the current time and keeps updating it every second. A workflow that stops executing upon reaching a base condition is for example when you have a countdown that starts at a number and decreases the number every second until that number has reached zero. In the context of the Elmish application, we want to re-render the UI after every "step" of the asynchronous workflow. Re-rendering the UI means that with every step, we have to dispatch a message into the Elmish dispatch loop. Let's see this concept in action.

### Simple Timer

A timer keeps track of the current time, updating it every second. It looks something like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/async-timer.gif" />
  </div>
</div>

The data model is rather simple, consider the types:
```fsharp
type State = {
    CurrentTime: DateTime
}

type Msg =
    | Tick
```
Using these messages, every time `Tick` is dispatched, the current time is updated and after one second, dispatches itself again.
```fsharp
let update (msg: Msg) (state: State) =
    match msg with
    | Tick ->
        let nextState = { state with CurrentTime = DateTime.Now }
        let step = async {
            do! Async.Sleep 1000
            return Tick
        }

        nextState, Cmd.fromAsync step
```
This way you get an application that ticks indefinitely but how do kick-start the recursion, *something* has to trigger `Tick` at some point right? Since I want to start the asynchronous workflow as soon as the program starts, I want to dispatch the `Tick` message from my `init()` function:
```fsharp
let init() = { CurrentTime = DateTime.Now }, Cmd.ofMsg Tick
```
Notice how the proper use of `Cmd.ofMsg` as it is executed once when the application starts up and not from the `update` function. Once started, the ticking cannot be stopped as there is no base condition to stop the recursion. Finally the `render` function is implemented to format the time and show it on screen:
```fsharp
let formatTime (time: DateTime) =
    let padZero n = if n < 10 then sprintf "0%d" n else string n
    sprintf "%s:%s:%s" (padZero time.Hour) (padZero time.Minute) (padZero time.Second)

let render (state: State) (dispatch: Msg -> unit) =
  div [ Style [ Padding 20 ] ] [
      h1 [ ] [ str (formatTime state.CurrentTime) ]
  ]
```
