# Introducing Url type

Instead of matching against the current URL in its primitive form, we can turn it into a nice type that represents the different pages that a program can navigate to. Let us call that type simply `Url`:
```fsharp
[<RequireQualifiedAccess>]
type Url =
  | Index
  | About
  | Contact
  | User of userId:int
  | NotFound
```
The `Index` case is when the program lands in the root URL of `/`. We write a function which turns URL segments into this type:
```fsharp
let parseUrl = function
    | [ ] -> Url.Index
    | [ "about" ] -> Url.About
    | [ "contact" ] -> Url.Contact
    | [ "user"; Route.Int userId ] -> Url.User userId
    | [ "user"; Route.Query [ "id", Route.Int userId ] ] -> Url.User userId
    | _ -> Url.NotFound
```
Then we can use this type in the program and call `parseUrl` when necessary:
```fsharp {highlight: [8, 20]}
type State =
  { CurrentUrl: Url }

type Msg =
  | UrlChanged of Url

let init() =
  { CurrentUrl = parseUrl(Router.currentUrl()) }

let render (state: State) (dispatch: Msg -> unit) =
  let activePage =
    match state.CurrentUrl with
    | Url.Index -> Html.h1 "Home"
    | Url.About -> Html.h1 "About"
    | Url.Contact -> Html.h1 "Contact"
    | Url.User userId -> Html.h1 (sprintf "UserId: %d" userId)
    | Url.NotFound -> Html.h1 "Not Found"

  Router.router [
    Router.onUrlChanged (parseUrl >> UrlChanged >> dispatch)
    Router.application [ activePage ]
  ]
```
Now this is a much cleaner solution. However, it is very important to understand how the `Url` correlates to the `Page` type. I have seen frameworks that to model both in one type and make a mess out of it. The `Url` is not to be mapped one-to-one into a `Page` instance, but rather it should contain enough information for the **initialization** of a `Page`. Suppose I have the following types:
```fsharp
type Page =
  | User of User.State

type Url =
  | User of userId:int
```
Then I would assume that `User.init` has input of `int` that can be retrieved from the URL and properly re-initialized in case of a full refresh of the application.

The exception to this rule is if `User.init` required more information that must be obtained during the runtime of the application such as the currently logged in user. This cannot be obtained from the URL unless the user has logged in first in order to be able to navigate to a certain users page. These are called *secure* pages and will look at an example in the section [Routing With Login](routing-with-login).
