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
This will start Webpack's development server and hosts the application at http://localhost:8080. Navigate to the url and you be presented with the same old (boring) counter application. What is interesting, is the implementation of it within the `src/App.fs` file, so lets break it down. 

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

This is a recurring theme in Elmish applications, we always start by asking the question: "What is the data model I want to keep track of? That will be the state of the application." 

The next question you ask yourself follows naturally: "Which events need to occur for the state to change?". Another way of saying this, is asking: "Which events cause my application to *transition* from one state to another?"  

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

Afterwards, it is time to implement how the state changes based on the events that are triggered. This is where the `update` function comes into play. This function takes the event that has been triggered and *current* state and computes the *next* state of the application:
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
The `render` function computes the user interface of the application where the *current* state is the input and a "dispatcher" function. The function returns a virtual Html tree using an Elmish-specific DSL. The syntax takes a bit of time to get used to but it essentially a representation of how the Html will look like when it is rendered. 

The DSL consists of functions that represent Html tags, such as `div` and `button`. The first argument of these functions is a list of attributes such as `OnClick` and the second argument is a list of the children elements. With this DSL in place, you can easily build Html trees in F# code. More on the render in the next section. 

What's more important is the `dispatch` function, the second argument of `render`. It is responsible for triggering the events of the `Msg` type from within the user interface. We call `dispatch` on a specific message after attaching it to certain event handlers of the user interface such as the `OnClick` handlers of buttons. This has the effect that when a button is clicked, a specific message is triggered such as `Increment` or `Decrement`, causing the `update` function to calculate the next state. When the next state is computed, the `render` function is triggered to build the user interface based on this new state and the loop comes full circle.  

### Elmish under the hood

You might be wondering: "Well, how on earth does `dispatch` know to call the `update` function when a message is triggered and then to call `render` again when a new state is available?". This question makes me happy, it means you are paying attention :)

Although we implemented the functions `init`, `update` and `render` separately, on their own they don't do much, in fact they don't do anything meaningful. We have to tie them together into an Elmish "program" using the `Program` module:
```fsharp
Program.mkSimple init update render
|> Program.withReact "elmish-app"
|> Program.withConsoleTrace
|> Program.run
```
When a the triplet of functions is combined into an Elmish `Program`: the application starts and the "dispatch loop" begins. The implementation of the `Program`, which is internal to the Elmish implementation, is responsible for calling the functions in the appropriate manner: 
 - Start with the current state (using initial state at startup)
 - Implement `dispatch` and give it along with current state to the `render` function
 - When `dispatch` is called, call `update` to get a new state and re-render the application based on this new state. 
 - Repeat