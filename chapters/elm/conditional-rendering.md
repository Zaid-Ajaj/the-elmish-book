# Conditional Rendering

Starting with our [Counter](counter.md) sample application, we can play around a little bit and extend it to get a better feeling to how the user interface DSL works: using conditional rendering.

### Conditional Rendering Using `if ... then ... else`

Very often, we want to show or hide elements of the application based on the state. In the counter example I want to show a message that says whether the current count is odd or even but only when the count is non-negative (count >= 0):

<resolved-image source="/images/elm/counter-odd-or-even.gif" />

There are a couple of ways to conditional rendering, the first is the obvious one with `if ... then ... else` blocks:

```fsharp {highlight: ['2-5', 7, 25]}
let render (state: State) (dispatch: Msg -> unit) =
  let headerText =
    if state.Count % 2 = 0
    then "Count is even"
    else "Count is odd"

  let oddOrEvenMessage = Html.h1 headerText

  if state.Count < 0 then
    // don't render oddOrEvenMessage
    Html.div [
        prop.children [
            Html.button [ prop.onClick (fun _ -> dispatch Increment); prop.text "+" ]
            Html.div state.Count
            Html.button [ prop.onClick (fun _ -> dispatch Decrement); prop.text "-" ]
        ]
    ]

  else
    Html.div [
        prop.children [
            Html.button [ prop.onClick (fun _ -> dispatch Increment); prop.text "+" ]
            Html.div state.Count
            Html.button [ prop.onClick (fun _ -> dispatch Decrement); prop.text "-" ]
            oddOrEvenMessage
        ]
    ]
```
Here we are creating the element `oddOrEvenMessage` and then choosing whether or not we want to add it to child elements based on the current count.

### Conditional Rendering Using CSS `display`

Using `if ... then ... else` can sometimes be tedious and repetitive. A simple way to show or hide elements is using the `display` css attribute. If an element has css attribute `display: none` then the element is hidden. To show the element you either need to remove the `display` attribute or set it to `display: block`:

```fsharp {highlight: [5, 6]}
let render (state: State) (dispatch: Msg -> unit) =

  let oddOrEvenMessage =
    Html.h1 [
        prop.style [ (if state.Count < 0 then style.display.none else style.display.block) ]
        prop.text (if state.Count % 2 = 0 then "Count is even" else "Count is odd")
    ]

    Html.div [
        prop.children [
            Html.button [ prop.onClick (fun _ -> dispatch Increment); prop.text "+" ]
            Html.div state.Count
            Html.button [ prop.onClick (fun _ -> dispatch Decrement); prop.text "-" ]
            oddOrEvenMessage
        ]
    ]
```
In this example, we are always rendering the message but when the css attribute `display` is `none`, it has the same effect as if we didn't render the element.

The above example used a combination of `if..else..then` expression and `display` styling. Styles can be applied conditionally using the `styleWhen` property (`styleList` is an alias for it too)
```fsharp {highlight: [2, 3, 4]}
Html.h1 [
    prop.styleWhen [
        state.Count < 0, [ style.display.none ]
    ]

    prop.text (if state.Count % 2 = 0 then "Count is even" else "Count is odd")
]
```
This way, you apply a bunch of style attributes based on the predicate (the first item of the tuple). The property `styleWhen` has type `((bool * IStyleAttribute list) list)` and returns `IReactAttribute` like all other attributes.

### Conditional Rendering Using `yield`

Since the child elements of any Html tag is a list, we can use F#'s `yield` keyword for conditional rendering in combination with an `if ... then ... else` block. Here is how it looks like:

```fsharp {highlight: [14]}
let render (state: State) (dispatch: Msg -> unit) =
  let headerText =
    if state.Count % 2 = 0
    then "Count is even"
    else "Count is odd"

  let oddOrEvenMessage = Html.h1 headerText

    Html.div [
        prop.children [
            yield Html.button [ prop.onClick (fun _ -> dispatch Increment); prop.text "+" ]
            yield Html.div state.Count
            yield Html.button [ prop.onClick (fun _ -> dispatch Decrement); prop.text "-" ]
            if state.Count > 0 then yield oddOrEvenMessage
        ]
    ]
```
The only downside of this approach is that all other elements need to be `yield`ed as well. Because this pattern is used a lot in Fable/F# projects, there are discussions of making `yield` implicit in the coming versions of F#, see [F# RFC FS-1069 - Implicit yields](https://github.com/fsharp/fslang-design/blob/master/RFCs/FS-1069-implicit-yields.md).