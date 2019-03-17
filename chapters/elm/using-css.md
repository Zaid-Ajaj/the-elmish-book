# Using CSS 

In the previous section we were using the `Style` attribute to change the css styling of elements on the page, whether it is the text color or the display attribute. This is called "inline styling" in which you apply the style attributes directly on the elements. This can be helpful when you want to dynamically change certain attributes based on the state but in many cases you also need to use predefined stylesheets to implement these styles and reference them from your elements.

### Style Tags

The easiest way to use predefined styles is to include a `style` tag in your `index.html` page:
```html {highlight: [10, 11, 12]}
<!doctype html>
<html>
<head>
  <title>Fable</title>
  <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="shortcut icon" href="fable.ico" />
</head>
<body>
    <style>
        .hidden { display: none }
    </style>

    <div id="elmish-app"></div>
    <script src="bundle.js"></script>
</body>
</html>
```
Then in your `render` function, you can assign the `.hidden` style to an element using the `ClassName` attribute:
```fsharp
let render state dispatch = 
    div [ ClassName "hidden" ] 
        [ str "You can't see me" ]
``` 
Of course, using `ClassName` you can apply multiple classes to your elements. For example, given the styles:
```html
<style>
    .text-large { font-size: 18px }
    .shiny { background-color: red; }
</style>
```
You can apply them both to an element using both classes:
```fsharp
let render state dispatch = 
    div [ ClassName "shiny text-large" ] 
        [ str "You can't see me" ]
```

### Conditional classes 
Many times, you want to apply a class based the state. To take the example from the previous section, you want to apply the `hidden` class when `state.Count < 0`. There is a little utility function called `classList` that does exactly this. 
```fsharp {highlight: [7, 8]}
let render (state: State) (dispatch: Msg -> unit) =  
  let headerText = 
    if state.Count % 2 = 0
    then "Count is even"
    else "Count is odd"  

  let messageClasses = classList [ "hidden", state.Count < 0 ]
  let oddOrEvenMessage = h1 [ messageClasses ] [ str headerText ]

  div []
      [ button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ] 
        div [Style [Color (textColor state)]] [ str (string state.Count) ] 
        button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ]
        oddOrEvenMessage ]
```
The function `classList` takes input of type `(string * bool) list` where the `string` the class name and `bool` is the condition that determines whether the class is applied to element. To use a constant class with `classList`, simply use `true` as the condition:
```fsharp
let shinyAlways = 
    classList [
        // apply spinner class when state is loading
        "spinner", state.Loading
        // alwasy apply the shiny class
        "shiny", true
    ]
```

