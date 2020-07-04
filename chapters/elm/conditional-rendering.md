# Conditional Rendering

Starting with our [Counter](counter.md) sample application, we can play around a little bit and extend it to get a better feeling for how the user interface DSL works: using conditional rendering.

### Conditional Rendering Using `if ... then ... else`

Very often, we want to show or hide elements of the application based on the state. In the counter example I want to show a message that says whether the current count is odd or even but only when the count is non-negative (count >= 0).

<resolved-image source="/images/elm/counter-odd-or-even.gif" />

There are a couple of ways to accomplish conditional rendering. The first is the obvious one with `if ... then ... else` blocks:

```fsharp {highlight: ['2-5', 7, 22]}
let render (state: State) (dispatch: Msg -> unit) =
  let headerText =
    if state.Count % 2 = 0
    then "Count is even"
    else "Count is odd"

  let oddOrEvenMessage = Html.h1 headerText

  if state.Count < 0 then
    // don't render oddOrEvenMessage
    Html.div [
        Html.button [ prop.onClick (fun _ -> dispatch Increment); prop.text "+" ]
        Html.div state.Count
        Html.button [ prop.onClick (fun _ -> dispatch Decrement); prop.text "-" ]
    ]

  else
    Html.div [
        Html.button [ prop.onClick (fun _ -> dispatch Increment); prop.text "+" ]
        Html.div state.Count
        Html.button [ prop.onClick (fun _ -> dispatch Decrement); prop.text "-" ]
        oddOrEvenMessage
    ]
```
Here we are creating the element `oddOrEvenMessage` and then choosing whether or not we want to add it to child elements based on the current count.

### Conditional Rendering Using CSS `display`

Using `if ... then ... else` can sometimes be tedious and repetitive. A simple way to show or hide elements is using the `display` CSS attribute. If an element has the CSS attribute `display: none` then the element is hidden. To show the element you either need to remove the `display` attribute or set it to `display: block`:

```fsharp {highlight: [5, 6]}
let render (state: State) (dispatch: Msg -> unit) =

  let oddOrEvenMessage =
    Html.h1 [
        prop.style [ (if state.Count < 0 then style.display.none else style.display.block) ]
        prop.text (if state.Count % 2 = 0 then "Count is even" else "Count is odd")
    ]

    Html.div [
        Html.button [ prop.onClick (fun _ -> dispatch Increment); prop.text "+" ]
        Html.div state.Count
        Html.button [ prop.onClick (fun _ -> dispatch Decrement); prop.text "-" ]
        oddOrEvenMessage
    ]
```
In this example, we are always rendering the message but when the CSS attribute `display` is `none`, it has the same effect as if we didn't render the element.

The above example used a combination of `if..else..then` expression and `display` styling. Styles can be applied conditionally using the `style` property:
```fsharp {highlight: [2, 3, 4]}
Html.h1 [
    prop.style [
        state.Count < 0, [ style.display.none ]
    ]

    prop.text (if state.Count % 2 = 0 then "Count is even" else "Count is odd")
]
```
This way, you apply a bunch of style attributes based on the predicate (the first item of the tuple). The property `style` is an overload that takes type `((bool * IStyleAttribute list) list)` as input and returns `IReactAttribute` like all other attributes.

### Conditional rendering using `Html.none`

The value `Html.none` is special within the `Html` module. When this value is used, it tells the rendering engine (React in our case) to not render anything. For example:
```fsharp {highlight: [11]}
let render (state: State) (dispatch: Msg -> unit) =

    let headerText =
      if state.Count % 2 = 0
      then "Count is even"
      else "Count is odd"

    let oddOrEvenMessage =
      if state.Count > 0
      then Html.h1 headerText
      else Html.none

    Html.div [
        Html.button [ prop.onClick (fun _ -> dispatch Increment); prop.text "+" ]
        Html.div state.Count
        Html.button [ prop.onClick (fun _ -> dispatch Decrement); prop.text "-" ]
        oddOrEvenMessage
    ]
```

### Conditional Rendering Using `yield`

Since the child elements of any HTML tag is a list, we can use F#'s `yield` keyword for conditional rendering in combination with an `if ... then ... else` block. Here is an example:

```fsharp {highlight: [13]}
let render (state: State) (dispatch: Msg -> unit) =
  let headerText =
    if state.Count % 2 = 0
    then "Count is even"
    else "Count is odd"

  let oddOrEvenMessage = Html.h1 headerText

  Html.div [
    yield Html.button [ prop.onClick (fun _ -> dispatch Increment); prop.text "+" ]
    yield Html.div state.Count
    yield Html.button [ prop.onClick (fun _ -> dispatch Decrement); prop.text "-" ]
    if state.Count > 0 then yield oddOrEvenMessage
  ]
```
