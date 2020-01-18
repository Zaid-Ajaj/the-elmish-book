# Composition Forms

In the previous example with the counter and input text, we modelled the child programs by modelling their state types as *fields* of the state type of the parent:
```fsharp
type State =
  { Counter : Counter.State
    InputText : InputText.State
    CurrentPage : Page }
```
And their associated message types were simply cases of the `Msg` type of the parent:
```fsharp
type Msg =
  | CounterMsg of Counter.Msg
  | InputTextMsg of InputText.Msg
  | SwitchPage of Page
```

### State-Field Composition

You probably have already figured it out, the definition of the parent `State` and `Msg` types follows a simple pattern the more child programs we add to them. Suppose you want to implement a third page which is another child program called `Ticker`, then the `State` and `Msg` types would look something like the following, assuming you build this `Ticker` program in a separate module of the same name:
```fsharp {highlight: [4, 9, 15]}
type Page =
  | Counter
  | TextInput
  | Ticker

type State =
  { Counter : Counter.State
    InputText : InputText.State
    Ticker : Ticker.State
    CurrentPage : Page }

type Msg =
  | CounterMsg of Counter.Msg
  | InputTextMsg of InputText.Msg
  | TickerMsg of Ticker.Msg
  | SwitchPage of Page
```
And so on and so forth. Adding more child programs is a matter adding another field in the parent `State` type, extending the `Msg` with another case for handling the messages of the child programs and eventually handling the updates and renders from the `init`, `update` and `render` functions. Because we are adding child states as **fields** to make up a bigger parent state type, let us call this form the "state-field" composition form. This way it will be easier to refer to it later on when comparing with other forms.

### Discriminated Union Composition

The most common way to model child programs in web application is to use a discriminated union to model which child program is currently *active* on screen. Each case of the discriminated union holds the state of a child program. This is a natural way to model web pages because a web application typically is showing a single active page at any given moment:
```fsharp
type Page =
    | Counter of Counter.State
    | InputText of InputText.State
```
This way, the parent program doesn't need to keep track of a separate field to know which program is currently active because there can only be *one child program active at a time*:
```fsharp
type State = { CurrentPage : Page }
```
The most important distinction when comparing to State-Field composition is that when the `CurrentPage` changes from one child program into another, the state of that child program is *reset*. In State-Field compositon, the states of all child programs are maintained at the same time. We saw that in the previous example where the count of the counter view was kept the same as we switched back and forth from one view into another.

When we say the state of a child program is "reset", it is not entirely true. It might be better to say that when changing the `CurrentPage` from one child program into another, the state of that child program is *re-initialized*.

Let me explain what I mean, consider the `Msg` type associated with the parent program above:
```fsharp {highlight: [4]}
type Msg =
  | CounterMsg of Counter.Msg
  | InputTextMsg of InputText.Msg
  | SwitchPage of Page
```
What do you think of the last union case `SwitchPage of Page`?

One might say, "Yeah `SwitchPage` should work just fine, it has all the information needed to make the state change the current active page when invoked from a button":
```fsharp
Html.button [
    prop.text "Show Counter"
    prop.onClick (fun _ -> dispatch (SwitchPage (Page.Counter (fst (Counter.init())))))
]
```
Here we dispatch a `SwitchPage` message and give it the initial value of the `Counter` module. This kind of works but not entirely: we are discarding the *initial command* of the `Counter` module which is definitely not the dersired behavior!

Switching pages in Discriminated Union composition can be properly implemented by understanding the *initialization conditions* of each child program. In other words, we ask ourselves: "What information does the `Counter` module need for it to be initialized"? The answer is simple, just look at the paremeters of the `Counter.init` function.

One way to implement the switching properly is by having a specialized message case from the parent program that has *enough information* to initialize a child program. In the case of the `Counter` child program, the `init` function takes `unit` as input so it doesn't need any information to be initialized.

