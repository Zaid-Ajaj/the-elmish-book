# Routing And Navigation

Routing is an essential part of building single page applications. It is the main machanism for switching the currently active page for any application. The idea revolves around a simple concept: listen to changes in the URL and react to those changes in the application. These changes can be manual when the user enters a URL in the address bar by hand or they could programmatic where the application itself changes the URL. An important characteristic of routing in single page application is that the application reacts to the changes of the URL *without* reloading the entire page. This means the application maintains its state and data as route changes which is great because you can pass data around pages as the URL changes but it also imposes a challenge for many front-end applications which is how you could reinitialize the application state only from data available in the URL if the user were to paste a URL they used before in the address bar.

### Listening For URL Changes

In Elmish terms, when we say "listening for URL changes" we really mean that there is an *event* that occurs in the program to which the application Reacts that effectively switches the currently active page on screen. Consider the following `Msg` type:
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
The only piece missing from the application above is the actual "listening to URL changes" part. The implementation for the listening for URL changes is best left out for a third-party library that knows best how to with URLs, parse them correctly and provide with utilities managing the history API: introducing [Feliz.Router](https://github.com/Zaid-Ajaj/Feliz.Router), a specialized library for Routing in Elmish applications that is both very powerful to use and really simple to work with, written by yours truely as an essential part of the Feliz ecosystem.

### Using `Feliz.Router`

Let us take the snippet above and actually turn it into a working sample with `Feliz.Router`. Start off from [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started) repository, clone it locally and install `Feliz.Router` into it:
```bash
git clone https://github.com/Zaid-Ajaj/elmish-getting-started.git
cd elmish-getting-started
cd src
dotnet add package Feliz.Router
```
After you have installed it, we can start implementing the snippet above. `Feliz.Router` chooses to work with the URL *segments*, not the entire raw URL. It might be not obvious at first but it makes parsing the individual parts really easy. The package parses a URL into segments which are represented by a list of strings:
```bash
Url "/" -> Segments [ ]
Url "/about" -> Segments [ "about" ]
Url "/user/42" -> Segments [ "user"; "42" ]
Url "/contact/location" -> Segments [ "contact"; "location" ]
Url "/overview/sales/summary" -> Segments [ "overview"; "sales"; "summary" ]

# etc.
```
First of all, we start with the `State` and `Msg`:
```fsharp
type State =
  { CurrentUrl: string list }

type Msg =
  | UrlChanged of string list
```
We will use `string list` because that is what `Feliz.Router` provides as it listens for URL changes. Next we implement `init` and `update`:
```fsharp
open Feliz.Router

let init() = { CurrentUrl = Router.currentUrl() }

let update (msg: Msg) (state: State): State =
  match msg with
  | UrlChanged url -> { state with CurrentUrl = url }
```
Within the `Feliz.Router` namespace, we primarily use two modules:
 - `Router` which contains functions to work with and listen to URLs.
 - `Route` which contains active patterns to parse URL segments easily.

The first function to use from the `Router` module is the `currentUrl()` which parses the URL of the page that the application has landed on into URL segments. The parsed segments will be the initial value for the `CurrentUrl`.

Much more interesting is what is happening in the `render` function. Here we will use the `router` function from the `Router` module and use it as if it was a UI element:
```fsharp {highlight: ['12-15']}
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
    Router.application [ activePage ]
  ]
```
Here we are using a special kind of UI element: `router`. It is a function that takes router properties and returns `ReactElement` which allows you to use it right in your `render` functions. The most important property of this element is the `Router.onUrlChanged` which is en event handler that is triggered when the URL changes. This event handler expects an input function of type `string list -> unit` where the `string list` represents the segments of the new URL that was changed. We end up with the following sample application, see source code in [Zaid-Ajaj/elmish-routing](https://github.com/Zaid-Ajaj/elmish-routing):

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/initial-routing.gif" />
  </div>
</div>

When I am changing the URL in the address bar by hand, I am using the hash sign (`#`) in front of the path. This sign instructs the browser to only *replace* the URL without fully reloading the entire page while still being compatible with the history mechanism of the browser: the back button still works as expected from the user's point of view without having to reload the entire application.

### Navigation Using Links

The most common way to navigate to different URLs is using anchor elements with `Html.a` and setting their `href` attribute to the desired destination. However, since this is a single page application, the routes have to be *formatted* to properly include the hash sign, for that we use the `Router.format` function which is overloaded function that takes in the segments of the URL you wish to construct and it formats it correctly for you. Here is an example that extends the sample application with links to navigate from one page to another:
```fsharp {highlight: ['12-16', '18-22']}
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
      Html.a [
        prop.text "About"
        prop.href (Router.format "about")
        prop.style [ style.margin 5 ]
      ]

      Html.a [
        prop.text "Contact"
        prop.href (Router.format "contact")
        prop.style [ style.margin 5 ]
      ]

      activePage
    ]
  ]
```

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/initial-routing-with-links.gif" />
  </div>
</div>

Notice how the router is able to handle edge cases in the path was formatted with hash sign: whether it is `#about` or `#/about` doesn't matter, the string segments are always nice and clean. Another feature of the router is that it automatically decodes segments that were URL encoded: `Url #/search/Hello%20World` becomes `Segments [ "search"; "Hello World" ]`.