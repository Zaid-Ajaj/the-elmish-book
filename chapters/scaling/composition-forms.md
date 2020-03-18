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
This is of course not the only way model child programs, let us take a look at some models and discuss their implications.

### State-Field Composition

You probably have already figured it out, the definition of the parent `State` and `Msg` types from the previous example follows a simple pattern the more child programs we add to them. Suppose you want to implement a third page which is another child program called `Ticker`, then the `State` and `Msg` types would look something like the following, assuming you build this `Ticker` program in a separate module of the same name:
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

The most common way to model child programs in web applications is to use a discriminated union to model which child program is currently *active* on screen. Each case of the discriminated union holds the state of a child program. This is a natural way to model web pages because a web application typically is showing a single active page at any given moment. For example, the example we saw in the previous section could have modelled as a discriminated union type:
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

When we say the state of a child program is "reset", it is not entirely accurate. It is better to say that when changing the `CurrentPage` from one child program into another, the state of that child program is *re-initialized*. To elaborate on this concept, consider the `Msg` type that is associated with the `State` type that follows Discriminated Union composition:

```fsharp {highlight: [4]}
type Msg =
  | CounterMsg of Counter.Msg
  | InputTextMsg of InputText.Msg
  // | SwitchPage of Page
```
We no longer have the union case `SwitchPage of Page`, take a second to think about why.

Switching pages in Discriminated Union composition can be properly implemented by understanding the *initialization parameters* of each child program. In other words, we ask ourselves: "What information does the `Counter` module need for it to be initialized"? The answer is simple, just look at the paremeters of the `Counter.init` function.

One way to implement the switching is by having specialized messages case from the parent program that have *enough information* to call the `init` function of a child program. In the case of the `Counter` child program, the `init` function takes `unit` as input so it doesn't need any information to be initialized.

Let us add a message `SwitchToCounter` that initializes the `Counter` child program and another message `SwitchToInputText` that does the same for the `InputText` program:
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

You can find the source code of the previous example, implemented using Discriminated Union compostion in the repository [Zaid-Ajaj/multiple-programs-du-composition](https://github.com/Zaid-Ajaj/multiple-programs-du-composition)

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
        let updatedInputText, inputTextCmd = InputText.update inputTextMsg inputTextState
        let nextState = { state with CurrentPage = Page.InputText updatedInputText }
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
You might say: "Well, we didn't add anything really, we just moved the *decision* to intialize the child program data up to the parent program instead of initializing it from the child program itself". In this example, you would be right. However, a lot of the times, the child program cannot choose the initial state without extra information provided by the parent. This is also why Disciriminated Union composition is often more suitable in web applications, because unlike State-Field composition, the parent program doesn't need to initialize *all* of the children during the initialization of the state, simply because some child program might require information that is not available at the time of the initialization of the parent program. So the parent program *gather* enough information for the initialization of another child program before actually initializing it. Think about a user dashboard that loads all kinds of data for a certain user. That would be a page (child program) that requires a *user* as input during initialization. The user information is only available after a user has succesfully logged in. This means that we make it is impossible to initialize the dashboard unless we have acquired enough information about the user.

I used the messages `SwitchToCounter` and `SwitchToInputText` to demonstrate the switching between the child programs. In a real web application, we don't need these messages because the switching between the pages happens based in the *current url* of the web page. The application would *listen* for changes in the URL in the address bar and react accordingly. Routing will be discussed in a later chapter. For now, this is the gist of modelling child programs following Discriminated Union composition.

### Keyed-Sequence Compostion

Another common model to compose child programs into a bigger program is to have a **list** of them within the state of the parent. An example is the best way to explain this:
```fsharp
type State = { Counters : (Guid * Counter.State) list }
```
Here, the parent program keeps track of a number of child program states and *identifies* each of them using a `Guid`. Identifying each state element of the list is necessary because when the parent receives a `Counter.Msg` event, it has to know to which program from the list this event applies to:
```fsharp
type Msg =
  | CounterMsg of Guid * Counter.Msg
```
Although the example above uses a list to model many child states, you can use any generic sequence type. Personally I think using a `Map` would be a better solution because we can then enforce the uniqueness of the identifiers that *map* to their corresponding state objects:
```fsharp
type State = { Counters : Map<Guid, Counter.State> }
```
When working with Keyed-Sequences, it is important to realize how the much work is involved with rendering the sequence of child programs on screen, especially when **adding**, **removing** or **reordering** the their states. Take the following function that renders the `Counters` from the definition above:
```fsharp
let renderCounters counters dispatch =
  Html.div [
    for (id, counter) in Map.toList counters ->
    Html.div [
      prop.className "counter"
      prop.children [
        Counter.render counter (fun counterMsg -> dispatch (id, CounterMsg counterMsg))
      ]
    ]
  ]
```
Whenever a new `Counter` is added to the list, the *entire* list is re-rendered. React cannot know whether the last element added is the one that should be rendered because React cannot assume the order in which the elements should be rendered on screen. We can help React a bit in figuring out which elements were added, removed or re-ordered so that it doesn't have to re-render the entire list, we will add a *unique key* for each element using the `key` property. With Keyed-Sequences, we just happen to have one per element of the sequence:
```fsharp {highlight: [5]}
let renderCounters counters dispatch =
  Html.div [
    for (id, counter) in Map.toList counters ->
    Html.div [
      prop.key id
      prop.className "counter"
      prop.children [
        Counter.render counter (fun counterMsg -> dispatch (id, CounterMsg counterMsg))
      ]
    ]
  ]
```
This applies not only for Keyed-Sequences with child programs but any sequence of elements that you want to render on screen and have plans of mutating it. For example in a To-Do list application, every time you render a To-Do item, you can use the ID of the item as *key* for the rendered piece of UI.

### The Sky Is The Limit

The forms I have presented in this section are just the beginning of the story and I can imagine much more complex models that allow for composition. For example you could extend a `State-Field` composition program into one that combines the child programs with the `Deferred` type:
```fsharp
type State = {
  Counter : Deferred<Counter.State>
}
```
It all depends on your requirements and the availability of the information required to initialize a child program.