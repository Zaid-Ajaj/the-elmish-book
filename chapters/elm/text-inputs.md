# Text Inputs 

Aside from dispatching messages using button clicks, we want to be able to dispatch messages when the user is typing into a text box. To Understand how this works, let's build this sample application:

<resolved-image source="/images/elm/text-input.gif" />

The user interface consists of just elements: a text input box and a label. The text value of the label is whatever the user types into the text input box. This means that the only data that the application keeps track of is a string. We can start modeling the `State` type:

```fsharp
type State = { TextInput : string }
```

Now we model the messages. We need to dispatch a message when the text changes, that message will have the content of the new text:
```fsharp
type Msg = 
    | SetTextInput of string    
```
The `init` and `update` are self-explanatory:
```fsharp
let init() = { TextInput = "" }

let update msg state = 
  match msg with 
  | SetTextInput name -> 
      let nextState = { state with TextInput = name }
      nextState
```
What's more interesting is the `render` function:
```fsharp {highlight: [3]}
let render state dispatch = 
  div [ ]
      [ input [ OnChange (fun ev -> dispatch (SetTextInput ev.Value)) ]
        span [ ] [ str state.TextInput ] ]
```
Notice here the `OnChange` event handler it takes a function of type `Event -> unit` where the input argument (of type `Event`) holds the event arguments: data about the event that has been triggered. In this case the event argument is the current `Value` of the text box element. This way, whenever the text box changes, a `SetTextInput` message is dispatched with the new value of the text input element. 

When the state is updated with the new `Value`, the UI is re-rendered and thus the `span` (highlighted below) will reflect the current value of the text input element:
```fsharp {highlight: [4]}
let render state dispatch = 
  div [ ]
      [ input [ OnChange (fun ev -> dispatch (SetTextInput ev.Value)) ]
        span [ ] [ str state.TextInput ] ]
```

Notice here that even when the UI is re-rendered, the input box element preserves the text that has been entered. We *didn't* tell the `input` element that it should use `state.TextInput` and still with each render cycle, the text is kept as it is. This is because HTML input elements such a text box have *internal* state of their own. To change this internal state of the text box, for example when you want to populate the `input` element at start-up or simply modify what the user types, then you can use the `valueOrDefault` function. Let's modify the text that the user types into upper case:

```fsharp {highlight: [4]}
let render state dispatch = 
  div [ ]
      [ input [ 
          valueOrDefault (state.TextInput.ToUpper())
          OnChange (fun ev -> dispatch (SetTextInput ev.Value)) ]
        span [  ] [ str state.TextInput ] ]
```

<resolved-image source="/images/elm/text-input-upper.gif" />

If you look closely, you will see that when you type the first letter, the reflected text is not turned to upper case:

<resolved-image source="/images/elm/text-input-letter.gif" />

This is because the text box contents were capitalized *after* the re-render cycle. Let's say you typed "h", then this follows:

- The internal state of the text box is changed to "h"
- `OnChange` is triggered where `event.Value = "h"`
- `SetInputText "h"` is dispatched
- New state is computed: `{ TextInput = "h" }`
- UI is re-rendered: text box has content upper-case "H" and the `span` has content "h".

Finally to run this program, the last is piece is the usual program constructor:
```fsharp
Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.withConsoleTrace
|> Program.run
```