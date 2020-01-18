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

You might have already figured it out, the definition of the parent `State` and `Msg` types follows a simple pattern the more child programs we add to them. Suppose you want to implement a third page which is another child program called `Ticker`, then the `State` and `Msg` types would look something like the following, assuming you build this `Ticker` program in a separate module of the same name:
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

