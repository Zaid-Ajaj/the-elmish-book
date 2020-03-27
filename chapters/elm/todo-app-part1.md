# To-Do List Application: Part 1

In this part we will implement the bare minimum of the To-Do list application, it will look as follows:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/elm/todo-part1.gif" />
  </div>
</div>

You can see and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-part1/).

### Modelling The State

Now that you have an idea of what the application has to do, the very first thing that we have to consider is the data model: the state of the application. The state is data that we want to keep track of while using the application. In our case, we have to keep track of a list of to-do items, each item is a piece of text (i.e. string). But that is not all, we also have a text box where the user can type in the contents of a new todo item. So we have to maintain what the user is typing as well. The state comes down to the following type:
```fsharp
type State = {
    TodoList : string list
    NewTodo : string
}
```
Here, `TodoList` represents the list of the todo items and `NewTodo` represents the text that the user is typing in the text box.

### Modelling The Events

Now that we have the data model, we have to think about *which* events occur while the application is running. In this case, the user can only do two things: typing in the text box and clicking the the `Add` button. So we have two events that we model with a `Msg` type:
```fsharp
type Msg =
    | SetNewTodo of string
    | AddNewTodo
```
Here, `SetNewTodo` will be used to update the value of `NewTodo` from the state as the user is typing in the text box, that's why we need extra information `of string` which will carry the text that the user typed. `AddNewTodo` on the other hand will take the *current* value of `NewTodo` and add it to `TodoList`. Notice here that `AddNewTodo` doesn't require extra information because we already have the text of the `NewTodo` in our state.

In the back of your mind, try to imagine how the state evolves from the initial state as these events are triggered:
```bash
-> Initial State = { NewTodo = ""; TodoList = [ "Learn F#" ] }
-> User starts typing
-> Events are triggered:
-> SetNewTodo "L" -> State becomes { NewTodo = "L"; TodoList = [ "Learn F#" ] }
-> SetNewTodo "Le" -> State becomes { NewTodo = "Le"; TodoList = [ "Learn F#" ] }
-> SetNewTodo "Lea" -> State becomes { NewTodo = "Lea"; TodoList = [ "Learn F#" ] }
-> ...
-> SetNewTodo "Learn Elmish"
-> State becomes { NewTodo = "Learn Elmish"; TodoList = ["Learn F#"] }
-> Now user clicks the `Add` button
-> Event `AddNewTodo` is triggered
-> State becomes { NewTodo = ""; TodoList = [ "Learn F#"; "Learn Elmish" ] }
```
This gives you an idea of whether your state has enough information to evolve as these events are triggered and whether the events themselves carry enough information (event arguments) to be able to update the state. An example of such event arguments is the `string` in `SetNewTodo`.

### Implementing State Updates

Since we started to think about how state evolves, we kind of already know what the `init` and `update` functions have to do so we can start implementing them concretely:
```fsharp
let init() : State =
  { TodoList = [ "Learn F#" ]
    NewTodo  = "" }

let update msg state =
    match msg with
    | SetNewTodo todoText -> { state with NewTodo = todoText }
    | AddNewTodo when state.NewTodo = "" -> state
    | AddNewTodo ->
        { state with
            NewTodo = ""
            TodoList = List.append state.TodoList [state.NewTodo] }
```
Notice that I am doing a bit of validation in the `update` function:
```fsharp
| AddNewTodo when state.NewTodo = "" -> state
```
This means that if the `NewTodo` is empty then return the state as is.

### The User Interface

Now that we have everything we need (`State` and `Msg`) we can start building the user interface. We can roughly think about it in three parts
 - The title
 - The text box and the add button
 - The list of the todo items

We will deal with each part separately and starting with the title will be the easiest:
```fsharp
let appTitle =
  Html.p [
    prop.className "title"
    prop.text "Elmish To-Do List"
  ]
```
Here the class `title` is a bulma class that changes the font size of the paragraph to a certain value that represents the title of a page which is what we need. Notice that I have bound the element into a value so that I can use it later in the application.

The text box and add button are implemented as follows:
```fsharp {highlight: [ '8-12', '19-25']}
let inputField (state: State) (dispatch: Msg -> unit) =
  Html.div [
    prop.classes [ "field"; "has-addons" ]
    prop.children [
      Html.div [
        prop.classes [ "control"; "is-expanded"]
        prop.children [
          Html.input [
            prop.classes [ "input"; "is-medium" ]
            prop.valueOrDefault state.NewTodo
            prop.onChange (SetNewTodo >> dispatch)
          ]
        ]
      ]

      Html.div [
        prop.className "control"
        prop.children [
          Html.button [
            prop.classes [ "button"; "is-primary"; "is-medium" ]
            prop.onClick (fun _ -> dispatch AddNewTodo)
            prop.children [
              Html.i [ prop.classes [ "fa"; "fa-plus" ] ]
            ]
          ]
        ]
      ]
    ]
  ]
```
We are using Bulma's [form fields](https://bulma.io/documentation/form/general/#form-addons) to combine the input text box and the button. Notice how the input is using `valueOrDefault` to initialize itself with the value of `state.NewTodo` and whenever the user types in, the `onChange` event is triggered which in turn triggers (i.e. "dispatches") the `SetNewTodo` event giving it the current value of the input. The add button is trivial, just dispatches the `AddNewTodo` event when clicked.

Notice the part `Html.i [ prop.classes [ "fa"; "fa-plus" ] ]`. This is how we use icons from the Font Awesome library that we referenced in the beginning. Using the class `fa fa-plus` gives the "plus" icon. See [here](https://fontawesome.com/icons?d=gallery) all the icons you can use.

An important part of the code snippet above is that is it implemented inside it's own function `inputField` which has *exactly* the same signature as that of the `render` function. It is basically a smaller render function that is responsible for a single part of the user interface, in this case the input fields and the "Add" button:
```fsharp
let inputField (state: State) (dispatch: Msg -> unit) = (* . . . *)
```
This function can be used later inside the main `render` function and this way we are able to break down the user interface into smaller chunks instead of putting *everything* within the `render` function.

As for the last part of the UI, we have to render the To-Do items themselves in a list. We do it using a list comprehension, mapping each `todo` in the `state.TodoList` into a `Html.li` element:
```fsharp {highlight: [4]}
let todoList (state: State) (dispatch: Msg -> unit) =
  Html.ul [
    prop.children [
      for todo in state.TodoList ->
        Html.li [
          prop.classes ["box"; "subtitle"]
          prop.text todo
        ]
    ]
  ]
```
Now we can put the parts together as a whole to define the `render` function as follows:
```fsharp {highlight: [5,6,7]}
let render (state: State) (dispatch: Msg -> unit) =
  Html.div [
    prop.style [ style.padding 20 ]
    prop.children [
      appTitle
      inputField state dispatch
      todoList state dispatch
    ]
  ]
```
Here we also use a simple `div` as the container of the entire application and give it a bit of padding of 20 pixels. The `render` function passes it's `state` and `dispatch` parameters down to the smaller parts `inputField` and `todoList` so that these parts too can use the state to render information on screen or trigger events with the dispatch function. The `appTitle` didn't need the state, nor the ability to trigger events so we just used it as a value.

Finally, to bootstrap the application and actually bring it to life, we instruct Elmish to do so using:
```fsharp
Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```

You can view the [source code here](https://github.com/Zaid-Ajaj/elmish-todo-part1) for reference.