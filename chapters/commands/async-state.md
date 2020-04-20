# Modelling Asynchronous State

Asynchronous updates usually follow a simple pattern: every asynchronous operation is coupled with a "start" event and a "finished" event. The `start` event doesn't need any parameter most of the time and it only responsible for issuing a command that eventually dispatches the `finished` event which carries the result of the operation.

If your program happens to work with multiple asynchronous operations, then your `Msg` type could end up looking like this:
```fsharp
type Msg =
  // messages for Operation 1 -> might fail
  | StartOperationOne
  | FinishOperationOneSuccessfully of ResultOfOne
  | FinishOperationOneWithError of exn
  // messages for Operation 2 -> always succeeds
  | StartOperationTwo
  | FinishOperationTwo of ResultOfTwo
  // messages for Operation N
  | (* etc. *)
```
The union cases `StartOperationOne`, `FinishOperationOneSuccessfully` and `FinishOperationOneWithError` are associated with one operation while cases `StartOperationTwo` and `FinishOperationTwo` are associated with another. As you can see, modelling asynchronous events this way can get really messy, especially as your program grows larger and larger. In order not to lose track of the big picture, it is better to model these events associated with an asynchronous operation as a single type. Before we do that, let's think about the types of asynchronous operations we care about:
 - (1) Operations that always succeed (for example, a delay)
 - (2) Operations that fail

### Operations that always succeed
Events for operations of type (1) can be encoded in a type. Since an asynchronous operation almost always is coupled with a start and finish events, we could describe such types nicely as a discriminated union where the finish event carries information about the result of that operation:
```fsharp
type AsyncOperationStatus<'t> =
    | Started
    | Finished of 't
```
To use this type in the example of an asynchronous operation that *always* generates a random number, we can model it as follows:
```fsharp
type Msg =
  | GenerateRandomNumber of AsyncOperationStatus<double>
  | UnrelatedEventHere
  | (* etc. *)
```
Here, we model `GenerateRandomNumber` as an asynchronous event of which the result will be of type `double` when the operation finishes. Then in your `update` function, you can handle the events like this:
```fsharp
let rnd = System.Random()

let update msg state =
    match msg with
    | GenerateRandomNumber Started ->
        let generateRandom = async {
            do! Async.Sleep 1000
            let randomNumber = rnd.NextDouble()
            return GenerateRandomNumber (Finished randomNumber)
        }

        state, Cmd.fromAsync generateRandom

    | GenerateRandomNumber (Finished randomNumber) ->
        let nextState = { state with Random = randomNumber }
        nextState, Cmd.none

    | (* etc. *)
```
This is much cleaner and more concise way of dealing with asynchronous events. Of course you could also handle them inside a single `GenerateRandomNumber` block:
```fsharp
let rnd = System.Random()

let update msg state =
    match msg with
    | GenerateRandomNumber generateNumberEvent ->
        match generateNumberEvent with
        | Started ->
            let generateRandom = async {
                do! Async.Sleep 1000
                let randomNumber = rnd.NextDouble()
                return GenerateRandomNumber (Finished randomNumber)
            }

            state, Cmd.fromAsync generateRandom

        | Finished randomNumber ->
            let nextState = { state with Random = randomNumber }
            nextState, Cmd.none

    | (* etc. *)
```
It's up to you and your team which style you end up choosing, as long as you stay consistent throughout the code base. Let us now turn to modelling the other type of async operations.

### Operations that might fail

The type `AsyncOperationStatus<'t>` we defined earlier accounts only for a successful asynchronous operation whose result is some value of type `'t` but doesn't account for the case where the result of the operation is a failure, regardless of whether the failure is expected or unexpected (an exception).

We need to extend the type to account for failure and the first and simplest way of doing so is to substitute the type `'t` with `Result<'value, 'err>` which is the F# idiomatic way of modelling a result that can succeed or fail.

The `'value` in `Result<'value, 'err>` is the type of the value that is returned when the asynchronous operation is successful, while `'err` is the type of the error if or when the operation fails. Usually `'err` would be modelled as an exception but sometimes a simple `string` could work just fine instead if the error was intended.

Here is an example of an operation that generates a random number larger than 0.5 and otherwise fails:
```fsharp
type Msg =
    | GenerateRandomNumber of AsyncOperationStatus<Result<double, string>>
```
When you see a union case modelled this way, you read it in your head as follow: "`GenerateRandomNumber` describes the possible (start and finish) of an asynchronous operation that *might* succeed and return a `double` or fail with an error message". Handling this union case in the `update` function works the same as we did earlier:
```fsharp
let update msg state =
    match msg with
    | GenerateRandomNumber Started ->
        (* issue command to initiate the operation
           change the loading state into true *)

    | GenerateRandomNumber (Finished (Ok randomNumber)) ->
        (* operation finished successfully
           do something with randomNumber *)

    | GenerateRandomNumber (Finished (Error error)) ->
        (* operation failed, derive useful information from error to the user know
           that something bad or unexpected has happened *)
```
This way we end up with a really nice and concise way of handling the different possible events of an asynchronous operation. However, we are not done yet because now that we have modelled the events of an operation, we need to keep track of the *state* of the operation while the application is running.

The question is, what do we want to *know* about any given asynchronous operation at any point in time and how do we model that in the `State` of the application as a whole. During the life-time of an asynchronous operation, we can ask a couple of question:
 - Has the operation already started? The answer can either be "Not started yet" or "It is still ongoing"
 - Has the operation finished? The answer can either be "Finished successfully" or "Finished with an error"

