# Splitting Programs

In this section, we will take a detailed look into splitting an Elmish program into multiple programs. The key is that in this example, we are working with *simple* programs: without commands in the definition of `init` and `update`. Splitting Elmish programs with commands will be tackled in the next section. We will be covering a lot in this section, here is the table of contents of what is up next:

- [Counter And Text Input](#counter-and-text-input)
- [Refactoring The State](#refactoring-the-state)
- [Composing Dispatch Functions](#composing-dispatch-functions)
- [Refactoring `update` and `init`](#refactoring-update-and-init)
- [Programs As Modules](#programs-as-modules)
- [Bootstrapping The Application](#bootstrapping-the-application)
- [Flow Of Messages](#flow-of-messages)
- [Modules In Separate Files](#modules-in-separate-files)

### Counter And Text Input

Consider the following application

<div style="margin-top: 40px; margin-bottom:40px; width:100%">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/scaling/multiple-simple-programs.gif" />
  </div>
</div>

This is an application that switches between two views: one for a counter with increment and decrement buttons and another view that shows an input text box which reflects the text onto a header below it when you start typing in that text input. Now, before I show you anything from the code, pause for a second and try to figure out the pieces of information that this program has to keep track of and which events are triggered from the user interface.

For the first view showing the counter, the application has to keep track of the count and have the associated "increment" and "decrement" events to change the count. As for the other input text view, the application keeps track of the text from the input and reacts when that text changes. There is also a checkbox that toggles the reflected text into uppercase mode and back. Finally, the application keeps track of information that is *irrelevant* to both the counter and input text: which view is currently shown on screen with the button that toggles the view from the counter to the input text and back.

Putting this together, we get the following `State` type that includes all these pieces in one place. You can follow along this section while reading the initial source code of this program from the repository [Zaid-Ajaj/multiple-simple-programs](https://github.com/Zaid-Ajaj/multiple-simple-programs).

The definition of the `State` is pretty straightforward:
```fsharp
type Page =
  | Counter
  | TextInput

type State =
  { Count: int
    InputText: string
    IsUpperCase: bool
    CurrentPage : Page }
```
We have the `Count` field which is used in the counter view. As for `InputText` and `IsUpper`, they are used in the text input view. Finally we have the `CurrentPage` field which is of type `Page` defined earlier that keeps track of view is currently shown on screen.

The associated `Msg` type and its cases are also straightforward:
```fsharp
type Msg =
  | Increment
  | Decrement
  | InputTextChanged of string
  | UppercaseToggled of bool
  | SwitchPage of Page
```
We have `Increment` and `Decrement` for the counter, the `InputTextChanged` and `UppercaseToggled` for the input text and finally a `SwitchPage` case for, well, switching between the counter and input text. The `update` function is implemented as follows
```fsharp
let update (msg: Msg) (state: State): State =
  match msg with
  | Increment -> { state with Count = state.Count + 1 }
  | Decrement -> { state with Count = state.Count - 1 }
  | InputTextChanged text -> { state with InputText = text }
  | UppercaseToggled upperCase -> { state with IsUpperCase = upperCase }
  | SwitchPage page -> { state with CurrentPage = page }
```
Finally the `render` function is where both views, the counter and text input view are put together by switching over the `CurrentPage` field from the state:
```fsharp {highlight: [5,6,7,8, 27, 28, 29, 30]}
let render (state: State) (dispatch: Msg -> unit) =
  match state.CurrentPage with
  | Page.Counter ->
      Html.div [
        Html.button [
          prop.text "Show Text Input"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.TextInput))
        ]

        divider

        Html.button [
          prop.onClick (fun _ -> dispatch Increment)
          prop.text "Increment"
        ]

        Html.button [
          prop.onClick (fun _ -> dispatch Decrement)
          prop.text "Decrement"
        ]

        Html.h1 state.Count
      ]

  | Page.TextInput ->
      Html.div [
        Html.button [
          prop.text "Show counter"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.Counter))
        ]

        divider

        Html.input [
          prop.valueOrDefault state.InputText
          prop.onChange (InputTextChanged >> dispatch)
        ]

        divider

        Html.input [
          prop.id "uppercase-checkbox"
          prop.type'.checkbox
          prop.isChecked state.IsUpperCase
          prop.onChange (UppercaseToggled >> dispatch)
        ]

        Html.label [
          prop.htmlFor "uppercase-checkbox"
          prop.text "Uppercase"
        ]

        Html.h3 (if state.IsUpperCase then state.InputText.ToUpper() else state.InputText)
      ]
```
The highlighted parts shows two buttons that dispatch the `SwitchPage` messages that causes the application to switch from the counter view to the text input and vice-versa.

At this point, you must be thinking: "Zaid, why are we going through this simple stuff, we have seen this before! Just get to the compostion techniques already." The thing is, I want to show you that composing larger programs or in this case, splitting a bigger program into smaller ones, naturally arises from *refactoring* the common parts into separate type definitions and separate functions that handle these types. Let us try to refactor the counter view and text input view such that the implementation of either views is entirely separate from one another.

### Refactoring The State

As we have seen before, when the `render` function becomes too big, we split it into smaller functions. In the case of the function above, it makes sense to put the counter view as well as the text input view into separate functions, let us call them `renderCounter` and `renderTextInput` where they have the same definition as the `render` function. The `render` function passes the state, as well as the dispatch function down to these functions and you end up with the same result:
```fsharp {highlight: [1, 3, 15, 26]}
let renderCounter (state: State) (dispatch: Msg -> unit) = (*...*)

let renderInputText (state: State) (dispatch: Msg -> unit) = (*...*)

let render (state: State) (dispatch: Msg -> unit) =
  match state.CurrentPage with
  | Page.Counter ->
      Html.div [
        Html.button [
          prop.text "Show Text Input"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.TextInput))
        ]

        divider
        renderCounter state dispatch
      ]

  | Page.TextInput ->
      Html.div [
        Html.button [
          prop.text "Show counter"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.Counter))
        ]

        divider
        renderInputText state dispatch
      ]
```
However, these functions have a parameter of type `State` but the `renderCounter` is only using the `Count` field and `renderInputText` is using the fields `InputText` and `IsUppercase`. It doesn't make sense for `renderInputText` to have access to the `Count` field since it doesn't do anything with it. Let us refactor the code such that these functions only get the information that they actually use. We can start by putting the fields into separate records where each record holds the data required by a certain view:
```fsharp {highlight: [9, 10]}
type CounterState =
  { Count: int }

type InputTextState =
  { InputText: string
    IsUpperCase: bool }

type State =
  { Counter: CounterState
    InputText: InputTextState
    CurrentPage : Page }
```
Now the render functions for both views can have access only to the information thay actually require:
```fsharp {highlight: [1, 3, 15, 26]}
let renderCounter (state: CounterState) (dispatch: Msg -> unit) = (*...*)

let renderInputText (state: InputTextState) (dispatch: Msg -> unit) = (*...*)

let render (state: State) (dispatch: Msg -> unit) =
  match state.CurrentPage with
  | Page.Counter ->
      Html.div [
        Html.button [
          prop.text "Show Text Input"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.TextInput))
        ]

        divider
        renderCounter state.Counter dispatch
      ]

  | Page.TextInput ->
      Html.div [
        Html.button [
          prop.text "Show counter"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.Counter))
        ]

        divider
        renderInputText state.InputText dispatch
      ]
```
But now there is another problem: the dispatch function. As things are right now, the `dispatch` function passed down to `renderCounter` and `renderInputText` is able to dispatch any `Msg` case which means that the `renderInputText` is able to dispatch `Increment` or `Decrement` events at will even though they have nothing to do with that part of the application when the input text view is being rendered on screen. Likewise, `renderCounter` should only be able to dispatch `Increment` and `Decrement`, nothing else.

We can further restrict the `Msg` type into smaller discriminated unions such that `renderCounter` and `renderInputText` can dispatch only the events that are relevant to their parts of the application:
```fsharp {highlight: [10, 11]}
type CounterMsg =
  | Increment
  | Decrement

type InputTextMsg =
  | InputTextChanged of string
  | UppercaseToggled of bool

type Msg =
  | CounterMsg of CounterMsg
  | InputTextMsg of InputTextMsg
  | SwitchPage of Page
```
Now the two smaller functions can have proper types such that they only access the data they need and can only dispatch events that are related to their data:
```fsharp
let renderCounter (state: CounterState) (dispatch: CounterMsg -> unit) = (*...*)
let renderInputText (state: InputTextState) (dispatch: InputTextMsg -> unit) = (*...*)
```

### Composing Dispatch Functions

There is a little bit of a problem. Now the smaller render functions no longer can take the `dispatch` function as input coming from the top-level `render`. Instead, the functions `renderCounter` and `renderInputText` take `CounterMsg -> unit` and `InpuTextMsg -> unit` as input, respectively.

The question is, how do we make such functions when we only have the *original* function of type `Msg -> unit`? The answer is not straighforward at first glance, but it is not complicated or difficult either. It goes as follows: given an already provided dispatch function of type `Msg -> unit`, you can create *derivative* functions from it, one for the `renderCounter` and another for the `renderInputText`:
```fsharp {highlight: [3, 4, 6, 7, 18, 29]}
let render (state: State) (dispatch: Msg -> unit) =

  let counterDispatch (counterMsg: CounterMsg) : unit =
    dispatch (Msg.CounterMsg counterMsg)

  let inputTextDispatch (inputTextMsg: InputTextMsg) : unit =
    dispatch (Msg.TextInputMsg inputTextMsg)

  match state.CurrentPage with
  | Page.Counter ->
      Html.div [
        Html.button [
          prop.text "Show Text Input"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.TextInput))
        ]

        divider
        renderCounter state.Counter counterDispatch
      ]

  | Page.TextInput ->
      Html.div [
        Html.button [
          prop.text "Show counter"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.Counter))
        ]

        divider
        renderInputText state.InputText inputTextDispatch
      ]
```
Notice in the highlighted code above, the functions `counterDispatch` and `inputTextDispatch`. They have the types `CounterMsg -> unit` and `InputTextMsg -> unit` which is what the smaller rendering functions need.
```fsharp
let counterDispatch (counterMsg: CounterMsg) : unit =
  dispatch (Msg.CounterMsg counterMsg)

let inputTextDispatch (inputTextMsg: InputTextMsg) : unit =
  dispatch (Msg.TextInputMsg inputTextMsg)
```
Here they are again. As you can see, these functions do nothing special, they only wrap their input messages (for the child programs) into a message type of the parent program, namely from the cases `Msg.CounterMsg` and `Msg.InputTextMsg` which the original `dispatch` function understands since it takes `Msg` as input.

Actually, you will rarely ever see these composed `dispatch` functions written out in this format, most of the time the are written in-line where the smaller render functions are being called as follows:
```fsharp {highlight: [11, 22]}
let render (state: State) (dispatch: Msg -> unit) =
  match state.CurrentPage with
  | Page.Counter ->
      Html.div [
        Html.button [
          prop.text "Show Text Input"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.TextInput))
        ]

        divider
        renderCounter state.Counter (fun counterMsg -> dispatch (CounterMsg counterMsg))
      ]

  | Page.TextInput ->
      Html.div [
        Html.button [
          prop.text "Show counter"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.Counter))
        ]

        divider
        renderInputText state.InputText (fun inputTextMsg -> dispatch (InputTextMsg inputTextMsg))
      ]
```
These forms can be simplified even further into the format that is most commonly used in Elmish applications that uses the composition operator `>>`
```fsharp {highlight: [11, 22]}
let render (state: State) (dispatch: Msg -> unit) =
  match state.CurrentPage with
  | Page.Counter ->
      Html.div [
        Html.button [
          prop.text "Show Text Input"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.TextInput))
        ]

        divider
        renderCounter state.Counter (CounterMsg >> dispatch)
      ]

  | Page.TextInput ->
      Html.div [
        Html.button [
          prop.text "Show counter"
          prop.onClick (fun _ -> dispatch (SwitchPage Page.Counter))
        ]

        divider
        renderInputText state.InputText (InputTextMsg >> dispatch)
      ]
```
It comes down to the syntax of `(ChildMsg >> dispatch)` which effectively *translates* messages from the child program message type (i.e. `CounterMsg` and `CounterMsg`) into a message type of the parent program (i.e. `Msg`) which is then `dispatch`-ed back into the dispatch loop to be handled by the `update` function and so on and so forth.

In many examples out there, this final form is shown as a first example which could prove to be quite of a head-scratcher, I know for me it was. However, once you disect where it comes from and the reasoning behind it then it all makes sense.

### Refactoring `update` and `init`:

What happened to `update` and `init` now that we have introduced the types `CounterState`, `InputTextState` and their associated message types? Let us inspect them after an initial refactoring and see what we could do better. First of all, the `init` function:
```fsharp
let initCounter() : CounterState =
  { Count = 0 }

let initInputText() : InputTextState =
  { InputText = ""
    IsUpperCase = false }

let init() : State =
  { Counter = initCounter()
    InputText = initInputText()
    CurrentPage = Page.Counter }
```
We split the initialization of the states of the child programs into separate functions. The root `init()` function simply calls these functions to initialize the fields that hold the states of these child programs but it also initializes the data that itself keeps track of, namely the `CurrentPage` field.

When you see such piece of code, you can read it as follows: "The initial state of the parent program is made out of the initial states of the child programs along with the data that is managed by the parent program itself."

If you list the types of these initialization functions, you will see something funny:
```fsharp
val initCounter : unit -> CounterState
val initInputText : unit -> InputTextState
val init : unit -> State
```
All of these functions have `unit` as input. It makes sense the root program to have the initialization function be of type `unit -> State` because it is the "entry" program. The child programs however, will *not* necessarily have `unit` as input, in fact, it is quite often not the case. These child programs often require some data their fields with when they are rendered on screen. For example, if you have a user dashboard page, that page will be implemented as a program which will likely require a `User` as input for initialization, having a `init` signature of `User -> UserDashboardState`. We will take a look at such example at a later section, I just wanted you to realize that the child programs do not necessarily need to follow the "standard" program definition as long as they are *composable* with their parent program.

Moving on to the `update` function, which has become a bit of a mess because of the types that were introducee earlier, let's take a look:
```fsharp
let update (msg: Msg) (state: State): State =
  match msg with
  | CounterMsg Increment ->
      let counter = { state.Counter with Count = state.Counter.Count + 1 }
      { state with Counter = counter }

  | CounterMsg Decrement ->
      let counter = { state.Counter with Count = state.Counter.Count - 1 }
      { state with Counter = counter }

  | InputTextMsg (InputTextChanged text) ->
      let inputText = { state.InputText with InputText = text }
      { state with InputText = inputText }

  | InputTextMsg (UppercaseToggled upperCase) ->
      let inputText = { state.InputText with IsUpperCase = upperCase }
      { state with InputText = inputText }

  | SwitchPage page ->
      { state with CurrentPage = page }
```
It is a mess because of the nested message definitions from `CounterMsg` and `InputTextMsg` as well as the nested records of type `CounterState` and `InputTextState` that has to be updated separately before updating the parent record of type `State`. Luckily though, it is easy to refactor the `update` function into specialized functions that update the nested records:
```fsharp {highlight: [14, 15, 18, 19]}
let updateCounter (counterMsg: CounterMsg) (counterState: CounterState) =
  match counterMsg with
  | Increment -> { counterState with Count = counterState.Count + 1 }
  | Decrement -> { counterState with Count = counterState.Count - 1 }

let updateInputText (inputTextMsg: InputTextMsg) (inputTextState: InputTextState) =
  match inputTextMsg with
  | InputTextChanged text -> { inputTextState with InputText = text }
  | UppercaseToggled upperCase -> { inputTextState with IsUpperCase = upperCase }

let update (msg: Msg) (state: State): State =
  match msg with
  | CounterMsg counterMsg ->
      let updatedCounter =  updateCounter counterMsg state.Counter
      { state with Counter = updatedCounter }

  | InputTextMsg inputTextMsg ->
      let updatedInputText = updateInputText inputTextMsg state.InputText
      { state with InputText = updatedInputText}

  | SwitchPage page ->
      { state with CurrentPage = page }
```
And there we have it! Took us a while but we now have an `init` function, an `update` function and a `render` function, all of which are specialized to deal with a part of the application that is entirely separate of other parts. This means if you were to add or remove feature from the counter view, the input text view isn't impacted in anyway and there is no risk of introducing bugs in one program when we make changes in another, except of course for the parent program that controls the data flow between the views and the switching from one into another.

### Programs As Modules

To enforce the concept that the two programs, the counter and input text, are totally separate, we can put their relavant program pieces into a *module*. In an Elmish application, we will put programs into their respective modules which expose a composable API to the outside world while hiding the small helper functions inside that module.

Let us move the pieces around and put them in modules: the counter goes into a `Counter` module and the input text goes into the `InputText` module. We will put the types for the state and messages in these modules as well so there will be no need for example to call the state of the counter as "CounterState" but rather simply `State` and refer to it from the parent as `Counter.State`. The same train of thought follows for `Counter.Msg`, `init`, `update` and `render`.

Here is the `Counter` module
```fsharp
[<RequireQualifiedAccess>]
module Counter =

  type State =
    { Count: int }

  type Msg =
    | Increment
    | Decrement

  let init() =
    { Count = 0 }

  let update (counterMsg: Msg) (counterState: State) =
    match counterMsg with
    | Increment -> { counterState with Count = counterState.Count + 1 }
    | Decrement -> { counterState with Count = counterState.Count - 1 }

  let render (state: State) (dispatch: Msg -> unit) =
    Html.div [
      Html.button [
        prop.onClick (fun _ -> dispatch Increment)
        prop.text "Increment"
      ]
      Html.button [
        prop.onClick (fun _ -> dispatch Decrement)
        prop.text "Decrement"
      ]
      Html.h1 state.Count
    ]
```
As simple as that, this `Counter` module is a self-contained program exposing all the required parts to become compasable with a parent program as we will see in a bit. Notice the `RequireQualifiedAccess` attribute added to the module to simplify API discoverability and know which function is coming from which module.

The same logic follows for the `InputText` module:

```fsharp
[<RequireQualifiedAccess>]
module InputText =

  type State =
    { InputText: string
      IsUpperCase: bool }

  type Msg =
    | InputTextChanged of string
    | UppercaseToggled of bool

  let init() =
    { InputText = ""
      IsUpperCase = false }

  let update (inputTextMsg: Msg) (inputTextState: State) =
    match inputTextMsg with
    | InputTextChanged text -> { inputTextState with InputText = text }
    | UppercaseToggled upperCase -> { inputTextState with IsUpperCase = upperCase }

  let render (state: State) (dispatch: Msg -> unit) =
    Html.div [
      Html.input [
        prop.valueOrDefault state.InputText
        prop.onChange (InputTextChanged >> dispatch)
      ]
      divider
      Html.input [
        prop.id "uppercase-checkbox"
        prop.type'.checkbox
        prop.isChecked state.IsUpperCase
        prop.onChange (UppercaseToggled >> dispatch)
      ]
      Html.label [
        prop.htmlFor "uppercase-checkbox"
        prop.text "Uppercase"
      ]
      Html.h3 (if state.IsUpperCase then state.InputText.ToUpper() else state.InputText)
    ]
```
Again, the module `InputText` is written such that it contains all the pieces required for an Elmish program. Of course, these pieces don't do anything on their own unless the outside world - the parent program - consumes them and puts the pieces together: composing the lego blocks into bigger pieces. This is the resposibility of the parent program which I will call `App`:
```fsharp
[<RequireQualifiedAccess>]
module App =

  [<RequireQualifiedAccess>]
  type Page =
    | Counter
    | TextInput


  type State =
    { Counter: Counter.State
      InputText: InputText.State
      CurrentPage : Page }

  type Msg =
    | CounterMsg of Counter.Msg
    | InputTextMsg of InputText.Msg
    | SwitchPage of Page

  let init() =
    { Counter = Counter.init()
      InputText = InputText.init()
      CurrentPage = Page.Counter }

  let update (msg: Msg) (state: State): State =
    match msg with
    | CounterMsg counterMsg ->
        let updatedCounter =  Counter.update counterMsg state.Counter
        { state with Counter = updatedCounter }

    | InputTextMsg inputTextMsg ->
        let updatedInputText = InputText.update inputTextMsg state.InputText
        { state with InputText = updatedInputText}

    | SwitchPage page ->
        { state with CurrentPage = page }

  let render (state: State) (dispatch: Msg -> unit) =
    match state.CurrentPage with
    | Page.Counter ->
        Html.div [
          Html.button [
            prop.text "Show Text Input"
            prop.onClick (fun _ -> dispatch (SwitchPage Page.TextInput))
          ]

          divider
          Counter.render state.Counter (CounterMsg >> dispatch)
        ]

    | Page.TextInput ->
        Html.div [
          Html.button [
            prop.text "Show counter"
            prop.onClick (fun _ -> dispatch (SwitchPage Page.Counter))
          ]

          divider
          InputText.render state.InputText (InputTextMsg >> dispatch)
        ]
```
The `App` module is the "outside" world of the other Elmish modules and it consumes the functions and types from these child modules/programs *without* knowing anything about their implementation, which is a key concept of modularity in Elmish applications: if you were to add more features in either modules, `Counter` or `InputText`, there would be required changes from the consumer `App` module point of view.

### Bootstrapping The Application

Finally, since we now have a single root program that composes other programs. We can set this root `App` program into motion by bootstrapping it using the `Program` module from the `Elmish` namespace:
```fsharp
Program.mkSimple App.init App.update App.render
|> Program.withReactSynchronous "elmish-app"
|> Program.run
```

### Flow of Messages

There is quite a level of indirection when composing smaller programs into bigger ones and it might give the feeling that the smaller programs kind of have their own life-cycle as a standalone program. This is of course not the case because you can see the child programs as just a bunch of smaller "helper" functions of the main and only program that is bootstrapped at the entry of the application.

Take for example what happens when you click the "Increment" button while the counter view is on screen. An `Increment` event is dispatched, but that event is of type `Counter.Msg`, not `App.Msg` that is then *wrapped* into a message of type `App.Msg` from the counter dispatcher `(CounterMsg >> dispatch)` because the Elmish dispatch loop only understands messages of the type from the top-level bootstrapped program: the `App` program.

To put in a timeline, this is what happens:
 - Button "Increment" clicked
 - `Increment` message is dispatched using the Counter dispatcher `(CounterMsg >> dispatch)`
 - `Increment` is wrapped into `CounterMsg` (top-level `Msg` type) and it called by the top-level `dispatch` function.
 - `App.update` is called with message `CounterMsg Increment`
 - `App.update` *unwraps* the `Increment` event from the `CounterMsg` by means of pattern matching and *passes it down* to `Counter.update` to compute the next state of the counter
 - The updated counter state is then used to update the `Counter` field of the state from the main program
 - Application re-renders


### Modules In Separate Files

As the final touch, we will put the Elmish modules inside different F# files to make up the application. This way, many developers can work on different files at the same time and it keeps the project neat and tidy. Of course, order matters in F# projects, so you have to put parent modules *after* the child modules so that the parent modules can reference the types and functions from the child programs.

In this example, we have three modules that contain Elmish programs: `Counter`, `InputText` and `App`.

I haven't mentioned it, but I have used a helper value called `divider`:
```fsharp
let divider =
  Html.div [
    prop.style [ style.margin 10 ]
  ]
```
This value is used both in `InputText` and `App` so I will put it inside a `Common` module that is present *before* the modules that reference it. Finally, there will be a `Main` module that bootstraps the application by referencing the top-level program definition from `App`.

The files end up in the following order:
```
Project
  | -- Common.fs
  | -- Counter.fs
  | -- InputText.fs
  | -- App.fs
  | -- Main.fs
```

You can the source code of the finished result in the repository [Zaid-Ajaj/multiple-simple-programs-finished](https://github.com/Zaid-Ajaj/multiple-simple-programs-finished). Take a second and compare it with the project structure we started with in [Zaid-Ajaj/multiple-simple-programs](https://github.com/Zaid-Ajaj/multiple-simple-programs).

That's it for this section, next up we look into integrating commands while wiring up child programs with parent ones.
