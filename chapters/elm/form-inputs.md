# Text Inputs and Check Boxes

### Text Inputs

Aside from dispatching messages using button clicks, we want to be able to dispatch messages when the user is typing into a text box. To Understand how this works, let's build this sample application:

<resolved-image source="/images/elm/text-input.gif" />

The user interface consists of just two elements: a text input box and a label. The text value of the label is whatever the user types into the text input box. This means that the only data that the application keeps track of is a string. We can start modeling the `State` type:

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
Here, we are using an `input` element that only takes a list of attributes. This is because normal Html `input` element cannot have nested elements. Notice here the `OnChange` event handler it takes a function of type `Event -> unit` where the input argument (of type `Event`) holds the event arguments: data about the event that has been triggered. In this case the event argument is the current `Value` of the text box element. This way, whenever the text box changes, a `SetTextInput` message is dispatched with the new value of the text input element. 

When the state is updated with the new `Value`, the UI is re-rendered and thus the `span` (highlighted below) will reflect the current value of the text input element:
```fsharp {highlight: [4]}
let render state dispatch = 
  div [ ]
      [ input [ OnChange (fun ev -> dispatch (SetTextInput ev.Value)) ]
        span [ ] [ str state.TextInput ] ]
```

Notice here that even when the UI is re-rendered, the input box element preserves the text that has been entered. We *didn't* tell the `input` element that it should use `state.TextInput` and still with each render cycle, the text is kept as it is. This is because HTML input elements such a text box have *internal* state of their own. To change this internal state of the text box, for example when you want to populate the `input` element at start-up or simply modify what the user types, then you can use the `valueOrDefault` function. Let's modify the text that the user types into upper case text:

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

This is because the text box contents were capitalized *after* the the state was evaluated. Let's say you typed "h", then this follows:

- The internal state of the text box is changed to "h"
- `OnChange` is triggered where `event.Value = "h"`
- `SetInputText "h"` is dispatched
- New state is computed: `{ TextInput = "h" }`
- UI is re-rendered: text box has content upper-case "H" and the `span` has content "h".

This is simply an error on our side because although we are keeping track of the of the previous and next state it in the `update` function, we went on and computed *more* information in the `render` function: the capitalized text with `state.TextInput.ToUpper()`. Now in our `render` function we have two string representations that are out of sync because one is upper-cased in the text box and the other is kept as is in the `span` element. 

You might say: "Well it is very easy to fix this bug, just use `.ToUpper()` inside the `span` element too".

These would be a correct fix to this little bug but there is a bigger fundamental problem with this approach that will eventually haunt you in bigger applications: deriving more information from the state at *multiple* places, both in the `update` and `render` functions resulting in an out-of-sync user interface. 

The solution almost always comes down to two possibilites:
 - (1) Compute and store the needed information when `updating` the state
 - (2) Derive new information during the `render`

(1) Upper-case the state when updating the state:
```fsharp {highlight: [4]}
let update msg state = 
  match msg with 
  | SetTextInput input -> 
      let nextState = { state with TextInput = input.ToUpper() }
      nextState

let render state dispatch = 
  div [ ]
      [ input [ 
          valueOrDefault state.TextInput
          OnChange (fun ev -> dispatch (SetTextInput ev.Value)) ]
        span [  ] [ str state.TextInput ] ]
```

(2) Compute the new information *only once* inside `render`
```fsharp {highlight: [8, 11, 13]}
let update msg state = 
  match msg with 
  | SetTextInput input -> 
      let nextState = { state with TextInput = input }
      nextState

let render state dispatch =
  let upperCased = state.TextInput.ToUpper()
  div [ ]
      [ input [ 
          valueOrDefault upperCased
          OnChange (fun ev -> dispatch (SetTextInput ev.Value)) ]
        span [  ] [ str upperCased ] ]
``` 

In both cases the general approach is the following: 
 - Minimize the places where you compute information (either compute it once inside `update` or once inside `render`)
 - Avoid redundancy: don't keep track of data you can derive from the state 

### Check Boxes

Another type of input element is a check box. Check box inputs correspond to boolean fields of the state. Assume we want extend the example we have to the following sample application that implements a state toggle that will detemine whether or not the resulting text from text box is upper case:

<resolved-image source="/images/elm/checkbox-input.gif" />

Here, we want to keep track of whether the text should be capitalized or not, therefore we extend the state with a boolean field `Capitalized` with an initial value of `false`:
```fsharp {highlight: [3]}
type State = { 
  TextInput: string
  Capitalized: bool  
}

let init() = { TextInput = ""; Capitalized = false }
```
Next up is thinking of an event that changes the state, in the spirit of the `SetTextInput` event we can write a similar event called `SetCapitalized` that takes in a boolean value coming from the check box:

```fsharp {highlight: [3]}
type Msg = 
  | SetTextInput of string 
  | SetCapitalized of bool
```

Similarly, the `update` function follows the same pattern:
```fsharp {highlight: [7,8,9]}
let update msg state = 
  match msg with 
  | SetTextInput name -> 
      let nextState = { state with TextInput = name }
      nextState

  | SetCapitalized value ->
      let nextState = { state with Capitalized = value }
      nextState
```
Finally we have the `render` function:
```fsharp {highlight: ['9-14']}
let render state dispatch = 
  div [ ]
      [ input [ 
          valueOrDefault state.TextInput
          OnChange (fun ev -> dispatch (SetTextInput ev.Value)) ]
          
        div [ ] [ 
          label [ HtmlFor "checkbox-capitalized" ] [ str "Capitalized" ]
          input [ 
            Id "checkbox-capitalized"
            Type "checkbox"
            valueOrDefault state.Capitalized
            OnChange (fun ev -> dispatch (SetCapitalized ev.Checked))  
          ] 
        ]
       
        span [  ] [ str (if state.Capitalized then state.TextInput.ToUpper() else state.TextInput) ] ]
```
Notice here the following: 
 - A check box is simply an `input` element with attribute `Type "checkbox"`
 - The function `valueOrDefault` accepts a boolean input to set the value at start-up
 - The event argument gives information on whether the check box is `Checked` or not

Also there is the `span` as the last element where it renders it's content based on whether the `Capitalized` field was set to true or not. 

### Bootstrapping the `Program`

As usual, we tie the triplet `init`, `update` and `render` into a program and start the application: 

```fsharp
Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```

In the next section [React in Elmish](react-in-elmish) we will talk about what it means to use `React` as a rendering engine in Elmish application and the consequences of this choice. 