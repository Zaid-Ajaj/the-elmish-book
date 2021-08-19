# To-Do List Application: Part 2

In this section, we will continue to build upon what we did in the previous section. We will upgrade our To-Do list application such that it is able to mark To-Do items as completed. We will also add the  ability to delete them from the list. It will look like the following:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/elm/todo-part2.gif" />
  </div>
</div>

You can see and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-part2/).

### Modelling the State

Previously, when modelling the To-Do items in our state, we chose to use `string list` because that is what they were. However, now these items need more information. Namely, the items can be either *completed* or not. So one might consider using a separate type for the To-Do item as follows:
```fsharp {highlight: ['1-4', 8]}
type Todo = {
  Description: string
  Completed: bool
}

type State = {
  NewTodo: string
  TodoList : Todo list
}
```
Alright, from the point of view of the `State` this looks like enough information. But we are indeed missing a very important piece: the ability to *identify* the individual To-Do items. This becomes clear when we try to encode our events in the `Msg` type:
```fsharp
type Msg =
  | SetNewTodo of string
  | AddNewTodo
  | ToggleCompleted of ???
  | DeleteTodo of ???
```
Here I have added two events: `ToggleCompleted` and `DeleteTodo`. These events are triggered when I want to toggle the completed flag or delete a *specific* To-Do item. But how do I know which one to toggle or to delete? The answer is to extend our state type and add an identity field to each of To-Do items:
```fsharp {highlight: [2]}
type Todo = {
  Id : int
  Description: string
  Completed : bool
}
```
Now the events can carry information about a specific To-Do item by using the identity associated with that item:
```fsharp
type Msg =
  | SetNewTodo of string
  | AddNewTodo
  | ToggleCompleted of int
  | DeleteTodo of int
```
For example, an event `ToggleCompleted 4` means "Toggle the completed flag of the item with identity = 4". The same holds for `DeleteTodo 4` which means "Delete the item that has identity = 4". Let's try to imagine how the state evolves as these events are triggered:
```bash
-> Initial State
  {
    NewTodo = "";
    TodoList = [
      { Id = 1; Description = "Learn F#"; Completed = true }
      { Id = 2; Description = "Learn Elmish"; Completed = false }
    ]
  }

-> Trigger [ToggleCompleted 2]
-> Next State =
 {
    NewTodo = "";
    TodoList = [
      { Id = 1; Description = "Learn F#"; Completed = true }
      { Id = 2; Description = "Learn Elmish"; Completed = true }
    ]
  }

-> Trigger [DeleteTodo 1]
-> Next State =
  {
    NewTodo = "";
    TodoList = [
      { Id = 2; Description = "Learn Elmish"; Completed = true }
    ]
  }

-> Trigger [SetNewTodo "Have fun and profit"]
-> Next State =
  {
    NewTodo = "Have fun and profit";
    TodoList = [
      { Id = 2; Description = "Learn Elmish"; Completed = true }
    ]
  }

-> Trigger [AddNewTodo]
-> Next State =
  {
    NewTodo = "";
    TodoList = [
      { Id = 2; Description = "Learn Elmish"; Completed = true }
      { Id = 3; Description = "Have fun and profit"; Completed = false }
    ]
  }
```
Notice that the example above requires that when adding a new todo, we are incrementing the `Id` by 1 based on the maximum value of `Id` in the list. Also notice that we initialize the `Completed` flag of a new `Todo` item to be false.

### Implementing State Updates

