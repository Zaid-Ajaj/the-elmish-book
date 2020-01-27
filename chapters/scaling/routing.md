# Routing And Navigation

Routing is an essential part of building single page applications. It is the main machanism for switching the currently active page for any application. The idea revolves around a simple concept: listen to changes in the URL and react to those changes in the application. These changes can be manual when the user enters a URL in the address bar by hand or they could programmatic where the application itself changes the URL. An important characteristic of routing in single page application is that the application reacts to the changes of the URL *without* reloading the entire page. This means the application maintains its state and data as route changes which is great because you can pass data around pages as the URL changes but it also imposes a challenge for many front-end applications which is how you could reinitialize the application state only from data available in the URL if the user were to paste a URL they used before in the address bar.

### Listening For URL Changes

In Elmish terms, when we say "listening for URL changes" we really mean that there is an *event* that occures in the program to which the application Reacts that effectively switches the currently active page on screen. Consider the following `Msg` type:
```fsharp
type Msg =
    | UrlChanged of string
```
It is really that simple. Now to build an application that makes use of this feature you only have to maintain the URL in the state and render different UI elements based on that URL:
```fsharp
type State = { CurrentUrl : string }

type Msg =
    | UrlChanged of string

let init = { CurrentUrl = "/" }

let update msg state =
    match msg with
    | UrlChange url -> { state with CurrentUrl = url }

let render state dispatch =
    match state.CurrentUrl with
    | "/" -> Html.h1 "Home"
    | "/about" -> Html.h1 "About"
    | "/contact" -> Html.h1 "Contact"
    | _ -> Html.h1 "Not Found"
```
The only part missing from the application above is the actual "listening to URL changes" part. The implementation for the listening for URL changes is best left out for a third-party library that knows how to workaround URL subtleties and gives utilities for parsing URL parts: introducing [Feliz.Router](https://github.com/Zaid-Ajaj/Feliz.Router), a specialized library for Routing in Elmish applications that is both really simple to work with but also very flexible.

### Using `Feliz.Router`

Let us take the snippet above and actually turn it into a working sample with `Feliz.Router`. Start off from [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started) repository, clone it locally and install `Feliz.Router` into it:
```bash
git clone https://github.com/Zaid-Ajaj/elmish-getting-started.git
cd elmish-getting-started
cd src
dotnet add package Feliz.Router
```
After you have installed it, we can start implementing the snippet above. `Feliz.Router` chooses to work with the URL *segments*, not the entire raw URL. It might be obvious at first but it makes parsing the individual parts really easy. The package parses a URL when it changes into segments which are represented by a list of strings:
```bash
Url "/" -> Segments [ ]
Url "/about" -> Segments [ "about" ]
Url "/contact/location" -> Segments [ "contact"; "location" ]
Url "/user/42" -> Segments [ "users"; "42" ]
# etc.
```
First of all, we start with the `State` and `Msg`:
```fsharp
module App

open Elmish
open Elmish.React
open Feliz
open Feliz.Router

type State =
    { CurrentUrl: string list }

type Msg =
    | UrlChanged of string list
```
We will use `string list` because that is what `Feliz.Router` provides as it listens for URL changes. The implementation of `init` and `update` are trivial:
```fsharp
let init() = { CurrentUrl = [ ] }

let update (msg: Msg) (state: State): State =
  match msg with
  | UrlChanged url -> { state with CurrentUrl = url }
```
The interesting parts are happening in the `render` function where we use the `Router` module from the `Feliz.Router`:
```fsharp {highlight: [9, 10, 11, 12, 13, 14]}
open Feliz
open Feliz.Router

let render (state: State) (dispatch: Msg -> unit) =
  let activePage =
    match state.CurrentUrl with
    | [ ] -> Html.h1 "Home"
    | [ "about" ] -> Html.h1 "About"
    | [ "contact" ] -> Html.h1 "Contact"
    | _ -> Html.h1 "Not Found"

  Router.router [
    Router.onUrlChanged (UrlChanged >> dispatch)
    Router.application [
      activePage
    ]
  ]
```
Here we are using a special kind of UI element: `router`. It is a function that takes in the router properties and returns `ReactElement` which allows you to use it right in your `render` function. The most important property of this element is the `Router.onUrlChanged` which is event handler that is triggered when the URL changes. This event handler expects an inout of type `string list -> unit` where the `string list` represents the URL segments of the new URL that was changed.