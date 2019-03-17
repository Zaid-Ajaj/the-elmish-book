# Extended Counter: Conditional Rendering

Starting with our [Counter](counter.md) sample application, we can play around a little bit and extend it to get a better feeling to how the user interface DSL works: using static styles, dynamic styles and conditional rendering.

Initially the counter looks like this:

<resolved-image source="/images/elm/initial-counter.gif" />

Lets add some styling to the count and make it a bit bigger, say make the font size 22 pixels:

```fsharp {highlight:[5]}
let render (state: State) (dispatch: Msg -> unit) =  
  div []
      [ 
        button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ] 
        div [ Style [ FontSize 22 ] ] [ str (string state.Count) ] 
        button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ] ]
```

Now it looks like this:

<resolved-image source="/images/elm/initial-counter-1.gif" />

Here we are using the `Style` attribute, which itself also takes a list css style properties. In the above example we are using a static font size of 22. 

### Dynamic Styling

Let's now change the color the count text dynamically *based* on the state (i.e. the count). Text color becomes blue if the count is positive, black if the count is 0 and red if the count is negtive: 

```fsharp {highlight: ['2-5', 10]}
let render (state: State) (dispatch: Msg -> unit) =  
  let textColor = 
    if state.Count > 0 then "blue"
    elif state.Count < 0 then "red"
    else "black" 

  div []
      [ 
        button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ] 
        div [ Style [ FontSize 22; Color textColor ] ] [ str (string state.Count) ] 
        button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ] ]
```

<resolved-image source="/images/elm/counter-colored-text.gif" />

Since the value `textColor` only depends on the state, we can extract it outside `render` and make it a function:

```fsharp {highlight:['1-4', 10]}
let textColor (state: State) = 
    if state.Count > 0 then "blue"
    elif state.Count < 0 then "red"
    else "black" 

let render (state: State) (dispatch: Msg -> unit) =  
  div []
      [ 
        button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ] 
        div [Style [ FontSize 22; Color (textColor state)]] [ str (string state.Count) ] 
        button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ] ]
```

In Elmish applications, it very common to extract pieces of `render` outside of it to little functions. This makes it better to read and maintain especially when you have a lot of nested elements. In the above example, we definitely didn't need to refactor but I just wanted to make the point clear.

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
          div [Style [ FontSize 22; Color (textColor state)]] [ str (string state.Count) ] 
          button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ] ]
  else 
    div []
        [ button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ] 
          div [Style [ FontSize 22; Color (textColor state)]] [ str (string state.Count) ] 
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
        div [Style [ FontSize 22; Color (textColor state)]] [ str (string state.Count) ] 
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
        div [Style [ FontSize 22; Color (textColor state)]] [ str (string state.Count) ] 
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
        yield div [Style [ FontSize 22; Color (textColor state)]] [ str (string state.Count) ] 
        yield button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ]
        if state.Count >= 0 then yield oddOrEvenMessage ]
```
The only downside of this approach is that all other elements need to be `yield`ed as well. Because this pattern is used a lot in Fable/F# projects, there are discussions of making `yield` implicit in the coming versions of F#, see [F# RFC FS-1069 - Implicit yields](https://github.com/fsharp/fslang-design/blob/master/RFCs/FS-1069-implicit-yields.md).  