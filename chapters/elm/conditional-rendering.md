# Conditional Rendering

Starting with our [Counter](counter.md) sample application, we can play around a little bit and extend it to get a better feeling to how the user interface DSL works: using conditional rendering.

### Conditional Rendering Using `if ... then ... else`

Very often, we want to show or hide elements of the application based on the state. In the counter example I want to show a message that says whether the current count is odd or even but only when the count is non-negative (count >= 0):

<resolved-image source="/images/elm/counter-odd-or-even.gif" />

There are a couple of ways to conditional rendering, the first is the obvious one with `if ... then ... else` blocks:

```fsharp {highlight: ['2-5', 7, 20]}
let render (state: State) (dispatch: Msg -> unit) =
  let headerText =
    if state.Count % 2 = 0
    then "Count is even"
    else "Count is odd"

  let oddOrEvenMessage = h1 [ ] [ str headerText ]

  if state.Count < 0 then
    // don't render oddOrEvenMessage
    div []
        [ button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ]
          div [ ] [ str (string state.Count) ]
          button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ] ]
  else
    div []
        [ button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ]
          div [ ] [ str (string state.Count) ]
          button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ]
          oddOrEvenMessage ]
```
Here we are creating the element `oddOrEvenMessage` and then choosing whether or not we want to add it to child elements based on the current count.

### Conditional Rendering Using CSS `display`

Using `if ... then ... else` can sometimes be tedious and repetitive. A simple way to show or hide elements is using the `display` css attribute. If an element has css attribute `display: none` then the element is hidden. To show the element you either need to remove the `display` attribute or set it to `display: block`:

```fsharp {highlight: [7,8, 14]}
let render (state: State) (dispatch: Msg -> unit) =
  let headerText =
    if state.Count % 2 = 0
    then "Count is even"
    else "Count is odd"

  let displayAttr = Display (if state.Count < 0 then "none" else "block")
  let oddOrEvenMessage = h1 [ Style [ displayAttr ] ] [ str headerText ]

  div []
      [ button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ]
        div [Style [ Color (textColor state) ] ] [ str (string state.Count) ]
        button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ]
        oddOrEvenMessage ]
```
In this example, we are always rendering the message but when the css attribute `display` is `none`, it has the same effect as if we didn't render the element.

### Conditional Rendering Using `ofOption`

The user interface DSL provides a special function called `ofOption` which takes an optional element as input. If that input element is `None` then nothing is rendered:

```fsharp {highlight: [2, '5-8']}
/// An element that doesn't render anything
let emptyElement = OfOption None

let render (state: State) (dispatch: Msg -> unit) =
  let oddOrEvenMessage =
    if state.Count >= 0
    then h1 [ ] [ str (if state.Count % 2 = 0 then "Count is even" else "Count is odd") ]
    else emptyElement

  div []
      [ button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ]
        div [Style [ Color (textColor state) ]] [ str (string state.Count) ]
        button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ]
        oddOrEvenMessage ]
```

### Conditional Rendering Using `yield`

Since the child elements of any Html tag is a list, we can use F#'s `yield` keyword for conditional rendering in combination with an `if ... then` block. Here is how it looks like:

```fsharp {highlight: [13]}
let render (state: State) (dispatch: Msg -> unit) =
  let headerText =
    if state.Count % 2 = 0
    then "Count is even"
    else "Count is odd"

  let oddOrEvenMessage = h1 [ ] [ str headerText ]

  div []
      [ yield button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ]
        yield div [Style [ Color (textColor state)]] [ str (string state.Count) ]
        yield button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ]
        if state.Count >= 0 then yield oddOrEvenMessage ]
```
The only downside of this approach is that all other elements need to be `yield`ed as well. Because this pattern is used a lot in Fable/F# projects, there are discussions of making `yield` implicit in the coming versions of F#, see [F# RFC FS-1069 - Implicit yields](https://github.com/fsharp/fslang-design/blob/master/RFCs/FS-1069-implicit-yields.md).