# To-Do List Application: Part 3

In the section, we will add a feature to our To-Do list application that makes every item in the list editable, it looks as follows:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;"> 
    <resolved-image source="/images/elm/todo-part3.gif" />      
  </div>
</div>

Notice here that we have two requirements as well:
 - Edit one To-Do item at a time.
 - Being able to cancel the editing mode leaving the item unaltered.

You can see and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-part3/).

### Modelling The State 

Alright, this one can be a bit tricky. This is because this "editing mode" is not always active. The user has to click the edit button for a certain To-Do item, then the edit form is shown for that specific item. We know at least that we have to maintain the `Id` of the To-Do item being edited, let's start with that:
```fsharp {highlight: [9]}
type Todo = {
  Description: string
  Completed: bool
}

type State = {
  NewTodo : string
  TodoList : Todo list 
  TodoBeingEdited : int 
}
```
Here I have added `TodoBeingEdited` which is an `int` to keep track of the To-Do being edited. But we said that this editing mode is not always active and certainly when the application starts, there is no To-Do item being edited yet. 

A better way to model information that not available at application startup is to use the `Option<'t>` type such that when we initialize the state, we can say: "this piece of information is optional and can be missing, you can't assume the presence of the value and you have to check it first".

```fsharp {highlight: [9]}
type Todo = {
  Description: string
  Completed: bool
}

type State = {
  NewTodo : string
  TodoList : Todo list 
  TodoBeingEdited : int option 
}
```
Where `TodoBeingEdited` will be `None` when initializing the state. 

You might argue that using `Option<int>` is not necessary for initializing the state and that one could just use a useless value like `-1` for the To-Do item being edited. The thing is, the initial state is *not* our only concern, we have to use this value both inside the `update` and the `render` function. Modelling the field as optional forces us *at compile time* to check whether or not we can use the value. It is all about what you can or cannot assume when updating the state or rendering the user interface. The fields used in `State` should convey your *intentions* so that your colleagues or anyone for that matter can understand what your code is supposed to do. 

Suppose I was going through your code and I read `TodoBeingEdited : int`, I will be confused because the code assumed there is always a To-Do item being edited. Doesn't make sense. However, if I read `TodoBeingEdited : int option` I immediately know this is something that can be missing and that I should take into account the existence of such value. This is alse makes sense from the UI point of view because a user is not always editing an item.

OK, now that we have that out of the way, we ask ourselves: is this all the information needed for editing a To-Do item, both for the `update` and the `render` function?

Well, if we know which item is being edited, then the edit form can simply start modifying the description of said item as the user is typing. but unfortunately this goes against the requirment of being able to cancel the editing mode without changing the contents of the item. This is because when we cancel the edit mode, the To-Do item should retain it's original description, not the one that was typed in during the edit mode. Now we know: we have to keep track of the new edited description *separate* from the description of the item being edited. Let's incorporate our findings into the `State` type:

```fsharp {highlight: ['7-10', 15]}
type Todo = {
  Id : int
  Description : string
  Completed : bool
}

type TodoBeingEdited = {
  Id: int
  Description: string
} 

type State = { 
  TodoList: Todo list 
  NewTodo : string 
  TodoBeingEdited : TodoBeingEdited option
}
```

Now when are in editing mode, we have to know which item we are editing (which `Id`) and also the new description for that item. If the user applies the edits, the description of item being edited is replaced with the description that the user provided, otherwise when the user cancels the editing mode, we just reset `TodoBeingEdited` back to `None` like it initially was on application startup.

Moving on to the events of the application: the `Msg` type. We will keep the events and their implementation from Part 2 as is because they shoud keep doing what they are doing. We will be be adding a couple more, namely:

```fsharp {highlight: ['6-9']}
type Msg =
  | SetNewTodo of string 
  | AddNewTodo 
  | DeleteTodo of int
  | ToggleCompleted of int
  | CancelEdit
  | ApplyEdit
  | StartEditingTodo of int 
  | SetEditedDescription of string 
```
Here I have added 4 new events. Three of which will be associated with buttons:
 - `StartEditingTodo of int` Will start the edit mode for a specific To-Do item when you click the edit button.
 - `CancelEdit` cancels the editing mode by resetting the `TodoBeingEdited` back to `None`.
 - `ApplyEdit` takes the information from `TodoBeingEdited` (if it is available!) and applies the changes to the `Todo` item from `state.TodoList`, resetting the edit form to `None`.
 - `SetEditedDescription of string` Modifies the edited description in `TodoBeingEdited` (if it has a value).

Let's go through the implementation of these events when updating the state. 

### Implementing State Updates