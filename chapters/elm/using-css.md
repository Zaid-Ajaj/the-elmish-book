# Using CSS

In the previous section we were using the `style` attribute to change the css styling of elements on the page, whether it is the text color or the display attribute. This is called "inline styling" in which you apply the style attributes directly on the elements. This can be helpful when you want to dynamically change certain attributes based on the state but in many cases you also need to use predefined stylesheets to implement these styles and reference them from your elements.

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
Then in your `render` function, you can assign the `.hidden` style to an element using the `ClassName` attribute, the following `render` function will create a hidden `div` element:
```fsharp
let render state dispatch =
    Html.div [
        prop.className "hidden"
        prop.text "You can't see me"
    ]
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
    Html.div [
        prop.className "shiny text-large"
        prop.text "Large red text"
    ]
```
Alternatively, you can use the `classes` property to combine a bunch of classes liek the example above:
```fsharp
let render state dispatch =
    Html.div [
        prop.classes ["shiny"; "text-large"]
        prop.text "Large red text"
    ]
```
It makes sense to use `classes` when your classes are bound to values such you don't have to concatenate them using a space manually. It also looks nice because you immediately identify that the element has multiple classes.

### Conditional classes
Many times, you want to apply a class based the state. To take the example from the previous section, you want to apply the `hidden` class when `state.Count < 0`. There is a little utility function called `classList` that does exactly this.
```fsharp {highlight: [8]}
let render (state: State) (dispatch: Msg -> unit) =
    Html.div [
        prop.children [
            Html.button [ prop.onClick (fun _ -> dispatch Increment); prop.text "+" ]
            Html.div state.Count
            Html.button [ prop.onClick (fun _ -> dispatch Decrement); prop.text "-" ]
            Html.h1 [
                prop.classList [ state.Count < 0, "hidden" ]
                prop.text (if state.Count % 2 = 0 then "Count is even" else "Count is odd")
            ]
        ]
    ]
```
The function `classList` takes input of type `(bool * string) list` where the `string` the class name and `bool` is the condition that determines whether the class is applied to element. To use a constant class with `classList`, simply use `true` as the condition:
```fsharp
let shinyAlways =
  prop.classList [
    // apply spinner class when state is loading
    state.Loading, "spinner"
    // always apply the shiny class
    true, "shiny"
  ]
```

### External Style Sheets

This book unfortunately doesn't teach you nifty CSS tricks. When we want to use advanced CSS techniques, we will resort to using existing CSS frameworks and apply them in Elmish applications. Frameworks such as [Bootstrap](https://getbootstrap.com/docs/3.4/), [Bulma](https://bulma.io/), [FontAwesome](https://fontawesome.com/) and many others are immensely helpful when we want to create coherent styling for the entire application. The easiest way to get started with any of these is to include them using stylesheet links. To include Bulma for example, simply add this line to `index.html`:
```html {highlight: [8]}
<!doctype html>
<html>
<head>
  <title>Fable</title>
  <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="shortcut icon" href="fable.ico" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.css" />
</head>
<body>
    <div id="elmish-app"></div>
    <script src="bundle.js"></script>
</body>
</html>
```
Now you can use classes that bulma provides.

Try adding `prop.classList [ "button";  "is-primary" ]` to your counter buttons to see how they look like. Take a look around the rest of the [Bulma documentation](https://bulma.io/documentation/) website because we will be using the it again in this chapter along with [Font Awesome](https://fontawesome.com/) which will provide us a plethora of icons that we can use in our apps.