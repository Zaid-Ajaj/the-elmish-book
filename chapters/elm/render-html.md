# Rendering Html

In the previous section, the `render` function was introduced conas follows:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
    Html.div [
        prop.id "counter"
        prop.children [
            Html.button [
                prop.onClick (fun _ -> dispatch Increment)
                prop.innerText "Decrement"
            ]

            Html.button [
                prop.onClick (fun _ -> dispatch Decrement)
                prop.innerText "Decrement"
            ]

            Html.h1 state.Count
        ]
    ]
```
We mentioned that it *computes* the HTML that will be rendered using the provided DSL. In this section, let's get familiar with the DSL by seeing how plain old HTML maps to the DSL and vice-versa. Although the DSL has different functions to create HTML, the type signature of these functions is usually the same:
```fsharp
type htmlTag : IReactProperty list -> ReactElement
```
where `htmlTag` can be any of the functions such as `div`, `h1`, `span` etc. The function takes a list of Html properties that basically represent the Html attributes. Alongside the attributes we have event handlers such as `onClick` and `onMouseEnter`, `onMouseLeave` etc. One special type of these properties is the `children` which takes and a list of child "React" elements, the output also is a "React" element which means it can be nested as a child of other elements.

More on `ReactElement` in [React in Elmish](react-in-elmish) but essentially this type is an  in-memory tree structure that represents how the rendered HTML will look like, it is not the *actual* rendered HTML, just a virtual representation of the HTML will look like *when* it is rendered.

### Simple elements

For simple elements, containing just textual content, the Html tags can consume strings directory. The following snippet:

```html
<div>Hello, world</div>
```
Translates to:
```fsharp
Html.div "Hello, world"
```

### Using attributes
```html
<div id="main" class="shiny">
    Hello, World
</div>
```
Translates to
```fsharp
Html.div [
    prop.id "main"
    prop.className "shiny"
    prop.children [
        Html.text "Hello, world"
    ]
]
```
Here `prop.id` represents the `id` attribute of an Html element and `prop.className` represents the CSS class of said element. It is called `className` instead of `class` because `class` is a reserved word in F#. Then we have `prop.children` which takes a list of nested child elements, in this case, a simple text element. This `children` property can be simplified to use a single element instead of a list of children
```fsharp
Html.div [
    prop.id "main"
    prop.className "shiny"
    prop.children (Html.text "Hello, world")
]
```
This can be further simplified into just the content of the element using `prop.text`:
```fsharp
Html.div [
    prop.id "main"
    prop.className "shiny"
    prop.text "Hello, world"
]
```
The `text` property is a short-hand for `children [ Html.text "Hello, world" ]` making it nicely clean and simple like it should be.

### Nested Elements
```html
<div id="main" class="shiny">
  <span>Hello there</span>
  <div>I am a nested division</div>
</div>
```
maps to
```fsharp
Html.div [
    prop.id "main"
    prop.className "shiny"
    prop.children [
        Html.span "Hello there"
        Html.div "I am a nested division"
    ]
]
```
### Using Inline styling
For example
```html
<div style="margin:30px; padding-left: 10px; font-size: 20px">
  I got style, boi
</div>
```
is translated from
```fsharp
Html.div [
    prop.style [
        style.margin 30
        style.paddingLeft 10
        style.fontSize 20
    ]

    prop.text "I got style, boi"
]
```
Notice here, the `style` property takes a list of styles. These styles are easy to find using the `style` type where you could just "dot through" the type and your IDE will tell you all the things you can use. The [Feliz](https://github.com/Zaid-Ajaj/Feliz) library includes overloads for most of the css properties and they fully type-safe and well documented.

# Self-closing Tags

In Html, there are a couple of elements that can have no nested children: self-closing element tags such as `input`, `br` `hr`, `img` etc. In the React DSL provided by Feliz, there is no difference. Simply do not specify any children for them because they wouldn't have any meaning:
```html
<div>
  <input id="txtPass" class="input" type="password"  />
  <hr />
  <img src="/imgs/cute-cat.png" alt="An image of a cute cat" />
</div>
```
Translates to:
```fsharp
Html.div [
    prop.children [
        Html.input [
            prop.id "txtPass"
            prop.className "input"
            prop.inputType.password
        ]

        Html.hr [ ]

        Html.img [
            prop.src "/imgs/cute-cat.png"
            prop.alt "An image of a cute cat"
        ]
    ]
]
```

### Arbitrary render logic

It important to understand that although we are just calling these DSL functions such as `div`, `span`, etc. to build the HTML, we are still executing actual F# code. This code can be anything you want to do in a normal function. For example you can use list comprehensions to build a list of elements that contain powers of 2:
```fsharp
/// Computes x to the power n
let power x n =
    List.replicate n x
    |> List.fold (*) 1

Html.ul [
    prop.children [
        for i in 1 .. 5 -> Html.li (power 2 i)
    ]
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
        Html.div [
            prop.children [
                renderUserImage loggedInUser
                renderLogoutButton loggedInUser
            ]
        ]

  | None ->
      renderSignInButton
```
Here we check if the user is logged in, if that is the case we render his or her profile image and a logout button, otherwise there is no loggin user so we render the sign-in button. In the next section we will take a closer look into the many ways we can implement conditional rendering.