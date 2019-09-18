# Asynchronous Updates

Consider the signature of the `update` function:
```fsharp
val update : Msg -> State -> State * Cmd<Msg>
```
`update` is by definition a synchronous function: it returns the next state *immediately*. This requirement is enforced by The Elm Architecture which means that asynchronous state updates are simply not possible to do in the `update` function.

<div style="padding:20px; border: 1px solid lightgrey;border-radius:5px;">
Asynchronous operations are any operation that will take some *time* to finish such as timer delays or HTTP requests.
</div>

Instead of updating the state asynchronously, we utilize commands to issue separate events: one is triggered in the beginning of the asynchronous operation and another issued at the end of the operation. Updating the state in reaction to the "delayed" message, i.e. the latter event, simulates an asynchronous update. The consequence is that state updates stay synchronous but the *dispatching* of events is done asynchronously.

Why is it like this in Elmish I hear you say? Synchronous state updates are very easy both in implementation and in the way we think about them. Asynchronous updates on the other hand can become very tricky to implement and concurrent updates can lead to very "interesting" bugs. Not to mention that synchronous updates are a lot easier to unit test.

Let's see this in action, consider the following counter application where it has a "delayed increment" button. Clicking this button will update the state after a delay of one second, this is an example of an asynchronous update:

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
The state type is kept the same, only now we have another `Msg` case: `IncrementDelayed`. This message is dispatched from the `render` function as usual:
```fsharp {highlight: ['15-18']}
let render (state: State) (dispatch: Msg -> unit) =
  Html.div [
    Html.h1 state.Count

    Html.button [
      prop.onClick (fun _ -> dispatch Increment)
      prop.text "Increment"
    ]

    Html.button [
      prop.onClick (fun _ -> dispatch Decrement)
      prop.text "Decrement"
    ]

    Html.button [
      prop.onClick (fun _ -> dispatch IncrementDelayed)
      prop.text "Increment Delayed"
    ]
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
A couple of things are going on in the code above. The most important of which is that we are returning the state *as is* not modifying it whatsoever but along with it we return the command `incrementDelayedCmd`. This command is a function that has `dispatch` as input which starts an asynchronous operation immediately. The operation is a simple `Async.Sleep` function that will wait for a second before calling `dispatch Increment` which in turn will update the state synchronously the same way as if the user clicked the "Increment" button. The following diagram illustrates the operation:

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/async-operation.png" />
  </div>
</div>

Despite the fact that the user only the UI change after one second, the UI was actually updated *twice*. Once immediately after `IncrementDelayed` was dispatched and another time after one second when `Increment` was dispatched from inside the command.

We can do better than this and show the user a "loading" screen when there is an ongoing asynchronous operation in the background. To do so, we add a flag to the state called `Loading`:
```fsharp {highlight: [3]}
type State = {
    Count : int
    Loading : bool
}
```
When we start an asynchronous operation, we set `Loading` to `true` and when the operation finishes we set it to `false`. Based on this flag we can tell user that something is in-progress. Implementing this feature to the existing `update` function is simple as follows:

```fsharp {highlight: [3, 14]}
let update (msg: Msg) (state: State) =
  match msg with
  | Increment -> { state with Loading = false; Count = state.Count + 1 }, Cmd.none
  | Decrement -> { state with Count = state.Count - 1 }, Cmd.none
  | IncrementDelayed ->
      let incrementDelayedCmd (dispatch: Msg -> unit) : unit =
          let delayedDispatch = async {
              do! Async.Sleep 1000
              dispatch Increment
          }

          Async.StartImmediate delayedDispatch

      { state with Loading = true }, Cmd.ofSub incrementDelayedCmd
```
Then the user interface can show the text "LOADING" when the `Loading` is enabled:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
  let content =
    if state.Loading
    then Html.h1 "LOADING..."
    else Html.h1 state.Count

  Html.div [
    content
    Html.button [
      prop.onClick (fun _ -> dispatch Increment)
      prop.text "Increment"
    ]

    Html.button [
      prop.onClick (fun _ -> dispatch Decrement)
      prop.text "Decrement"
    ]

    Html.button [
      prop.onClick (fun _ -> dispatch IncrementDelayed)
      prop.text "Increment Delayed"
    ]
  ]
```
You end up with the following user interface

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/commands/loading-counter.gif" />
  </div>
</div>

Going even further, you can disallow the user to trigger certain events while there is an ongoing asynchronous operation. For example, if the user clicks `IncrementDelayed`, they shouldn't be allowed to trigger it again until the operation has finished (i.e. when `Loading` is `false`). There are two ways of implementing this, first is from user interface itself by disabling the "Increment Delayed" button until the operation finishes. The second option is in the `update` function, returning the state as is without commands if the operation is still ongoing (i.e. `Loading` is `true`). Let's do both, the `render` functions becomes:
```fsharp {highlight: [20]}
let render (state: State) (dispatch: Msg -> unit) =
  let content =
    if state.Loading
    then Html.h1 "LOADING..."
    else Html.h1 state.Count

  Html.div [
    content
    Html.button [
      prop.onClick (fun _ -> dispatch Increment)
      prop.text "Increment"
    ]

    Html.button [
      prop.onClick (fun _ -> dispatch Decrement)
      prop.text "Decrement"
    ]

    Html.button [
      prop.disabled state.Loading
      prop.onClick (fun _ -> dispatch IncrementDelayed)
      prop.text "Increment Delayed"
    ]
  ]
```
Here we say that the button is disabled when `state.Loading` is true and will not be able to trigger/dispatch `IncrementDelayed` anymore. Now to enforce the requirement from the `update` function as well, we do it as follows
```fsharp {highlight: [5]}
let update (msg: Msg) (state: State) =
  match msg with
  | Increment -> { state with Loading = false; Count = state.Count + 1 }, Cmd.none
  | Decrement -> { state with Count = state.Count - 1 }, Cmd.none
  | IncrementDelayed when state.Loading -> state, Cmd.none
  | IncrementDelayed ->
      let incrementDelayedCmd (dispatch: Msg -> unit) =
          let delayedDispatch = async {
              do! Async.Sleep 1000
              dispatch Increment
          }

          Async.StartImmediate delayedDispatch

      { state with Loading = true }, Cmd.ofSub incrementDelayedCmd
```
The resulting application becomes:

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/disabled-counter.gif" />
  </div>
</div>

The line `IncrementDelayed when state.Loading -> state, Cmd.none` is very common in Elmish application, many times you want to certain events such as `IncrementDelayed` to have no effect in certain state conditions such when there is an ongoing asynchronous operation which is why you "trap" the state into the "empty transition" or the "sink transition" that does nothing to the state and does not execute any futher commands.

### Conclusion

In this section we were able to deal with a simple asynchronous update, controlling both the state and user interface at the beginning of the operation as well as the end of it. Although the `update` function is synchronous by nature, asynchronous updates can be dealt with using commands that can dispatch events at their disposal.