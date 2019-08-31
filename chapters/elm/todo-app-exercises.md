# To-Do List Application: Exercises

I could spend days, tediously going through code and explaining the concepts behind it but nothings helps you understand these concepts like actually trying to build something yourself. Many times one doesn't know what to build so instead of asking you to build something from scratch, I have decided that is would be nicer to work with and add features to something that you, by now hopefully, are already familiar with: our To-Do list application.

### Exercise 1: Add Filter Tabs

Your first exercise is a fairly simple one, adding filter tabs to your list that lets the user view all the items, the ones that are completed or the ones that still To-Do. It looks like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/elm/todo-exercise-one.gif" />
  </div>
</div>

As shown above, the filter tabs are buttons which have a "currently selected filter" feature as well. To give you a head start, this is how your `render` function will look like in the beginning:

```fsharp {highlight: [1, 10]}
let renderFilterTabs (state: State) (dispatch: Msg -> unit) =
  (* . . *)

let render (state: State) (dispatch: Msg -> unit) =
  Html.div [
    prop.style [ style.padding 20 ]
    prop.children [
      appTitle
      inputField state dispatch
      renderFilterTabs state dispatch
      todoList state dispatch
    ]
  ]
```
Where `renderFilterTab` has the following structure:
```fsharp
let renderFilterTabs (state: State) (dispatch: Msg -> unit) =
  div [ "tabs"; "is-toggle"; "is-fullwidth" ] [
    Html.ul [
      Html.li [
        prop.className "is-active"
        prop.text
      ]

      Html.li "Completed"
      Html.li "Not Completed"
    ]
  ]
```
Notice that this implementation doesn't do or check anything with the state. It is currently static and the "All" tab will always be selected. Aside from the the user interface for the tabs, you also need to implement the actual filtering of the list.

You can view and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-exercises/).

### Exercise 2: Disable save button when user hasn't changed the text

When in edit mode, the save button (the one with the floppy disk icon) has the class "is-primary" which gives the button the green-blue color. Your task is as follows: change the class "is-primary" to "is-outlined" when the description of `TodoBeingEdited` is equal to that of the To-Do item that is being edited. This tells the user that they their save button will have no effect. It looks like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/elm/todo-exercise-two.gif" />
  </div>
</div>

Of course, this is not "disabling" the button for real, it just shows the user that the button is kind of inactive or has no effect when clicked because he or she didn't modify the text.

*Hint: remember how we implemented the completed check box*

### Exercise 3: Multi-Edit Mode

The way we implemented the To-Do list application only allows to edit a *single* To-Do item at a time. In this exercise, you will extend this feature and allow the user to edit multiple items at the same time. It will look like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/elm/todo-exercise-three.gif" />
  </div>
</div>

You will need to extend the state as now you are keeping track not of a single "edit model" (i.e. `TodoBeingEdited`) but multiple edit models instead. There are two ways you can approach this when extending the state:
 - (1) Keep track of `TodoBeingEdited list` instead of `TodoBeingEdited option`
 - (2) Remove `TodoBeingEdited option` altogether and instead add `BeingEdited:bool` and `EditDescription:string` to every `Todo` in your state

Both approaches are OK because they are keeping track of the same amount of data, meaning no information redundancy. I would recommend you implement the feature twice using *both* approaches and see for yourself which one is easier to think about and to implement. Good luck!

You can view and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-exercises/).

### Exercise 4: Refactor with Fulma

Throughout the user interface of the To-Do list, we have been using Bulma's classes to enhance the look and feel of the application. These classes are just strings that we have to look up in the documentation and remember to write correctly in our application, we can do much better than magic strings: enter [Fulma](https://github.com/Fulma/Fulma)!

Fulma is a library that allows us to write UI code that makes use of Bulma classes in a type-safe manner. It provides idiomatic F# APIs to construct the user interface elements without having to remember the magic strings and have the compiler check the correctness of the code.

For example, the following snippet:
```fsharp
Html.button [
    prop.classes [ "button"; "is-primary"; "is-medium" ]
    prop.onClick (fun _ -> dispatch CancelEdit)
    prop.text "Add"
]
```
Can be rewritten using Fulma's modules as follows:
```fsharp
Button.button
  [ Button.Color IsPrimary
    Button.Size IsMedium
    Button.OnClick (fun _ -> dispatch CancelEdit) ] [
    str "Add"
  ]
```
Notice how Bulma's classes such as `is-primary` and `is-medium` are grouped in their appropriate categories using `Button.Color` and `Button.Size` respectively.

The same applies for most types of UI elements, for example the text box:
```fsharp
Html.input [
  prop.classes ["input"; "is-medium"]
  prop.valueOrDefault state.NewTodo
  prop.onTextChange (SetNewTodo >> dispatch)
]
```
Can be rewritten into the follows:
```fsharp
Input.input [
  Input.Size IsMedium
  Input.ValueOrDefault state.NewTodo
  Input.OnChange (fun ev -> dispatch (SetNewTodo ev.Value))
]
```
In this exercise, you are tasked to refactor the To-Do list application using Fulma instead of Bulma's stringy classes. To get started, you need to install Fulma into your project. Fulma is just a nuget package that you can add to your `App.fsproj` as follows:
```bash
cd src
dotnet add package Fulma
```
Now inside `App.fs`, just `open Fulma` and start refactoring mercilessly! You can consult the very comprehensive [documentation](https://fulma.github.io/Fulma/) when you need to know how the different classes such as "field" and whatnot translate to Fulma's elements.