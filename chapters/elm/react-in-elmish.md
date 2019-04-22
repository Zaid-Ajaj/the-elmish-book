# React in Elmish

In the previous sections, we talked quite a bit about the `render` function. This function takes the current state of the application and creates the user interface from it. *Every* time the state changes, the `render` function is invoked and the user interface is updated accordingly. 

At this point, this `render` function has probably peaked your interest but you have put it at back of your mind as some "black box" doing the magic. In this section, we will try to remedy the situation and understand how Elmish updates the user interface and how it does so in a performant manner. 

Let's start off with the *type signature* of the function:
```fsharp
let render (state: State) (dispatch: Msg -> unit) : ReactElement = (* . . . *)
``` 
Notice here the output type of the function: it returns a `ReactElement`. This type is very important because it is determined by which *rendering engine* we chose to use in our Elmish applications. In our case, the rendering engine is [React.js](https://reactjs.org/). 

In the previous examples we openend the namespaces
```fsharp
open Fable.React
open Fable.React.Props
```
And we were able to use the Elmish DSL to create `ReactElement`s from the functions `div`, `span`, `button` etc. `ReactElement` is infact the output type of these functions:
```fsharp
let header : ReactElement = h1 [ ] [ str "Happy coding!" ]
```
<div style="padding:20px; border: 1px solid lightgrey;border-radius:5px;">

[React.js](https://reactjs.org) is a native javascript library and Fable.React is the binding for it that allows us to use it from Fable and Elmish applications

</div>

Now understanding the `render` function comes down to understanding a bit of React and these `ReactElement`s. 

### What is React?

In the first chapter, we have seen how to work with UI elements directly using the `document` API that is natively available from the browser when we were building the very first [Counter](/chapters/fable/counter) example. This API is also called the "DOM", short for the document object model. The DOM is how the browser models and renders the elements on the screen from Html tags such as:
```html
<div>
    <h1>Hello to Fable</h1>
</div>
``` 