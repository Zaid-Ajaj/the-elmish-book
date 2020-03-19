# React in Elmish

In the previous sections, we talked quite a bit about the `render` function. This function takes the current state of the application and creates the user interface from it. *Every* time the state changes, the `render` function is invoked and the user interface is updated accordingly.

At this point, this `render` function has probably piqued your interest but you have put it at back of your mind as some "black box" doing the magic. In this section, we will try to remedy the situation and understand how Elmish updates the user interface and how it does so in a performant manner.

Let's start off with the *type signature* of the function:
```fsharp
let render (state: State) (dispatch: Msg -> unit) : ReactElement = (* . . . *)
```
Notice here the output type of the function: it returns a `ReactElement`. This type is very important because it is determined by which *rendering engine* we chose to use in our Elmish applications. In our case, the rendering engine is [React.js](https://reactjs.org/).

In the previous examples we opened the namespace
```fsharp
open Feliz
```
And we were able to use the included DSL in the `Feliz` library to create `ReactElement`s from the functions `Html.div`, `Html.span`, `Html.button` etc. `ReactElement` is in fact the output type of these functions:
```fsharp
let title : ReactElement = Html.h1 "Happy coding!"
```
<div style="padding:20px; border: 1px solid lightgrey;border-radius:5px;">

[React.js](https://reactjs.org) is a native javascript library and Fable.React is the binding for it that allows us to use React from Fable and Elmish applications. Feliz is a library built on top of Fable.React and provides an alternaltive DSL to the one included by default in Fable.React.

</div>

Now understanding the `render` function comes down to understanding a bit of React and these ReactElements.

### What is React?

React is a Javascript library and framework for building web application. From Javascript's perspective, this library can be standalone to build application, Elmish builds upon the capabilities of React and helps move the data and state around. When it comes to rendering the elements on screen, that is when React comes into play.

React starts doing it's magic when the `render` function is evaluated for the first time and a `ReactElement` is returned. Suppose the evaluated element looked something as follows regardless of the state:
```fsharp
Html.div [
    prop.id "content"
    prop.className "full-width"
    prop.children [
        Html.h1 [
            prop.id "header"
            prop.text "Hello from Fable"
        ]
    ]
]
```
This `ReactElement` will be given to React and it will create the equivalent user interface of:
```html
<div id="content" class="full-width">
    <h1 id="header">Hello from Fable</h1>
</div>
```
Which is the *real* user interface you ultimately see on screen. This is of course only on the *initial* render at the start up of the application.

Now suppose that the state has changed and a *re-render* is triggered where the `render` function now evaluates to the following output:
```fsharp {highlight: [3]}
Html.div [
    prop.id "content"
    prop.className "hidden"
    prop.children [
        Html.h1 [
            prop.id "header"
            prop.text "Hello from Fable"
        ]
    ]
]
```
Notice here that only the `class` of the main `div` element has changed from "full-width" to "hidden".

Now this `ReactElement` is again given to React. Because this is a re-render cycle, React only applies the changes needed to the elements. Using advanced heuristics, React is able to *compare* the newly generated `ReactElement` with the previous one and calculates which modifications need to occur. In the example above, React will figure out that it only needs to apply the changes made to the class attribute and executes the modifications at the `document` API level. The real changes applied to the elements we see on screen could look something like this:
```fsharp
let content = document.getElementById "content"
content.classList.remove("full-width")
content.classList.add("hidden")
```
The process of comparing React element to determine the required modifications is called [Reconciliation](https://reactjs.org/docs/reconciliation.html) and it is one of the most important concepts in React. Although reconciliation is internal to React's implementation, getting an idea of how it works will help you optimize your user interface code and avoid certain UI bottlenecks.

Think about reconciliation as if it had the type:
```fsharp
let reconcile (prev: ReactElement) (next: ReactElement) : Modification list = (*...*)
```
Here, a `Modification` is an instruction for React to apply on the *real* elements on screen.

> Of course, this is pseudo-code, using types just makes it easier to think about the concept.

I say the "real" elements on the screen because these `ReactElement`s are not actual elements. They are only a *representation* of how the user interface should look like. Basically a tree structure that lives in-memory which React uses to determine what changes need to be applied to the *real* elements: the real DOM. This is why these `ReactElement`s are also commonly referred to as the "Virtual DOM". They are called virtual because they only live in-memory.