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

### State-field Composition

You might have already figured it out, the definition of the parent `State` and `Msg` types follows a simple pattern the more child programs we add to them. Suppose you want to implement a third page which iss another child program called `Ticker`, then the `State` and `Msg` types would look something like the following, assuming you build this `Ticker` program in a separate module of the same name, regardless of the implementation:
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
And so on and so forth. Adding more child programs is a matter adding another field in the parent `State` type, extending the `Msg` with another case for handling the messages of the child programs and eventually handling the updates and renders from the `init`, `update` and `render` functions.

Let us call this form the "State-field" composition so that we can refer to it later on. The name comes from the fact that we add the state of the child programs as **fields** of the state of the parent program.

There are different ways to modelling child programs. Let us take a look at them and discuss the implications of the design.

### Discriminated Union Composition

