# To-Do List Application: Exercises

I could spend days tediously going through code and explaining the concepts behind it. But nothing helps you understand these concepts like actually trying to build something yourself. Many times one doesn't know what to build. So instead of asking you to build something from scratch, I have decided that it would be nicer to work with and add features to something that by now you should hopefully be already familiar with: our To-Do list application.

### Exercise 1: Refactor to-do IDs from `int` to `System.Guid`

Currently each to-do's ID is an `int`. However, the .NET framework has a built-in struct specifically for representing unique IDs: [`System.Guid`](https://docs.microsoft.com/en-us/dotnet/api/system.guid?view=netcore-3.1).

The point of this exercise is to change the `Todo` type so the ID is of type `Guid`. Then, using the IDE's errors, or even compiler errors, find all the places the change breaks the type-system and refactor them to make the application compile again.

To cut down on keystrokes, don't forget to `open System`, after which you can refer to the `Guid` struct without the namespace.  
Also, to generate a new ID using the `Guid` struct (_after opening it, of course)_, use `Guid.NewGuid()`.

### Exercise 2: Add Filter Tabs

Your second exercise is a fairly simple one: add filter tabs to your list. The filter tabs will allow the user to view all the items, the ones that are completed, or the ones that are uncompleted. It looks like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/elm/todo-exercise-one.gif" />
  </div>
</div>

As shown above, the filter tabs are buttons which have a "currently selected filter" feature as well. To give you a head start, this is how your `render` function will look in the beginning:

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
        prop.children [
          Html.a [
            prop.text "All"
          ]
        ]
      ]

      Html.li [
        Html.a [
          prop.text "Completed"
        ]
      ]

      Html.li [
        Html.a [
          prop.text "Not Completed"
        ]
      ]
    ]
  ]
```
Notice that this implementation doesn't do or check anything with the state. It is currently static and the "All" tab will always be selected. Aside from the the user interface for the tabs, you also need to implement the actual filtering of the list.

You can view and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-exercises/).

### Exercise 3: Disable save button when user hasn't changed the text

When in edit mode, the save button (the one with the floppy disk icon) has the class "is-primary" which gives the button the green-blue color. Your task is as follows: change the class "is-primary" to "is-outlined" when the description of `TodoBeingEdited` is equal to that of the To-Do item that is being edited. This tells the user that the save button will have no effect. It looks like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/elm/todo-exercise-two.gif" />
  </div>
</div>

Of course, this is not "disabling" the button for real. It just shows the user that the button is kind of inactive or has no effect when clicked because he or she didn't modify the text.

*Hint: remember how we implemented the completed check box*

### Exercise 4: Multi-Edit Mode

The way we implemented the To-Do list application only allows the user to edit a *single* To-Do item at a time. In this exercise, you will extend this feature and allow the user to edit multiple items at the same time. It will look like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;">
    <resolved-image source="/images/elm/todo-exercise-three.gif" />
  </div>
</div>

You will need to extend the state because now you are keeping track not of a *single* "edit model" (i.e. `TodoBeingEdited`) but *multiple* edit models instead. There are two ways you can approach this when extending the state:
 - (1) Keep track of `TodoBeingEdited list` instead of `TodoBeingEdited option`
 - (2) Remove `TodoBeingEdited option` altogether and instead add `BeingEdited:bool` and `EditDescription:string` to every `Todo` in your state

Both approaches are OK because they are keeping track of the same amount of data, meaning no information redundancy. I would recommend you implement the feature twice using *both* approaches and see for yourself which one is easier to think about and to implement. Good luck!

You can view and use the application [live here](https://zaid-ajaj.github.io/elmish-todo-exercises/).

### Exercise 5: Refactor Bulma With TypedCssClasses

Throughout the user interface of the To-Do list, we have been using Bulma's classes to enhance the look and feel of the application. These classes are just strings that we have to look up in the documentation and remember to write correctly in our application. We can do much better than magic strings to avoid having to remember them or writing then incorrectly. The first approach is simply writing a module called `Bulma` that includes the class names:
```fsharp
module Bulma =
  let [<Literal>] Button = "button"
  let [<Literal>] IsPrimary = "is-primary"
  // etc.
```
Although this would work, it requires considerable amount of work to take every class exposed from Bulma and writing in the module, not to mention that you have to maintain the module and update it when Bulma introduces breaking changes. Finally, you would have to follow this process for every CSS framework you want to use. What if there was a tool that does all things for us using a single line of code? Enter [TypedCssClasses](https://github.com/zanaptak/TypedCssClasses) written by [Zanaptak](https://github.com/zanaptak), a type-provider that infers the class names exposed from a stylesheet and makes them available during compile-time!

First of all, install the package into the F# project
```bash
cd src
dotnet add package Zanaptak.TypedCssClasses
```
After installing the library, you can use the type-provider called `CssClasses` from the package which takes a link to a stylesheet as input and creates a type that exposes the possible class names as static properties of that type. Very simple to use and type-safe:

```fsharp
open Zanaptak.TypedCssClasses

type Bulma = CssClasses<"https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css", Naming.PascalCase>
```
Here, the generated type `Bulma` has static properties that correspond to the class names from the input stylesheet and can be used to convert this piece of code:
```fsharp
Html.button [
  prop.classes [ "button"; "is-primary"; "is-medium" ]
  prop.onClick (fun _ -> dispatch CancelEdit)
  prop.text "Add"
]
```
Into the following:
```fsharp
open Zanaptak.TypedCssClasses

type Bulma = CssClasses<"https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css", Naming.PascalCase>

Html.button [
  prop.classes [ Bulma.Button; Bulma.IsPrimary; Bulma.IsMedium ]
  prop.onClick (fun _ -> dispatch CancelEdit)
  prop.text "Add"
]
```
In this exercise, you are tasked with refactoring the To-Do application to use the type-safe Bulma classes and remove any use of strings in the `prop.className` attributes. Do the same for FontAwesome icons:
```fsharp
type FA = CssClasses<"https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css", Naming.PascalCase>
```

When working with multiple files, you can use a little trick to make the `Bulma` class globally available to all of your files by exposing the generated type `Bulma` from an "auto-opened" module that is referenced in the project very early on (added before any other file that would reference it)
```fsharp
[<AutoOpen>]
module ApplicationStyles

open Zanaptak.TypedCssClasses

// Bulma classes
type Bulma = CssClasses<"https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css", Naming.PascalCase>

// Font-Awesome classes
type FA = CssClasses<"https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css", Naming.PascalCase>
```
Now if you add this module as the first file in your F# project, the types `Bulma` and `FA` will be available in all other files without having to explicitly open the `ApplicationStyles` because it has the `[<AutoOpen>]` attribute.
