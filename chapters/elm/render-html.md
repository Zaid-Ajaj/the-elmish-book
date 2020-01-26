# Rendering Html

In the previous section, the `render` function was introduced as follows:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
  Html.div [
    Html.button [
      prop.onClick (fun _ -> dispatch Increment)
      prop.text "Increment"
    ]

    Html.button [
      prop.onClick (fun _ -> dispatch Decrement)
      prop.text "Decrement"
    ]

    Html.h1 state.Count
  ]
```
We mentioned that it *computes* the HTML that will be rendered using the provided DSL. In this section, let's get familiar with the DSL by seeing how plain old HTML maps to the DSL and vice-versa. Although the DSL has different functions to create HTML, the type signature of these functions is usually the same:
```fsharp
type htmlTag : IReactProperty list -> ReactElement
```
where `htmlTag` can be any of the functions such as `div`, `h1`, `span` etc. The function takes a list of Html properties that basically represent the Html attributes. Alongside the attributes we have event handlers such as `onClick` and `onMouseEnter`, `onMouseLeave` etc. One special type of these properties is the `children` which takes a list of child "React" elements, and the output also is a "React" element which means it can be nested as a child of other elements.

More on `ReactElement` in [React in Elmish](react-in-elmish) but essentially this type is an in-memory tree structure, it is not the *actual* rendered HTML, just a virtual representation of how the HTML will look like *when* it is rendered.

### Simple elements

For simple elements, containing just textual content, the Html tags can consume strings directly. The following snippet:

```html
<div>Hello, world</div>
```
Translates to:
```fsharp
Html.div "Hello, world"
```

### Nested elements without properties
```html
<div>
  <h1><strong>What's up?</strong></h1>
</div>
```
Translates to
```fsharp
Html.div [
  Html.h1 [
    Html.strong "What's up?"
  ]
]
```
In this example, we are using a different overload for the functions in the `Html` module where the functions `div`, `h1`, `h2`, etc. accept a `ReactElement list` and return `ReactElement` instead of just accepting `IReactProperty list`. This allows for a natural translation between plain old Html and the equivalent F# code using the `Html` module.

Of course, you can mix and match between the overloads of the functions in the `Html` module. For example, if a parent element doesn't have properties but the children do, then you can map it as follows:
```html
<div>
  <nav class="navbar">
    <ul>
      <li>Home</li>
      <li>Contact</li>
    </ul>
  </nav>
</div>
```
Translates to
```fsharp
Html.div [
  Html.nav [
    prop.className "navbar"
    prop.children [
      Html.ul [
        Html.li "Home"
        Html.li "Contact"
      ]
    ]
  ]
]
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
The `text` property is a short-hand for `children [ Html.text "Hello, world" ]` making it clean and simple like it should be.

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
Notice here, the `style` property takes a list of style attributes. These attributes are easy to find using the `style` type where you could just "dot through" the type and your IDE will tell you all the things you can use. The [Feliz](https://github.com/Zaid-Ajaj/Feliz) library includes overloads for most of the CSS properties and they are fully type-safe and well documented.

### Self-closing Tags

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
  Html.input [
    prop.id "txtPass"
    prop.className "input"
    prop.type'.password
  ]

  Html.hr [ ]

  Html.img [
    prop.src "/imgs/cute-cat.png"
    prop.alt "An image of a cute cat"
  ]
]
```

### Arbitrary render logic

It important to understand that although we are just calling these DSL functions such as `Html.div`, `Html.span`, etc. to build the HTML, we are still executing F# code. This code can be anything you want to do in a normal function. For example you can use list comprehensions to build a list of elements that contains powers of 2:
```fsharp
/// Computes x to the power n
let power x n =
    List.replicate n x
    |> List.fold (*) 1

Html.ul [
    for n in 1 .. 5 -> Html.li (power 2 n)
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
            renderUserImage loggedInUser
            renderLogoutButton loggedInUser
        ]

  | None ->
      renderSignInButton
```
Here we check if the user is logged in, if that is the case we render his or her profile image and a logout button, otherwise there is no loggin user so we render the sign-in button. In the next section we will take a closer look into the many ways we can implement conditional rendering.

### Feliz vs. Fable.React Comparison

In all of the examples above and the examples to come in the book, we have been using the [Feliz](https://github.com/Zaid-Ajaj/Feliz) library to build our user interface inside the `render` function. However, if you look around in examples and samples from the community you will likely find code that looks like this:
```fsharp
open Fable.React

let render (state: State) (dispatch: Msg -> unit) =
  div [ ] [
    button [ OnClick (fun _ -> dispatch Increment) ] [ str "Increment" ]
    button [ OnClick (fun _ -> dispatch Decrement) ] [ str "Decrement" ]
    h1 [ ] [ ofInt state.Count ]
  ]
```
The snippet above uses the DSL provided in `Fable.React` library where there are some syntactic differences than the snippets written in Feliz.
 - 1) Requires *two lists* for each element, one for the properties and one for the children.
 - 2) Requires convertion functions to React elements `str` and `ofInt` when you need render primitive values such as `string` and `int`
 - 3) Has all these functions for Html elements and properties *globally* available
 - 4) CSS attributes are not entirely type-safe

The first difference is there for historical reasons to make it look like the Elm language equivalent when it comes to rendering user interfaces but this proves to be very messy in larger snippets where there are so many unnecessary brackets that the code becomes unreadable. Developers also can't seem to decide on a convention when it comes to formatting the code having to make micro decisions of whether put the two lists in one line or in separate lines based on whether the elements have more properties than children or vice-versa. I built Feliz to solve this problem by using a single list for each element and results in a consistent formatting across your codebase, the same list is overloaded to not just take a list of properties but also a list of children if the element doesn't have properties to keep simple things simple.

Because of the overloaded functions of Feliz, the conversion functions `str`, `ofInt` etc. are not needed anymore because Html elements can simply take primitive values as inputs such as `Html.div 42`, `Html.h1 "Hello"` or `Html.li 20.0`.

Feliz functions are grouped by modules so that you can easily discover where every function is by using auto-complete features of your favorite editor: Html tags are explored by "dotting through" the `Html` module, element properties in the `prop` module and CSS styling in the `style` module.

Moreover, Feliz uses proper types and function to model and account for CSS styles with the possible values where as `Fable.React` still uses a discriminated union for defining style properties that cannot be overloaded. This results in properties that are incorrect and not type-safe, for example `Margin of obj` and `Border of obj` will accept anything as input where as Feliz has specialized functions to work with different overloads of CSS properties:
```fsharp
Html.div [
  prop.style [
    style.margin(10)
    style.margin(10, 10, 10, 10)
    style.color.blue
    style.alignContent.flexStart
    style.display.none
    style.border(3, borderStyle.dashed, colors.crimson)
    style.borderColor.red
    style.boxShadow(10, 10, 0, 5, colors.black)
    // etc.
  ]
]
```
React elements rendered by Feliz are actually of type `ReactElement` which is the same type that elements from `Fable.React` return. This is because Feliz is built *on top* of `Fable.React` and ensures that the code used from Feliz can play nicely with existing applications and other third-party libraries built with `Fable.React` but of course I would not recommend mixing both syntaxes when building an application and instead go one of the two libraries.

Personally I would always go for Feliz because I think of it as `Fable.React` with type-safe goodness on top, but don't take my word for it, try it out and see for yourself.