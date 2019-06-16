# To-Do List Application: Part 1

In this part we will implement the bare minimum of the To-Do list application, it will look as follows:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/elm/todo-part1.gif" />
  </div>
</div>

You can see and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-part1/).

### Modelling The State

Now that you have an idea of what the application has to do, the very first thing that we have to consider is the data model: the state of the application. The state is data that we want to keep track of while using the application. In our case, we have to keep track of a list of to-do items, each item is a piece of text (i.e. string). But that is not all, we also have a text box where the user can type in the contents of the a new todo item. So we have to maintain what the user is typing as well. The state comes down to the following type:
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
    | AddTodo
```
Here, `SetNewTodo` will be used to update the value of `NewTodo` from the state as the user is typing in the text box, that's why we need extra information `of string` which will carry the text that the user typed. `AddTodo` on the other hand will take the *current* value of `NewTodo` and adds it to `TodoList`. Notice here that `AddTodo` doesn't require extra information because we already have the text of the `NewTodo` in our state.

In the back of your mind, try to imagine how the state evolves from the initial state as these events are triggered:
```bash
-> Initial State = { NewTodo = ""; TodoList = [ "Learn F#" ] }
-> User starts typing in
-> Events are triggered:
-> SetNewTodo "L" -> State becomes { NewTodo = "L"; TodoList = [ "Learn F#" ] }
-> SetNewTodo "Le" -> State becomes { NewTodo = "Le"; TodoList = [ "Learn F#" ] }
-> SetNewTodo "Lea" -> State becomes { NewTodo = "Lea"; TodoList = [ "Learn F#" ] }
-> ...
-> SetNewTodo "Learn Elmish"
-> State becomes { NewTodo = "Learn Elmish"; TodoList = ["Learn F#"] }
-> Now user clicks the `Add` button
-> Event `AddTodo` is triggered
-> State becomes { NewTodo = ""; TodoList = [ "Learn F#"; "Learn Elmish" ] }
```
This gives you an idea of whether your state has enough information to evolve as these events triggered and whether the events themselves carry enough information (event arguments) to be able to update the state. An example of such event arguments is the `string` in `SetNewTodo`.

### Implementing State Updates

Since we stopped to think about how state evolves, we kind of already know what the `init` and `update` functions have to do so we can start implementing them concretely:
```fsharp
let init() : State =
  { TodoList = [ "Learn F#" ]
    NewTodo  = "" }

let update msg state =
    match msg with
    | SetNewTodo todoText -> { state with NewTodo = todoText }
    | AddTodo when state.NewTodo = "" -> state
    | AddTodo ->
        { state with
            NewTodo = ""
            TodoList = List.append state.TodoList [state.NewTodo] }
```
Notice that I am doing a bit of validation in the `update` function:
```fsharp
| AddTodo when state.NewTodo = "" -> state
```
This means that if the `NewTodo` is empty then return the state as is.

### The User Interface

Now that we have everything we need (`State` and `Msg`) we can start building the user interface. We can roughly think about it in three parts
 - The title
 - The text box and the add button
 - The list of the todo items

The title is the easiest:
```fsharp
p [ Class "title" ] [ str "Elmish To-Do list" ]
```
Here the class `title` is a bulma class that changes the font size of the paragraph to a certain value that represents the title of a page which is what we need.

The text box and add button are implemented as follows:
```fsharp {highlight: [ '3-7', '10-12' ]}
div [ Class "field has-addons" ] [
  div [ Class "control is-expanded" ] [
    input [
      Class "input is-medium"
      valueOrDefault state.NewTodo
      OnChange (fun ev -> dispatch (SetNewTodo ev.Value))
    ]
  ]
  div [ Class "control" ] [
    button [ Class "button is-primary is-medium"; OnClick (fun _ -> dispatch AddNewTodo) ] [
      i [ Class "fa fa-plus" ] [ ]
    ]
  ]
]
```
We are using Bulma's [form fields](https://bulma.io/documentation/form/general/#form-addons) to combine the input text box and the button. Notice how the input is using `valueOrDefault` to initialize itself with the value of `state.NewTodo` and whenever the user types in, the `OnChange` event is triggered which in turn triggers (i.e. "dispatches") the `SetNewTodo` event giving it the current value of the input. The add button is trivial, just dispatches the `AddTodo` event when clicked.

Notice the part `i [ Class "fa fa-plus" ] [ ]`. This is how we use icons from the Font Awesome library that we referenced in the beginning. Using the class `fa fa-plus` gives the "plus" icon. See [here](https://fontawesome.com/icons?d=gallery) all the icons you can use.

Lastly, we have to render the To-Do items themselves in a list. We do it using a list comprehension:
```fsharp
ul [ ] [
  for todo in state.TodoList ->
  li [ Class "box" ] [
    p [ Class "subtitle" ] [ str todo ]
  ]
]
```
Here we rendering an "unordered list", the `ul` element, inside of which we render every todo item in `state.TodoList` into a "list item": the `li` element. The content of every list item is simply the todo item itself rendered as text using `str` function.

Now to put the parts together, we get to define the `render` function as follows:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
  div [ Style [ Padding 30 ] ] [
    p [ Class "title" ] [ str "Elmish To-Do list" ]

    div [ Class "field has-addons" ] [
      div [ Class "control is-expanded" ] [
        input [
          Class "input is-medium"
          valueOrDefault state.NewTodo
          OnChange (fun ev -> dispatch (SetNewTodo ev.Value))
        ]
      ]
      div [ Class "control" ] [
        button [ Class "button is-primary is-medium"; OnClick (fun _ -> dispatch AddTodo) ] [
          i [ Class "fa fa-plus" ] [ ]
        ]
      ]
    ]

    ul [ ] [
      for todo in state.TodoList ->
      li [ Class "box" ] [
        p [ Class "subtitle" ] [ str todo ]
      ]
    ]
  ]
```
Here we also use a simple `div` as the container of the entire application and give it a bit of padding of 30 pixels.

Finally, to bootstrap the application and actually bring it to life, we use instruct Elmish to do so using:
```fsharp
Program.mkSimple init update render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```

You can view the [source code here](https://github.com/Zaid-Ajaj/elmish-todo-part1) for reference.