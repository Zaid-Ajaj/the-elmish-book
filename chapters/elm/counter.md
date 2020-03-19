# Counter with Elmish

In the previous chapter of Getting Started with Fable, we built a small [counter application](/chapters/fable/counter).  Today, we will build the same application but instead following The Elm Architecture using the Elmish library. The approach to building this small app and other similar apps will be fundamentally different as we will see in a moment. Despite the triviality of the application, it will be sufficient to demonstrate the basic concepts of Elmish and get us up and running. I have set up a small template with everything ready to go. Start by cloning the following repository:
```bash
git clone https://github.com/Zaid-Ajaj/elmish-getting-started.git
cd elmish-getting-started
```
The structure of this repository is very much similar to the one we used in the last chapter except for the libraries that are now included, more on that later in [Project Structure](project-structure.md), and of course the implementation of the application. To compile or run the application, we use the same commands as we did before:
```bash
npm install
npm start
```
This will start Webpack's development server and host the application locally at http://localhost:8080. Navigate to the url and you will be presented with the same old (boring) counter application. What is interesting, is the implementation of it within the `src/App.fs` file, so lets break it down thoroughly in this section.

### The Very Basics

First of all, we start by opening the relevant namespaces:
```fsharp
module App

open Elmish
open Elmish.React
open Feliz
```
Here, the namespaces `Elmish` and `Elmish.React` give us access to the `Program` module which is used to bootstrap the Elmish application. `Feliz` is a library and DSL for writing the user interface code as we will see in a moment.

Then we define the `State` type, also known as the data model of the application:
```fsharp
type State =
    { Count : int }
```
Within every Elmish application, the very first part to think about it the `State` type. This type captures the data model we want to keep track of while the application is running. In the case of our simple counter application, we want to keep track of the current count which happens to be an integer.

This is a recurring theme in Elmish applications, we always start by asking the question: "What is the data model I want to keep track of that will hold the state of the application?" or more specifically "Which pieces of information do I need to keep track of in order to be able to build the entire user interface?"

The next question we ask ourselves follows: "Which events need to occur for the state to change?". Another way of asking this: "Which events cause my application to *transition* from one state to another?"

The answer to these questions is a type that encodes the different events which can cause the state to change. This type is usually called `Msg` and it is usually modelled as a discriminated union:
```fsharp
type Msg =
    | Increment
    | Decrement
```
The events within the `Msg` type can be triggered while application is running. In the case of the counter app, they are triggered through user interactions: clicking different buttons cause event triggers.

Next up is the `init` function that returns the initial state of the application when it starts up, in our case the initial state is when the count is 0.
```fsharp
// init : unit -> State
let init() =
    { Count = 0 }
```
Notice that when we think about the "initial application state", we only think about how the *data* is initialized, *not* how the application looks like from the user interface perspective.

This distinction is important because in Elmish applications, the data model is always leading. The user interface follows from the data model at *any point in time* whether the application has just been started or while the user is interacting with it.

Afterwards, it is time to implement how the state changes based on the events that have been triggered. This is where the `update` function comes into play. This function takes the event that has been triggered and *current* state and computes the *next* state of the application:
```fsharp
let update (msg: Msg) (state: State): State =
    match msg with
    | Increment ->
        { state with Count = state.Count + 1 }

    | Decrement ->
        { state with Count = state.Count - 1 }
```
The `update` function handles all possible events that can occur based on the incoming `Msg`.

Now that we have a way to update the state based on triggered events, we need the last piece of the puzzle: rendering the user interface based on the state and having the ability to trigger events from it: this is the role of the `render` function:

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
> This function is also commonly known as the `view` function. I will use `render` and `view` interchangeably throughout the book.

The `render` function computes the user interface of the application based on the *current* state of the application (i.e. the first parameter) and the second parameter ("dispatch") is function that *translates* UI events into Elmish messages or events.