Using the steps above, we have a rough idea of how we should implement the `update` function. Let's try to implement it concretely, and go through the code:
```fsharp
let update msg state =
  match msg with
  | SetNewTodo desc ->
      { state with NewTodo = desc }

  | DeleteTodo todoId ->
      let nextTodoList =
        state.TodoList
        |> List.filter (fun todo -> todo.Id <> todoId)

      { state with TodoList = nextTodoList }

  | ToggleCompleted todoId ->
      let nextTodoList =
        state.TodoList
        |> List.map (fun todo ->
           if todo.Id = todoId
           then { todo with Completed = not todo.Completed }
           else todo)

      { state with TodoList = nextTodoList }

  | AddNewTodo when state.NewTodo = "" ->
      state

  | AddNewTodo ->
      let nextTodoId =
        match state.TodoList with
        | [ ] -> 1
        | elems ->
            elems
            |> List.maxBy (fun todo -> todo.Id)
            |> fun todo -> todo.Id + 1

      let nextTodo =
        { Id = nextTodoId
          Description = state.NewTodo
          Completed = false }

      { state with
          NewTodo = ""
          TodoList = List.append state.TodoList [nextTodo] }
```
Let's go through each event: `DeleteTodo`
```fsharp
| DeleteTodo todoId ->
    let nextTodoList =
      state.TodoList
      |> List.filter (fun todo -> todo.Id <> todoId)

    { state with TodoList = nextTodoList }
```
Here "deleting" a To-Do item is a matter of creating a *new* list where the To-Do item to be deleted is filtered out. This is common in Elmish: as the state is immutable we create new state rather than mutating the current one.

As for `ToggleCompleted`:
```fsharp
| ToggleCompleted todoId ->
    let nextTodoList =
      state.TodoList
      |> List.map (fun todo ->
         if todo.Id = todoId
         then { todo with Completed = not todo.Completed }
         else todo)

    { state with TodoList = nextTodoList }
```
We transform (map) each item in the list of our To-Do items and we check: if `todo` has the id of one we want to toggle, then we return a *new* To-Do item where the `Completed` field is toggled. Otherwise, just return the To-Do item unchanged. That's how we get a new list where one To-Do item is toggled. Next we return a new state with the new list we just created.

Event `AddNewTodo` now has a bit more logic to it than from the previous section:
```fsharp
| AddNewTodo ->
    let nextTodoId =
      match state.TodoList with
      | [ ] -> 1
      | elems ->
          elems
          |> List.maxBy (fun todo -> todo.Id)
          |> fun todo -> todo.Id + 1

    let nextTodo =
      { Id = nextTodoId
        Description = state.NewTodo
        Completed = false }

    { state with
        NewTodo = ""
        TodoList = List.append state.TodoList [nextTodo] }
```
First we calculate the identity that our next To-Do item will have. We do so by checking the current list of `Todo`'s. If the list is empty, then use 1 as the identity for the first item. Otherwise we get the To-Do item that has the largest `Id` value using `List.maxBy` and we extract the `Id` from that item. Afterwards we create a new `Todo` using the `Id` we calculated and adding (appending) it to the `TodoList` we already have in the state.

### Rendering the User Interface

That was it for the `update` function. Now we consider the `render` function. Since the user interface is more or less the same as in the previous section, `render` will look almost the same, except now we have more logic when rendering the individual To-Do items. Previously we had items rendered as simple `Html.li` elements:
```fsharp {highlight: ['4-7']}
let todoList (state: State) (dispatch: Msg -> unit) =
  Html.ul [
    for todo in state.TodoList ->
      Html.li [
        prop.classes ["box"; "subtitle"]
        prop.text todo
      ]
  ]
```
Now since the individual items will be more involved, we can introduce a function that renders a single item:
```fsharp {highlight: [1, 6]}
let renderTodo (todo: Todo) (dispatch: Msg -> unit) = (* . . . *)

let todoList (state: State) (dispatch: Msg -> unit) =
  Html.ul [
    prop.children [
      for todo in state.TodoList -> renderTodo todo dispatch
    ]
  ]
```
Now before I start implementing `renderTodo`, I will introduce a helper function that will simplify the UI code we have to write:
```fsharp
/// Helper function to easily construct div with only classes and children
let div (classes: string list) (children: Fable.React.ReactElement list) =
    Html.div [
        prop.classes classes
        prop.children children
    ]
```
When working with a CSS framework like Bulma or similar, you will find yourself having to write a lot of nested `div` containers just to specify their classes and children. Using the function above, it should make it easier for us to implement `renderTodo`:
```fsharp
let renderTodo (todo: Todo) (dispatch: Msg -> unit) =
  div [ "box" ] [
    div [ "columns"; "is-mobile"; "is-vcentered" ] [
      div [ "column" ] [
        Html.p [
          prop.className "subtitle"
          prop.text todo.Description
        ]
      ]

      div [ "column"; "is-narrow" ] [
        div [ "buttons" ] [
          Html.button [
            prop.classes [ "button"; if todo.Completed then "is-success"]
            prop.onClick (fun _ -> dispatch (ToggleCompleted todo.Id))
            prop.children [
              Html.i [ prop.classes [ "fa"; "fa-check" ] ]
            ]
          ]

          Html.button [
            prop.classes [ "button"; "is-danger" ]
            prop.onClick (fun _ -> dispatch (DeleteTodo todo.Id))
            prop.children [
              Html.i [ prop.classes [ "fa"; "fa-times" ] ]
            ]
          ]
        ]
      ]
    ]
  ]
```