We can deduce from these questions that for any given asynchronous operation, it can be in one of four state:
 - Has not been started yet
 - Ongoing
 - Finished successfully
 - Finished with an error

These cases map nicely into a discriminated union that I will generically call `Deferred<'t>`. This type describes the state of any asynchronous operation that generates `'t` when it finishes:
```fsharp
type Deferred<'t> =
    | HasNotStartedYet
    | InProgress
    | Resolved of 't
```
The word deferred means "delayed", I like to think of it as "data that will become available later". The state `HasNotStartedYet` works nicely for the initial state where the operation hasn't started yet. When the operation starts, the state of the operation becomes `InProgress`, you might as well call it "ongoing", both words mean the same. At the end, when the operation has finished running, i.e. "resolved", then we have some data of type `'t` to work with.

Just as with the type `AsyncOperationStatus<'t>`, the type `Deferred<'t>` can account for failing operations by substituting `'t` with `Result<'t, 'error>` where `'error` is the type of the error. Both types are two sides of the same coin and they play together really well. The latter is used to keep track of the progress of the operation and the former is used to describe progress changes (events!) about the operation.

To see both in action, let's rewrite the random number generator program but with these types instead

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/failing-random-v2.gif" />
  </div>
</div>

Like always, we start with `State` and `Msg`:
```fsharp
type State = {
  RandomNumber : Deferred<Result<double, string>>
}

type Msg =
  | GenerateRandomNumber of AsyncOperationStatus<Result<double, string>>
```
The only field in the state is `RandomNumber`, no need for extra `Loading` flags because the `InProgress` case covers for that.

The `init()` is straightforward to implement because `RandomNumber` will simply be `HasNotStartedYet` as the operation starts once the user clicks a button:
```fsharp
let init() = { RandomNumber = HasNotStartedYet }, Cmd.none
```
The `update` function a bit more interesting:
```fsharp {highlight: [7, 18]}
let rnd = System.Random()

let update msg state =
    match msg with
    | GenerateRandomNumber Started when state.RandomNumber = InProgress -> state, Cmd.none

    | GenerateRandomNumber Started ->
        let randomOp : Async<Msg> = async {
          do! Async.Sleep 1000
          let random = rnd.NextDouble()
          if random > 0.5 then
            return GenerateRandomNumber (Finished (Ok random))
          else
            let errorMsg = sprintf "Failed! Random number %f was < 0.5" random
            return GenerateRandomNumber (Finished (Error errorMsg))
        }

        { state with RandomNumber = InProgress }, Cmd.fromAsync randomOp

    | GenerateRandomNumber (Finished (Ok randomNumber)) ->
        let nextState = { state with RandomNumber = Resolved (Ok randomNumber) }
        nextState, Cmd.none

    | GenerateRandomNumber (Finished (Error error)) ->
        let nextState = { state with RandomNumber = Resolved (Error error) }
        nextState, Cmd.none
```
The first case that handles `GenerateRandomNumber Started` disallows from issuing a new command if one is already in progress, otherwise async operation will be started by issuing a command. Once the command is issued, the state of the operation `RandomNumber` turns into the `InProgress` mode. Finally when the operation finished with a result, we simply put that result in the `Resolved` state of the operation. In fact, the last two cases can be simplified into the following:
```fsharp {highlight: [20, 21, 22]}
let rnd = System.Random()

let update msg state =
    match msg with
    | GenerateRandomNumber Started when state.RandomNumber = InProgress -> state, Cmd.none

    | GenerateRandomNumber Started ->
        let randomOp : Async<Msg> = async {
          do! Async.Sleep 1000
          let random = rnd.NextDouble()
          if random > 0.5 then
            return GenerateRandomNumber (Finished (Ok random))
          else
            let errorMsg = sprintf "Failed! Random number %f was < 0.5" random
            return GenerateRandomNumber (Finished (Error errorMsg))
        }

        { state with RandomNumber = InProgress }, Cmd.fromAsync randomOp

    | GenerateRandomNumber (Finished result) ->
        let nextState = { state with RandomNumber = Resolved result }
        nextState, Cmd.none
```
The icing on the cake will be the `render` function, because now it can handle the different states of the async operation is a succinct and concise manner:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
    let content =
        match state.RandomNumber with
        | HasNotStartedYet ->
            Html.h1 "Hasn't started yet!"

        | InProgress ->
            Html.h1 "LOADING..."

        | Resolved (Ok number) ->
            Html.h1 [
                prop.style [ style.color.green ]
                prop.text (sprintf "Successfully generated random number: %f" number)
            ]

        | Resolved (Error errorMsg) ->
            Html.h1 [
                prop.style [ style.color.crimson ]
                prop.text errorMsg
            ]

    Html.div [
        prop.children [
            content
            Html.button [
                prop.disabled (state.RandomNumber = InProgress)
                prop.onClick (fun _ -> dispatch (GenerateRandomNumber Started))
                prop.text  "Generate Random"
            ]
        ]
    ]
```

### Conclusion

Getting the types right makes writing Elmish application pleasant as you account for the different states of the application using proper discriminated unions such as `Deferred<'t>` and `AsyncEventOperation<'t>` that work together really well:
```fsharp
type Deferred<'t> =
  | HasNotStartedYet
  | InProgress
  | Resolved of 't

type AsyncOperationStatus<'t> =
  | Started
  | Finished of 't
```
When you use these in your application, feel free to change the terminology to yours and your team's liking as the names of the types and the separate union cases is not as important as the concepts they represent. We will be using these types in the next sections when we start working with HTTP.
