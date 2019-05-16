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
Where `renderFilterTab` has the following structure:
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
Notice that this implementation doesn't do or check anything with the state. It is currently static and the "All" tab will always be selected. Aside from the the user interface for the tabs, you also need to implement the actual filtering of the list.

You can view and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-exercises/).

### Exercise 2: Disable save button when user hasn't changed the text

When in edit mode, the save button (the one with the floppy disk icon) has the class "is-primary" which gives the button the greenblue color. Your task is as follows: change the class "is-primary" to "is-outlined" when the description of `TodoBeingEdited` is equal to that of the To-Do item that is being edited. This tells the user that they their save button will have no effect. It looks like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;"> 
    <resolved-image source="/images/elm/todo-exercise-two.gif" />      
  </div>
</div>

Of course, this is not "disabling" the button for real, it just shows the user that the button is kind of inactive or has no effect when clicked because he or she didn't modify the text.

*Hint: remember how we implemented the completed check box*


### Exercise 3: Multi-Edit Mode

The way we implemented the To-Do list application only allows to edit a *sinlge* To-Do item at a time. In this exercise, you will extend this feature and allow the user to edit multiple items at the same time. It will look like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;"> 
    <resolved-image source="/images/elm/todo-exercise-three.gif" />      
  </div>
</div>

You will need to extend the state as now you are keeping track not of a single "edit model" (i.e. `TodoBeingEdited`) but multiple edit models instead. There are two ways you can approach this when extending the state:
 - (1) Keep track of `TodoBeingEdited list` instead of `TodoBeingEdited option` 
 - (2) Remove `TodoBeingEdited option` altogether and instead add `BeingEdited:bool` and `EditDescription:string` to every `Todo` in your state

Both approaches are OK because they are keeping track of the same amount of data (no redundancy) so I would recommend you implement the feature twice using *both* approaches and see for yourself which one is easier to think about and to implement. Good luck! 

You can view and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-exercises/).