The `render` function returns a tree-like structure similar to that of HTML that can be built using just functions. The syntax takes a bit of time to get used to but essentially it is a representation of how the Html will look like when it is rendered. This DSL consists of functions that represent Html tags, such as `div` and `button`. These function take a list of "properties", also known as "props". These properties dictate the various properties that the elements can have such there `id`, `class` and `style` that correspond the Html attributes the associated tags have. Alongside attributes, these props also include the event handlers for the elements such as the `onClick` event handler. Using this DSL in place, you can easily build Html trees in F# code. More on the `render` function in the next section.

What's more important is the `dispatch` function, the second argument of `render`. It is responsible for triggering the events of the `Msg` type from within the user interface. We call `dispatch` on a specific message after attaching it to certain event handlers of the user interface such as the `onClick` handlers of buttons. This effectively translates an raw event occurring at the user interface level into an Elmish event that the `update` function can respond to.

Now that we have all the pieces in place: `init`, `update` and `render`, we can tie them together to create an Elmish "program" that will bootstraps the application:
```fsharp
Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```

The function `Program.mkSimple` makes a "simple" program: a program without the so-called "side-effects". Any operation that breaks out of the basic Elmish model is considered a side-effect. An example of these side-effects is asynchronous operations such as those that rely on network communications via HTTP or simple timer delays. Mutating DOM elements directly in the web page is another example of a side-effect because you are always supposed to change the user interface based on the structure returned from the `render` function rather than using browser DOM APIs. However, sometimes it is required to integrate third-party Javascript libraries into Elmish model. Simply logging information to the browser console is also a side-effect. In this chapter, we focus only on simple programs. Later on in chapter 3 we will introduce side-effects and how to implement them using Elmish commands. At that point we will be using `Program.mkProgram` instead of `Program.mkSimple` which bootstraps a full Elmish program with side-effects.

An Elmish program controls the life-cycle of the application and is responsible for calling the function triplet (`init`, `update` and `render`) in the appropriate manner, think about it roughly as follows:
 - Start with the current state (using initial state at startup)
 - Implement `dispatch` and give it along with current state to the `render` function
 - Create the user interface generated from the `render` function and attach event handlers
 - When `dispatch` is called (from event handlers), call `update` to get the next state and re-`render` the application based on this new state.
 - Repeat

### Bringing the application to life
We have written the triplet of our Elmish program that make up the counter application but in order to actually see it on screen, we have to tell Elmish which element of the `index.html` will be the *placeholder* of this program. Notice the highlighted line:
```fsharp {highlight:[2]}
Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```
This tells Elmish two things:
 - (1) I want to render the application on the element which has id equal to "elmish-app"
 - (2) I want to use React as the rendering engine

For part (1), lets examine `dist/index.html`, we will see the placeholder element that will be replaced by the application when it is bootstrapped.

```html {highlight: [10]}
<!doctype html>
<html>
<head>
  <title>Fable</title>
  <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="shortcut icon" href="fable.ico" />
</head>
<body>
    <div id="elmish-app"></div>
    <script src="main.js"></script>
</body>
</html>
```
As for part (2), it is a bit more complicated. As we have discussed before, Elmish as an implementation of The Elm Architecture addresses two main concerns (1) managing and keeping track of data (= state) and (2) rendering user interface based on that state  (*re-rendering* the user interface whenever the state changes).

The second concern (rendering user interfaces) is commonly referred to as the "view part" of The Elm Architecture. Elmish delegates this concern to a third-party library that knows how to work with user interfaces really well, in this case it is the [React.js](https://reactjs.org/) library, one of the three most popular libraries in the javascript ecosystem to build web application. Section [React in Elmish](react-in-elmish) goes into greater details of this subject matter.

Although React is only one type of these rendering engines, it is the most popular in the Fable community because it fits really well with the functional approach and because we can use a plethora of pre-existing React components in our Elmish applications without re-implementing them ourselves from scratch.

In this section, we explored the implementation and talked about the basic constructs that make up an Elmish application. In the [next section](conditional-rendering) we will tinker with what we have, add a bit of styling and have our view show or hide elements based on the state.