# Integrating Commands

In the previous section, we looked at an example for splitting up a program into smaller modular programs and wire them from a parent program. However, we restricted ourselves to only working with *simple* programs: those without commands or side effects in their definition. In this section, we will pick up the example from where it was left off and try to integrate commands in the process of wiring up child programs with their parent ones. I want to add a button to the counter view which dispatches the `Increment` event after a delay of one second.

<div style="margin-top: 40px; margin-bottom:40px; width:100%">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/scaling/multiple-programs-with-commands.gif" />
  </div>
</div>

Here, we have introduced a command that triggers an asynchronous operation within the `Counter` module, in fact we have seen this multiple times. The difference though, is that this command is now triggered from a child program.

Introducing commands in any program in an Elmish application *requires* that the root program also returns commands, i.e. the root program that is bootstrapped must not be a simple program. Let us start with that and make the entry program in the `App` module return commands:
```fsharp {highlight: [5, 11, 15, 18]}
(* in App.fs *)
let init() =
 { Counter = Counter.init()
   InputText = InputText.init()
   CurrentPage = Page.Counter }, Cmd.none

let update (msg: Msg) (state: State) =
  match msg with
  | CounterMsg counterMsg ->
      let updatedCounter =  Counter.update counterMsg state.Counter
      { state with Counter = updatedCounter }, Cmd.none

  | InputTextMsg inputTextMsg ->
      let updatedInputText = InputText.update inputTextMsg state.InputText
      { state with InputText = updatedInputText}, Cmd.none

  | SwitchPage page ->
      { state with CurrentPage = page }, Cmd.none

(* in Main.fs *)
Program.mkProgram App.init App.update App.render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```
The `init` and `update` function of `App` now have the full signature of a non-simple program:
```fsharp
val init : unit -> State * Cmd<Msg>
val update : Msg -> State -> State * Cmd<Msg>
```
Right now these commands aren't doing anything which is fine because this is just the starting point where we make the entry program work with commands before moving on. After all, the utility function `Program.mkSimple` that bootstraps simple programs into existence was only made for tutorials and demos.

### Commands In Counter

Now that the entry program can work with commands, we can start implementing the delayed incrementing of the counter inside the `Counter` child program. There is actually nothing new in this, so I will just present the pieces that were modified:
```fsharp {highlight: [8, '19-25', '37-40']}
(* In Counter.fs *)
[<RequireQualifiedAccess>]
module Counter

 type Msg =
   | Increment
   | Decrement
   | IncrementDelayed

   let init() =
    { Count = 0 }

let update (counterMsg: Msg) (counterState: State) =
  match counterMsg with
  | Increment ->
      { counterState with Count = counterState.Count + 1 }, Cmd.none
  | Decrement ->
      { counterState with Count = counterState.Count - 1 }, Cmd.none
  | IncrementDelayed ->
      let delayedIncrement = async {
        do! Async.Sleep 1000
        return Increment
      }

      counterState, Cmd.fromAsync delayedIncrement

let render (state: State) (dispatch: Msg -> unit) =
  Html.div [
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

    Html.h1 state.Count
  ]
```
It is worth mentioning that even though the function `Counter.update` now has the full definition that involves commands, the function `Counter.init` doesn't. There is no requirement for the pieces of child programs to have the "standard" definitions but instead they can be adapted for different use cases. In our case, `init` can stay as is and `update` can be expanded:
```fsharp
module Counter

val unit : init -> State
val update : Msg -> State -> State * Cmd<Msg>
```
Alright, now that the return type of `Counter.update` has changed, the caller of this function, `App.update` has to be refactored accordingly:
```fsharp {highlight: [4]}
let update (msg: Msg) (state: State) =
  match msg with
  | CounterMsg counterMsg ->
      let updatedCounter, counterCmd =  Counter.update counterMsg state.Counter
      { state with Counter = updatedCounter }, Cmd.none

  | InputTextMsg inputTextMsg ->
      let updatedInputText = InputText.update inputTextMsg state.InputText
      { state with InputText = updatedInputText}, Cmd.none

  | SwitchPage page ->
      { state with CurrentPage = page }, Cmd.none
```
The `Counter.update` function now returns a tuple: the updated state and a command. As things stand now from the snippet above, only the updated state of the counter is being used to update the next state of the parent program. However, the command returned from the function, i.e. the `counterCmd` value, is just ignored there. What do we do with it? If it was a root program, we just return the command and the Elmish dispatch loop takes care of it, but now since it is coming from the child program, the parent program is responsible for it.

