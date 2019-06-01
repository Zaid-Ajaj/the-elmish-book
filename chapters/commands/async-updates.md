# Asynchronous Updates

Consider the signature of the `update` function:
```fsharp
val update : Msg -> State -> State * Cmd<Msg>
```
`update` is by definition a synchronous function: it returns the next state *immediately*. Synchoronous state updates are known to be easier to think about and easier to unit-test. This requirement is enforced by The Elm Architecture. Consequently, asynchronous state updates are simply not possible to do in the `update` function.

<div style="padding:20px; border: 1px solid lightgrey;border-radius:5px;">
Asynchronous operations are any operation that will take some *time* to finish such as timer delays or HTTP requests.
</div>

Instead of updating the state asynchronously, we utilize commands to issue separate events: one is triggered in the beginning of the asynchronous operation and another issued at the end of operation. Updating the state in reaction to the "delayed" message simulates an asynchronous update.

Let's see this in action, consider the following counter application where it has a "delayed increment" button. Clicking this button will update the state after a delay of one second:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/commands/delayed-counter.gif" />
  </div>
</div>

This is the same counter application that you now have seen a couple of times with the addition of a "delayed increment" button. Like always, we start with the `State` and the `Msg` types:
```fsharp {highlight: [6]}
type State = { Count: int }

type Msg =
  | Increment
  | Decrement
  | IncrementDelayed
```
The state type is kept the same, only now we have another `Msg` case: `IncrementDelayed`. This message is dispatched from the `render` function:
```fsharp {highlight: [6]}
let render (state: State) (dispatch: Msg -> unit) =
  div [ ] [
    h1 [ ] [ ofInt state.Count ]
    button [ OnClick (fun _ -> dispatch Increment) ] [ str "Increment" ]
    button [ OnClick (fun _ -> dispatch Decrement) ] [ str "Decrement" ]
    button [ OnClick (fun _ -> dispatch IncrementDelayed) ] [ str "Increment Delayed" ]
  ]
```
The interesting part is the `update` function:
```fsharp {highlight: ['6-14']}
let update (msg: Msg) (state: State) =
  match msg with
  | Increment -> { state with Count = state.Count + 1 }, Cmd.none
  | Decrement -> { state with Count = state.Count - 1 }, Cmd.none
  | IncrementDelayed ->
      let incrementDelayedCmd (dispatch: Msg -> unit) : unit =
          let delayedDispatch = async {
              do! Async.Sleep 1000
              dispatch Increment
          }

          Async.StartImmediate delayedDispatch

      state, Cmd.ofSub incrementDelayedCmd
```
A couple of things are going on in the code above. We have the asynchronous operation `delayedDispatch` that will call the `dispatch` function after sleeping for one second. Afterwards, we start the operation in the background using `Async.StartImmediate` so that `incrementDelayedCmd` returns `unit` at the end making it a proper input for `Cmd.ofSub`.