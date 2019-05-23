# Rendering Html

In the previous section, the `render` function was introduced as follows:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
  div [ ] [
    button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ]
    div [] [ str (string state.Count) ]
    button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ]
  ]
```
We mentioned that it *computes* the HTML that will be rendered using the provided DSL. In this section, let's get familiar with the DSL by seeing how plain old HTML maps to the DSL and vice-versa. Although the DSL has different functions to create HTML, the type signature of these functions is usually the same:
```fsharp
let htmlTag (attributes:  IHtmlProp list) (children: ReactElement list) : ReactElement =
    (* ... *)
```
where `htmlTag` can be any of the functions such as `div`, `h1`, `span` etc. The function takes a list of Html properties that basically represent the Html attributes and a list of child "React" elements, the output also is a "React" element which means it can be nested as a child of other elements. More on `ReactElement` in [React in Elmish](react-in-elmish) but essentially this type is an  in-memory tree structure that represents how the rendered HTML will look like, it is not the *actual* rendered HTML, just a virtual representation of the HTML will look like *when* it is rendered.

### Simple elements
```html
<div>Hello, world</div>
```
becomes:
```fsharp
div [ ] [
  str "Hello, world"
]
```
Here, the helper function `str` turns the string into a `ReactElement` so that it becomes a valid child of `div`.

### Using attributes
```html
<div id="main" class="shiny">
    Hello, World
</div>
```
Translates to
```fsharp
div [ Id "main"; Class "shiny" ] [
  str "Hello, world"
]
```
Here `Id` and `Class` are union cases of the type `HTMLAttr` which is a subtype of `IHTMLProp`. They are in PascalCase because of the F# convention that a union case must be PascalCase, although I would have personally like the camelCase better is it looks closer to it's HTML counterpart.

### Nested Elements
```html
<div id="main" class="shiny">
  <span>Hello there,</span>
  <div>I am a nested division</div>
</div>
```
maps to
```fsharp
div [ Id "main"; Class "shiny" ] [
  span [ ] [ str "Hello there," ]
  div [ ] [ str "I am a nested division" ]
]
```
### Using Inline styling
For example
```html
<div style="margin:30px; padding-left: 10px; font-size: 20px">
  Hello, world
</div>
```
is translated from
```fsharp
div [ Style [ Margin "30px"; PaddingLeft "10px"; FontSize 20 ]  ] [
  str "Hello, world"
]
```
Here the `Style` attribute itself takes a list of `CSSProp` values that represent the various CSS properties that an element can have. Unfortunately, these values are *not* type-safe and usually take an `obj` as input instead of a proper typed value such as an integer or a string. This is because of many CSS properties are overloaded: the width property for example can have a value of 30 pixels using "30px" but can also be a percentage such as "50%" taking 50% of the width of the parent element. That's why if you say `Margin 30` it can be ambiguous, do you mean in pixels or percentages? by default the `Width` property to pick pixels if you only supply a number. Yes, I am not very happy with it either but this is the nature of CSS: a lot of overloaded properties.

# Elements without children
In Html there are a couple of elements that have no nested children: self-closing element tags such as `input`, `br` and `hr`. These translate to the Elmish DSL using just a list of attributes and no children:
```html
<div>
  <input type="password" id="txtPass" />
  <br />
  <hr />
</div>
```
Becomes:
```fsharp
div [ ] [
  input [ Type "Password"; Id "txtPass" ]
  br [ ]
  hr [ ]
]
```

### Arbitrary render logic

It important to understand that although we are just calling these DSL functions such as `div`, `span`, etc. to build the HTML, we are still executing actual F# code. This code can be anything you want to do in a normal function. For example you can use list comprehensions to build a list of elements that contain powers of 2:
```fsharp
/// Computes x to the power n
let power x n =
    List.replicate n x
    |> List.fold (*) 1

ul [ ] [
   for i in 1 .. 5 -> li [ ] [ ofInt (power 2 i) ]
]
```
This renders the list:
```html
<ul>
  <li>2</li>
  <li>4</li>
  <li>8</li>
  <li>16</li>
  <li>32</li>
</ul>
```
Although the logic is arbitrary, we will be extensively using conditional logic: determining what element to render based on available data. Here is an example where conditional rendering is applied:
```fsharp
let renderUserIcon user =
  match user with
  | Some loggedInUser ->
      div [ ] [
        renderUserImage loggedInUser
        renderLogoutButton loggedInUser
      ]
  | None ->
      renderSignInButton
```
Here we check if the user is logged in, if that is the case we render his or her profile image and a logout button, otherwise there is no loggin user so we render the sign-in button. In the next section we will take a closer look into the many ways we can implement conditional rendering.