Consider the type signature of `counterCmd`, it is `Cmd<Counter.Msg>`. What we actually need is a `Cmd<App.Msg>` so that it becomes the command that is able to dispatch messages of the top-level `Msg` type and let the Elmish dispatch loop take care of the rest.

The problem comes down to converting a value of type `Cmd<Counter.Msg>` into `Cmd<App.Msg>`. More generally, a function that *transforms* commands:
```fsharp
val transform : Cmd<'something> -> Cmd<'somethingElse>
```
The Elmish library already includes such function, it is called `Cmd.map` and has the following signature:
```fsharp
//                  Transformer function        Input command      Output command
//                         ↓                         ↓                   ↓
val Cmd.map : ('something -> 'somethingElse) -> Cmd<'something> -> Cmd<'somethingElse>

// In our case:
Cmd<'something>     = Cmd<Counter.Msg>
Cmd<'somethingElse> = Cmd<App.Msg>
```
This problem is simplified even further to just implementing a transformer function `Counter.Msg -> App.Msg`:
```fsharp
let transformCounterMsg (counterMsg: Counter.Msg) : App.Msg =
    Msg.CounterMsg counterMsg

// Written inline

(fun counterMsg -> Msg.CounterMsg counterMsg)
```
The `App.update` function becomes:
```fsharp {highlight: [5]}
let update (msg: Msg) (state: State) =
  match msg with
  | CounterMsg counterMsg ->
      let updatedCounter, counterCmd =  Counter.update counterMsg state.Counter
      let appCmd = Cmd.map (fun counterMsg -> Msg.CounterMsg counterMsg) counterCmd
      { state with Counter = updatedCounter }, appCmd

  | InputTextMsg inputTextMsg ->
      let updatedInputText = InputText.update inputTextMsg state.InputText
      { state with InputText = updatedInputText}, Cmd.none

  | SwitchPage page ->
      { state with CurrentPage = page }, Cmd.none
```
The `Cmd.map` function transforms a command such that *when* that command dispatches an event, that event is transformed using the input transform function which gives a new command that is able to dispatch events of the transformed type. This means that `Cmd.map` does not change the behavior of side-effects, it only transforms the events that they might dispatch at some point in time.

The F# compiler will tell you that this form
```fsharp
Cmd.map (fun counterMsg -> Msg.CounterMsg counterMsg) counterCmd
```
can be simplified to get rid of the inline function and use the discriminated union case directly as a function itself (without the need to fully qualify it):
```fsharp
Cmd.map CounterMsg counterCmd
```
This is how you will see Elmish applications implement command propagation from child programs into parent ones. The same logic follows for the `init` function of the parent `App` program if its child programs had commands in their `init` definition. It is not the case here, but for the sake of completeness, let us pretend that the `init` functions of the child programs *do* return initial commands along with their initial states, then the `init` of the parent would look like this:
```fsharp {highlight: ['10-13']}
let init() =
  let counterState, counterCmd = Counter.init()
  let inputTextState, inputTextCmd = InputText.init()

  let initialState =
    { Counter = counterState
      InputText = inputTextState
      CurrentPage = Page.Counter }

  let initialCmd = Cmd.batch [
    Cmd.map CounterMsg counterCmd
    Cmd.map InputTextMsg inputTextCmd
  ]

  initialState, initialCmd
```
This is saying two things:
 - "The initial state of the parent program is the composed states of the child programs"
 - "The initial command of the parent program is all the commands of the child programs, batched as one command and each of them is transformed to wrap the dispatched messages into the `Msg` type of the parent program."

You can find the source code of this example in the repository [Zaid-Ajaj/multiple-programs-with-commands](https://github.com/Zaid-Ajaj/multiple-programs-with-commands) for reference. I have also added a new file called "Extensions.fs" that includes an auto-opened module which contains the `Cmd.fromAsync` function because unfortunately it is not included in the core Elmish library.
