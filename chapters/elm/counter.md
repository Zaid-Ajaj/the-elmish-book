# Counter with Elmish

In the previous chapter of Getting Started with Fable, we built a small [counter application](/chapters/fable/counter).  Today, we will build the same application but instead following The Elm Architecture using the Elmish library. The approach to building this small app and other similar apps will be fundamentally different as we will see in a moment. Despite the triviality of the application, it will be sufficient to demonstrate the basic concepts of Elmish and get us up and running. To get started, I have set up a small template with everything ready to go. Start by cloning the following repository:
```bash
git clone https://github.com/Zaid-Ajaj/elmish-getting-started.git
cd elmish-getting-started
```
The structure of this repository is very much similar to the one we used in the last chapter except for the libraries that are now included, more on that later, and the implementation of the application. To run and compile the application, we use the same commands as we did before:
```bash
npm install
npm start
```
This will start Webpack's development server and hosts the application locally at http://localhost:8080. Navigate to the url and you be presented with the same old (boring) counter application. What is interesting, is the implementation of it within the `src/App.fs` file, so lets break it down thoroughly in this section.

### The Very Basics

First of all, we start by opening the relevant namespaces:
```fsharp
module App

open Elmish
open Elmish.React
open Fable.Helpers.React
open Fable.Helpers.React.Props
```
Then we define the `State` type, also known is the model of the application:
```fsharp
type State = { Count: int }
```
Within every Elmish application, The type of the state captures the data model we want to keep track of while the application is running. In the case of our simple counter application, we want to keep track of the current count which happens to be an integer. 

This is a recurring theme in Elmish applications, we always start by asking the question: "What is the data model I want to keep track of? This will hold the state of the application." 

The next question we ask ourselves follows: "Which events need to occur for the state to change?". Another way of asking this: "Which events cause my application to *transition* from one state to another?"  

The answer to these questions is a type that encodes the different events which can cause the state transitions. This type is usually called `Msg` and it is naturally defined as a discriminated union: 
```fsharp
type Msg =
  | Increment
  | Decrement
```
The events within the `Msg` type can be triggered while application is running. In the case of the counter app, they are triggered through user interactions: clicking different buttons cause event triggers.

Next up is the `init` function that returns the initial state of the application when it starts up, in our case the initial state is when the count is 0. 
```fsharp
// init : unit -> State
let init() = { Count = 0 }
```
Notice that when we think about the "initial application state", we only think about how the *data* is initialized, *not* how the application looks like from the user interface perspective. 

This distinction is important because in Elmish applications, the data model is always leading. The user interface follows from the data model at *any point in time* whether the application has just been started or while it is running. 

Afterwards, it is time to implement how the state changes based on the events that have been triggered. This is where the `update` function comes into play. This function takes the event that has been triggered and *current* state and computes the *next* state of the application:
```fsharp
let update (msg: Msg) (currentState: State) =
  match msg with
  | Increment -> 
      let nextState = { currentState with Count = currentState.Count + 1 }
      nextState

  | Decrement -> 
      let nextState = { currentState with Count = currentState.Count - 1 }
      nextState
```
the `update` function handles all possible events, checking each event type to determine how to compute the next state. 

Now that we have a way to update the state based on triggered events, we need the last piece of the puzzle: rendering the user interface based on the state and having the ability to trigger events from it: this is the role of the `render` function: 
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
  div []
      [ button [ OnClick (fun _ -> dispatch Increment) ] [ str "+" ]
        div [] [ str (string state.Count) ]
        button [ OnClick (fun _ -> dispatch Decrement) ] [ str "-" ] ]
```
The `render` function computes the user interface of the application where the *current* state is the input and a "dispatcher" function. The function returns a virtual Html tree using an Elmish-specific DSL. The syntax takes a bit of time to get used to but essentially it is a representation of how the Html will look like when it is rendered. 

The DSL consists of functions that represent Html tags, such as `div` and `button`. The first argument of these functions is a list of attributes such as `OnClick` and the second argument is a list of the children elements. With this DSL in place, you can easily build Html trees in F# code. More on the `render` function in the next section. 

What's more important is the `dispatch` function, the second argument of `render`. It is responsible for triggering the events of the `Msg` type from within the user interface. We call `dispatch` on a specific message after attaching it to certain event handlers of the user interface such as the `OnClick` handlers of buttons.

Now that we have all the pieces in place: `init`, `update` and `render`, we can tie them together to create an Elmish "program" with the last piece of code that bootstraps the application:
```fsharp
Program.mkSimple init update render
|> Program.withReact "elmish-app"
|> Program.withConsoleTrace
|> Program.run
```
An Elmish program controls the life-cycle of the application and is responsible for calling the function triplet (`init`, `update` and `render`) in the appropriate manner: 
 - Start with the current state (using initial state at startup)
 - Implement `dispatch` and give it along with current state to the `render` function
 - When `dispatch` is called, call `update` to get a new state and re-`render` the application based on this new state. 
 - Repeat

### Bringing the application to life
We have written the triplet of our Elmish program that make up the counter application but in order to actually see it on screen, we have to tell Elmish which element of the `index.html` will be the *placeholder* of this program. Notice the highlighted line:
```fsharp {highlight:[2]}
Program.mkSimple init update render
|> Program.withReact "elmish-app"
|> Program.withConsoleTrace
|> Program.run
```
This tells Elmish two things:
 - "I want to render the application on the element which has id equal to elmish-app"
 - "I want to use React as the rendering engine"

If we examine `index.html`, we will see the placeholder element that will be replaced by the application when it is bootrapped. 

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
    <script src="bundle.js"></script>
</body>
</html>
```
