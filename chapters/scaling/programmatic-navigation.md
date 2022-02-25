# Programmatic Navigation

Using anchor tags with `Html.a` elements is not the only way to navigate from one page to another. In fact, most of the times you want to navigate to another page as a result of an *event* using commands. Take the example where you want to navigate from the login page to the home page after a successful login attempt. This type of navigation only kicks into play after a login operation finishes running, rather than an immediate click of a link on the page. The `Feliz.Router` package provides a handy overloaded function called `navigate` from the `Cmd` module which returns a command that programmatically changes the current URL of the page. This in turn causes the `onUrlChanged` event to trigger once more and the rest of the application to react to that change.

Let us take an example by navigating to pages as a result of an event. First of all we will introduce two messages, each of which cause the application to navigate to a different page:
```fsharp {highlight: [6, 7]}
type State =
  { CurrentUrl: string list }

type Msg =
  | UrlChanged of string list
  | NavigateToContact
  | NavigateToAbout

let init() = { CurrentUrl = Router.currentUrl() }, Cmd.none
```
Then from the `update` function have these messages trigger the `navigate` command, simple as that:
```fsharp {highlight: [4, 5]}
let update (msg: Msg) (state: State) =
  match msg with
  | UrlChanged url -> { state with CurrentUrl = url }, Cmd.none
  | NavigateToContact ->  state, Cmd.navigate("contact")
  | NavigateToAbout -> state, Cmd.navigate("about")
```
The `Cmd.navigate` function can be called the same way as `Router.format`. It takes route segments as input and optionally it can take query string parameters as the last argument:
 - `Cmd.navigate("segment1", "segment2", "segment3")` => `/segment1/segment2/segment3`
 - `Cmd.navigate("user", [ "userId", 42 ])` => `/user?userId=42`
 - `Cmd.navigate("albums", [ "search", "tayler swift" ])` => `/albums?search=tayler%20swift`

Finally, we need to trigger these events somehow. A couple of buttons with click events from the user interface will do:
```fsharp {highlight: ['13-17', '19-23']}
let render (state: State) (dispatch: Msg -> unit) =
  let activePage =
    match state.CurrentUrl with
    | [ ] -> Html.h1 "Home"
    | [ "about" ] -> Html.h1 "About"
    | [ "contact" ] -> Html.h1 "Contact"
    | _ -> Html.h1 "Not Found"

  React.router [
    router.onUrlChanged (UrlChanged >> dispatch)
    router.children [

      Html.button [
        prop.text "Contact"
        prop.onClick (fun _ -> dispatch NavigateToContact)
        prop.style [ style.margin 5 ]
      ]

      Html.button [
        prop.text "About"
        prop.onClick (fun _ -> dispatch NavigateToAbout)
        prop.style [ style.margin 5 ]
      ]

      activePage
    ]
  ]
```

The result end up like this:

<div style="margin-top: 40px; margin-bottom:40px; width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/scaling/programmatic-navigation.gif" />
  </div>
</div>
