# Failing Asynchronous Operations

The function `Cmd.fromAsync` we implemented in the previous section works nicely when the `Async<'t>` are pure and they cannot fail such as `async { return Increment }`. However, in F# it possible to throw exceptions inside `async` expressions and `Cmd.fromAsync` doesn't account for it.

When creating a command from an `Async<'t>` that can fail, we treat this failure as an event: in case of failure, dispatch a message to communicate back to the Elmish program that something went wrong, in which case you could change the state and re-render to tell the user that something went wrong.

Here is one possible implementation of an async command that handles errors:
```fsharp
let fromAsyncSafe (operation: Async<Msg>) (onError: exn -> Msg) : Cmd<Msg> =
    let delayedCmd (dispatch: Msg -> unit) : unit =
        let delayedDispatch = async {
            match! Async.Catch operation with
            | Choice1Of2 msg -> dispatch msg
            | Choice2Of2 error -> dispatch (onError error)
        }

        Async.StartImmediate delayedDispatch

    Cmd.ofSub delayedCmd
```
Here `fromAsyncSafe` is very similar to `Cmd.fromAsync` except that it takes another parameter `onError : exn -> Msg` which maps an exception (if any occur) to a message that will eventually be communicated back into the dispatch loop and your program can handle it.

Let's implement an example program that has a possibly failing operation. Remember that failure is something we want to account for and react upon when it happens. This means we need to have messages that convey the fact the something failed.

Here I thought of a simple async operation that generates a random number between 0.0 and 1.0 after a delay, if then number is less than 0.5 then the operation fails and an exception is thrown but otherwise a normal message is dispatched.

As always we start with the state and the messages types
```fsharp
type State = {
    Loading : bool
    Value : Result<float, string>
}

type Msg =
    | GenerateRandomNumber
    | RandomNumberSuccesfullyGenerated of float
    | FailedToGenerateRandomNumber of exn
```
Here the event `GenerateRandomNumber` issues the asynchronous command, from which either `RandomNumberSuccesfullyGenerated` or `FailedToGenerateRandomNumber` will get dispatched depending on whether the asynchronous operation in the command fails or succeeds.

The `init` is straightforward:
```fsharp
let init() = { Loading = false; Value = Ok 1.0 }, Cmd.none
```
I have chosen the initial value to be `Ok 1.0`. I admit that `Value` should have type `Option<Result<float, string>>` such that we could initialize it with `None` on application startup but this is a topic for the next section [Modelling Asynchronous State](async-state.md). For now it is good enough for demonstration purposes.

The `update` is more interesting:
```fsharp {highlight: [16]}
let rnd = System.Random()

let update msg state =
    match msg with
    | GenerateRandomNumber when state.Loading -> state, Cmd.none

    | GenerateRandomNumber ->
        let randomOp : Async<Msg> = async {
            do! Async.Sleep 1000
            let random = rnd.NextDouble()
            if random > 0.5
            then return RandomNumberSuccesfullyGenerated random
            else return! failwithf "Could not generate a 'good' random number: %f" random
        }

        let nextCmd = Cmd.fromAsyncSafe randomOp (fun ex -> FailedToGenerateRandomNumber ex)
        let nextState = { state with Loading = true }

        nextState, nextCmd

    | RandomNumberSuccesfullyGenerated number ->
        let nextState = { state with Loading = false; Value = Ok number }
        nextState, Cmd.none

    | FailedToGenerateRandomNumber ex ->
        let nextState = { state with Loading = false; Value = Error ex.Message }
        nextState, Cmd.none
```

Here, when the message `GenerateRandomNumber` is dispatched, we issue an asynchronous command that generates a random number after a delay of 1 second. if that number is less than 0.5 then an exception is thrown and the operation "fails".

Of course this an artificial failure because *we* are choosing when to throw an exception. In a real-world example, keep exception handling for operations that fail without us having control over their failure.

Lastly we render the `Value` onto the user interface. Green when it is `Ok` of some number and crimson when it is an `Error`. Of course we will have a button to dispatch the `GenerateRandomNumber` event:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
  let content =
    if state.Loading
    then h1 [ ] [ str "LOADING..." ]
    else match state.Value with
         | Ok number ->
            h1 [ Style [ Color "green" ] ] [
                str (sprintf "Succesfully generated random number: %f" number)
            ]
         | Error errMsg ->
            h1 [ Style [ Color "crimson" ] ] [
                str errMsg
            ]

  div [ ] [
    content
    button [ Disabled state.Loading;
             OnClick (fun _ -> dispatch GenerateRandomNumber) ]
           [ str "Generate Random" ]
  ]
```
The example looks like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/failing-random.gif" />
  </div>
</div>
