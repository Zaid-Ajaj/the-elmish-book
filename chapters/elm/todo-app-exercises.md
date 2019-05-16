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

```fsharp {highlight: [1, 8]}
let renderFilterTabs (state: State) (dispatch: Msg -> unit) = 
  (* . . *)

let render (state: State) (dispatch: Msg -> unit) =
    div [ Style [ Padding 20 ] ] [
    h3 [ Class "title" ] [ str "Elmish To-Do list" ]
    createTodoTextbox state dispatch
    renderFilterTabs state dispatch
    div [ Class "content" ] [ 
      for todo in state.TodoList -> 
        match state.TodoBeingEdited with 
        | Some todoBeingEdited when todoBeingEdited.Id = todo.Id -> 
            renderEditForm todoBeingEdited dispatch 
        | otherwise ->
            renderTodo todo dispatch
    ]
  ]
```
Where `renderFilterTab` will have the following structure:
```fsharp
let renderFilterTabs (state: State) (dispatch: Msg -> unit) = 
    div [ Class "tabs is-toggle is-fullwidth" ] [ 
        ul [ ] [
            li [ Class "is-active" ] [ 
                a [ ] [ str "All" ]
            ]

            li [ ] [ 
                a [ ] [ str "Completed" ]
            ]

            li [ ] [ 
                a [ ] [ str "Not Completed" ]
            ]
        ]
    ]
```
Notice that this implementation doesn't do or check anything with the state. It is currently static and the "All" tab will always be selected. 

You can view and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-exercises/).

### Exercise 2: Multi-Edit Mode

The way we implemented the To-Do list application only allows to edit a *sinlge* To-Do item at a time. In this exercise, you will extend this feature and allow the user to edit multiple items at the same time. It will like this:


<div style="width:100%">
  <div style="margin: 0 auto; width:65%;"> 
    <resolved-image source="/images/elm/todo-exercise-two.gif" />      
  </div>
</div>


You can view and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-exercises/).