Let us add a message `SwitchToCounter` that initializes the `Counter` program and another message `SwitchToInputText` that does the same for the `InputText` program:
```fsharp
type Msg =
  | CounterMsg of Counter.Msg
  | InputTextMsg of InputText.Msg
  | SwitchToCounter
  | SwitchToInputText
```
Now it is easier to dispatch these messages from the UI (or from commands)
```fsharp
Html.button [
    prop.text "Show Counter"
    prop.onClick (fun _ -> dispatch SwitchToCounter)
]
```
Now from the `update` function, we can initialize the `Counter` module and propagate the initial command as well:
```fsharp {highlight: ['15-19', '21-25']}
let update (msg: Msg) (state: State) =
    match state.CurrentPage, msg with
    | Page.Counter counterState, CounterMsg counterMsg ->
        let counterState, counterCmd = Counter.update counterMsg counterState
        let nextState = { state with CurrentPage = Page.Counter counterState }
        let nextCmd = Cmd.map CounterMsg counterCmd
        nextState, nextCmd

    | Page.InputText inputTextState, InputTextMsg inputTextMsg ->
        let inputTextState, inputTextCmd = InputText.update inputTextState inputTextMsg
        let nextState = { state with CurrentPage = Page.InputText inputTextState }
        let nextCmd = Cmd.map InputTextMsg inputTextCmd
        nextState, nextCmd

    | _, SwitchToCounter ->
        let counterState, counterCmd = Counter.init()
        let nextState = { state with CurrentPage = Page.Counter counterState }
        let nextCmd = Cmd.map CounterMsg counterCmd
        nextState, nextCmd

    | _, SwitchToInputText ->
        let inputTextState, inputTextCmd = InputText.init()
        let nextState = { state with CurrentPage = Page.InputText inputTextState }
        let nextCmd = Cmd.map InputTextMsg inputTextCmd
        nextState, nextCmd

    | _, _ ->
        state, Cmd.none
```

> In Discriminated Union compostion, it is common to match against a tuple of both the current active child program and the incoming message to compute the next state.

As I mentioned, understanding the initialization conditions for the child programs is essential when modelling the messages the allow us to switch to those programs. Suppose that the `Counter` module has an `init` function that takes in the initial `Count` field when initializing the state:
```fsharp
// in Counter.fs

let init (count: int) =
    let initialState = { Count = count }
    initialState, Cmd.none
```
Then the message `SwitchToCounter` must also have information that correspond to what that `init` function needs:
```fsharp {highlight: [4, 21, 22]}
type Msg =
  | CounterMsg of Counter.Msg
  | InputTextMsg of InputText.Msg
  | SwitchToCounter of count:int
  | SwitchToInputText

let update (msg: Msg) (state: State) =
    match state.CurrentPage, msg with
    | Page.Counter counterState, CounterMsg counterMsg ->
        let counterState, counterCmd = Counter.update counterMsg counterState
        let nextState = { state with CurrentPage = Page.Counter counterState }
        let nextCmd = Cmd.map CounterMsg counterCmd
        nextState, nextCmd

    | Page.InputText inputTextState, InputTextMsg inputTextMsg ->
        let inputTextState, inputTextCmd = InputText.update inputTextState inputTextMsg
        let nextState = { state with CurrentPage = Page.InputText inputTextState }
        let nextCmd = Cmd.map InputTextMsg inputTextCmd
        nextState, nextCmd

    | _, SwitchToCounter count ->
        let counterState, counterCmd = Counter.init count
        let nextState = { state with CurrentPage = Page.Counter counterState }
        let nextCmd = Cmd.map CounterMsg counterCmd
        nextState, nextCmd

    | _, SwitchToInputText ->
        let inputTextState, inputTextCmd = InputText.init()
        let nextState = { state with CurrentPage = Page.InputText inputTextState }
        let nextCmd = Cmd.map InputTextMsg inputTextCmd
        nextState, nextCmd

    | _, _ ->
        state, Cmd.none
```
You might say: "Well, we didn't do anything like this, we just moved the *decision* to intialize the child program data up to the parent program instead of initializing it from the child program itself". In this case, you would be right. However, a lot of the times, the child program cannot choose the initial state without extra information provided by the parent. This is also why Disciriminated Union composition is often more suitable in web applications, because unlike State-Field composition, the parent program doesn't need to initialize *all* of the children during the initialization of the state, simply because some child program might require information that is not available at the time of the initialization of the parent program. It might be a bit vague but we will learn exactly why this is the case when we tackle real examples in the following sections.

I used the messages `SwitchToCounter` and `SwitchToInputText` to demonstrate the switching between the child programs. In a real web application, we don't need these messages because the switching between the pages happens based in the *current url* of the web page. "Switching child programs" is another way of saying "routing between the web pages". We will introduce routing in later section in this chapter.