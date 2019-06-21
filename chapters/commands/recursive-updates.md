# Recursive State Updates

In Elmish programs, commands are issued from two places; first is the `init` function where you can defines the initial command to be issued:
```fsharp
let initialState = (* state *)
let initialCmd = (* command *)
let init() = initialState, initialCmd
```
The second place is in the `update` function. Based on messages that come in, you calculate the next state and issue a command along with it:
```fsharp
type Msg =
  | IssueCommand
  | Terminate

let update msg state =
    match msg with
    | IssueCommand -> state, Cmd.ofMsg Terminate
    | Terminate -> state, Cmd.none
```
Here the command `Cmd.ofMsg` is a simple command that dispatches the given message immediately when the command is issued. It is both the most basic and most problematic command, you can define it by yourself easily with a one-liner:
```ocaml
let ofMsg (msg: 'msg) = Cmd.ofSub (fun (dispatch: 'msg -> unit) -> dispatch msg)
```

As the `update` function receives the message `IssueCommand`, it will return the state as is and issue the command `Cmd.ofMsg Terminate`. As a result of which, the `Terminate` message will be dispatched. When `update` receives The `Terminate` message, it returns the state as is and doesn't issue any commands further.

Suppose you start with an initial state and the user interface dispatches `IssueCommand` message, the execution diagram would looking something like this:
```
-> State: Initial State
-> New Message: IssueCommand (dispatched from UI)
-> New State returned as is
-> New Message: Terminate (dispatched from a command)
-> New State returned as is
-> No further commands issued
```

### Implicit Recursion

Now here is a question for you, what happens if `update` was implemented like this instead?
```fsharp {highlight: [3]}
let update msg state =
    match msg with
    | IssueCommand -> state, Cmd.ofMsg IssueCommand
    | Terminate -> state, Cmd.none
```
That's right, even if the `update` function itself isn't recursive, the function above will keep getting called by the Elmish runtime in an infinite loop!


<div style="width:100%; margin-top:50px;margin-bottom:50px;">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/commands/infinite-recursion.png" />
  </div>
</div>

It is very important to recognize and identify this pattern as it can become very problematic: even though we didn't explicitly define `update` as a recursive function, it ends up with an implicit recursive behavior because of the way it is hooked up with the Elmish runtime.

There is only one alternative to `Cmd.ofMsg`: not using this command at all!

There is never a good reason to use `Cmd.ofMsg` because in reality it is a command that changes the control flow of the `update` function. Instead of telling the Elmish runtime: "Hey, dispatch message `X` for me", you factor out the branch of of the `update` function that handles message `X` into a utility function and call that function from where you issue the command.

### Eliminating `Cmd.ofMsg` Usage

Let's take an example where developers could use the `Cmd.ofMsg` command, starting with the types:
```fsharp
type State = {
    InputDate : string
    ParsedDate : Result<DateTime, string>
}

type Msg =
    | SetInputDate of string
    | ParseInput
```
The `State` here represents a simple application that collects input data from the user and parses it as a date value.
```fsharp {highlight: [19]}
let init() = { InputDate = ""; ParsedDate = Error "" }, Cmd.none

/// Active pattern that matches dates of pattern dd-MM-yyyy
let (|Date|_|) (input: string) : Option<DateTime> =
  let (|Int|_|) (n: string) =
      try Some (int n)
      with | ex -> None

  match input.Replace(" ", "").Split "-" with
  | [| Int day; Int month; Int year |] ->
      try Some (DateTime(year, month, day))
      with | ex -> None
  | otherwise -> None

let update msg state =
    match msg with
    | SetInputDate inputDate ->
        let nextState = { state with InputDate = inputDate }
        let nextCmd = Cmd.ofMsg ParseInput
        nextState, nextCmd

    | ParseInput ->
        match state.InputDate with
        | Date date ->
            { state with ParsedDate = Ok date }, Cmd.none
        | otherwise ->
            let errMsg = sprintf "Input '%s' is not a valid date" state.InputDate
            { state with ParsedDate = Error errMsg }, Cmd.none
```
Notice here in the update function how the control flow goes from `SetInputDate` to `ParseInput`: when `SetInputDate` is dispatched, the state is updated but a command is issued that in turn triggers `ParseInput` which causes another state update.

When you see this type code you know that someone is abusing the Elmish dispatch loop to implement `goto` statements and control flow. Let that sink in ... yeah let's clean this up.

First take the body of the branch handled by `ParseInput` and extract it into a function that takes the state as input:
```fsharp
let parseInput (state: State) =
    match state.InputDate with
    | Date date ->
        { state with ParsedDate = Ok date }
    | otherwise ->
        let errMsg = sprintf "Input '%s' is not a valid date" state.InputDate
        { state with ParsedDate = Error errMsg }
```
Then use this function the branch of `SetInputDate`:
```fsharp {highlight: [5]}
let update msg state =
    match msg with
    | SetInputDate inputDate ->
        let nextState = { state with InputDate = inputDate }
        parseInput nextState, Cmd.none

    | ParseInput ->
        state, Cmd.none
```
Oh wait, now `ParseInput` has become useless. Just remove it altogether from `Msg` and `update`:
```fsharp
let parseInput (state: State) =
    match state.InputDate with
    | Date date ->
        { state with ParsedDate = Ok date }
    | otherwise ->
        let errMsg = sprintf "Input '%s' is not a valid date" state.InputDate
        { state with ParsedDate = Error errMsg }

let update msg state =
    match msg with
    | SetInputDate inputDate ->
        let nextState = { state with InputDate = inputDate }
        parseInput nextState, Cmd.none
```
There you have it, `Cmd.ofMsg` removed for good!