The layout can be visualized roughly as follows:

<div style="width:100%">
  <div style="margin: 0 auto; width:70%;">
    <resolved-image source="/images/elm/render-todo-layout.png" />
  </div>
</div>

To understand how the columns work, please refer to [Bulma's docs](https://bulma.io/documentation/columns/) about columns. Basically I am separating the layout into two columns. By default the columns will share the space evenly. In the case of two columns, that means each column will be allocated 50% of the width. But in the example above, I want the description to have more space. So I use the `is-narrow` class on the second column such that the second column is only allocated the space it needs for the two buttons. The first column will automatically take up the rest of the space for the To-Do item description.

An interesting part of this layout is how the buttons are implemented:
```fsharp {highlight: [3, 11]}
Html.button [
  prop.classes [ "button"; if todo.Completed then "is-success"]
  prop.onClick (fun _ -> dispatch (ToggleCompleted todo.Id))
  prop.children [
    Html.i [ prop.classes [ "fa"; "fa-check" ] ]
  ]
]

Html.button [
  prop.classes [ "button"; "is-danger" ]
  prop.onClick (fun _ -> dispatch (DeleteTodo todo.Id))
  prop.children [
    Html.i [ prop.classes [ "fa"; "fa-times" ] ]
  ]
]
```
Notice the `onClick` event handlers. They trigger events `ToggleCompleted` and `DeleteTodo` providing the events with the `Id` of the To-Do item being rendered. This is important, because this means each button rendered in a To-Do item "knows" which item should be toggled or deleted. Let me try to illustrate this. Suppose you have the list of To-Do items:
```fsharp
[
  { Id = 1; Description = "Learn F#"; Completed = true }
  { Id = 2; Description = "Learn Elmish"; Completed = false }
]
```
The rendered buttons know exactly which event to trigger and which `Todo` is associated with each event:

<resolved-image source="/images/elm/associated-events.png" />

You can think about it as if the buttons "remember" which `Todo` they are bound to when they were rendered. Because we are using functions, the event handlers of these buttons create *closures* that maintain the information used within them. That information is the value of `todo.Id` coming from the individual To-Do items that we are rendering from the list.

Another nice thing about the buttons, especially the first one with the `check` icon, is the use of conditional classes based on the state of the *individual* To-Do item:
```fsharp {highlight: [2]}
Html.button [
  prop.classes [ "button"; if todo.Completed then "is-success"]
  prop.onClick (fun _ -> dispatch (ToggleCompleted todo.Id))
  prop.children [
    Html.i [ prop.classes [ "fa"; "fa-check" ] ]
  ]
]
```
The list input to `classes` will evaluate to "button is-success" when `todo.Completed` is true, making the button turn green. When `todo.Completed` returns false, the list input will evaluate to just "button" turning the button back to the default color of white.

That was it for part 2. You can check out the [source code here](https://github.com/Zaid-Ajaj/elmish-todo-part2) for reference.
