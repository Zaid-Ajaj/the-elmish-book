# Multi-Page Routing

Previously on [Understanding Data Communication](understanding-data-communication), we looked at implementing a multi-page application we had two pages: a login page where only an admin user can login, at which point the application switches the page to the home page where information about that user is presented.

<div style="width:100%">
  <div style="margin: 0 auto; width:50%;">
    <resolved-image source="/images/scaling/admin-logout.gif" />
  </div>
</div>

In this section, we will step it up a notch by taking the example above and introducing URL routing between the pages. This means, not only information is flowing from one page to another, but also the application as a whole can switch pages from URL changes and propagate the information necessary for the initialization of another page. This time, the requirements will reflect those of a real-world application as follows:
 1. The application starts at the *Home* page where it shows a generic message to greet anonymous users such as "Hello, guest". This page is at the root `/` URL.
 2. The Home page has a link that navigates to the *Login* page where an admin can login, just like in the example above. This page is at the `/login` URL.
 3. Once a user has logged in, they are redirected back to the landing page at the root `/` URL where the greeting message now refers to the username of that user who logged in. I.e. `"Hello, {username}"`.
 4. Once a user has logged in, the Home page no longer shows the link to the login page, instead it shows a link to logout which resets the application back to the Home page.
 5. Once a user has logged in and is now on the Home page, they can see a link that navigates to the `/overview` URL. This URL points to the *Overview* page where information about the currently logged in user is shown.
 6. An anonymous user of the application who hasn't logged in, isn't allowed to view the overview page if they manually change the URL to point to `/overview`. Instead, the user is redirected to the Login page immediately.

> In the initial sample, the Home page is a child program of the App root program. Here, we will have the Home page be the root program of the application.

### Page Accessibility With Respect To Users

The first thing we have to think about when it comes to applications that involve some users logging in, is determining which pages are secured that require users to be logged in, which pages don't (i.e. allow anonymous users) and which pages allow both.

The requirements (1) and (3) tell us that the Home should be available for both anonymous and logged in users, showing different information and different UI elements in each case. Requirement (6) shows that the Overview page is only accessible after a user has successfully logged in.

What about the Login page, though? Of course, anonymous users should always be allowed to view the Login. However, once they logged in, should they be allowed to go to the login page again (if they happen to manually change the URL in the address bar)? There are a couple of options. First of all, you can simply not allow logged in users to go to the Login page and instead redirect them immediately to the Home page. Another option is to let them login again, in which case the user of the application is replaced with that last user who logged in. I think both options are fine, for our sample application, we will just allow everyone to view the Login page since that still adheres to the requirements above. In summary, we have three pages:
```fsharp
        Route "/"
    (anonymous or logged-in)
             Home
              |
              |
      ------------------
      |                |
Route "/overview"    Route "/login"
 (logged-in)       (anonymous or logged-in)
  Overview             Login
```
### Modelling The State

To start off with the Home page, since it has to show different UI elements based on whether a user has logged in or not, it has to keep track of the state of the application user. Since I am re-using the `Api` module from the initial sample, I can model an anonymous user and a logged in user simply as `Option<Api.User>`. However, for the sake of better semantics I will define a custom discriminated union, similar to the shape of `Option` that represents a user of the application:
```fsharp
type ApplicationUser =
    | Anonymous
    | LoggedIn of Api.User
```
This is the first thing that the Home page keeps track of. Since this page is also the root page, it will keep track of the current URL and the currently active child page.

```fsharp
[<RequireQualifiedAccess>]
module Home

type ApplicationUser =
    | Anonymous
    | LoggedIn of Api.User

[<RequireQualifiedAccess>]
type Url =
    | Index
    | Login
    | Overview
    | NotFound
    | Logout

[<RequireQualifiedAccess>]
type Page =
    | Index
    | NotFound
    | Login of Login.State
    | Overview of Overview.State

type State =
    { User : ApplicationUser
      CurrentUrl  : Url
      CurrentPage : Page }
```
Here, the `Page.Index` and `Url.Index` both refer to the Home page itself. Another curious case of URL is the `Logout` case. We are implementing it here such that if the application navigated to the `/logout` URL, then the user of the application will be reset back to `Anonymous`. Of course, I could have implemented a specialized case in the `Msg` called `Logout` but I want to follow a simple rule for consistency: Page changes are always driven by URL changes. This includes logging out.

We are also assuming we have two pages, `Login` and `Overview` implemented as child programs of `Home` in their respective modules. The implementation of `Login` will be exactly the same as the one from the initial sample. As for the `Overview` module, it is a simple page that shows the username of the currently logged in user (requires a user for initialization). We will not be focussing a lot on the `Login` and `Overview` modules because the interesting stuff are happening in the parent `Home` that is managing which page to show based on the URL and how to propagate the information based on whether or not a user has logged in.

As for the `Msg` type, it can be modelled as follows in order to be able to handle messages from the child programs as well as react to URL changes:
```fsharp
type Msg =
    | LoginMsg of Login.Msg
    | OverviewMsg of Overview.Msg
    | UrlChanged of Url
```
Now that we have modelled the types, we can start implementing the `Home` parent program.
### Implementing `init()`
It might be tempting to simply always initialize the Home page with the default values of the state:
```fsharp
let init() =
    { User = Anonymous;
      CurrentUrl = Url.Index;
      CurrentPage = Page.Index; }, Cmd.none
```
However, this approach is **incorrect** because the initialization of the root program *depends* on which URL the application starts with. This means we have to parse the *initial* URL first and then decide which page we can or cannot land on:
```fsharp {highlight: [24, 25]}
let parseUrl = function
  | [ ] -> Url.Index
  | [ "login" ] -> Url.Login
  | [ "overview" ] -> Url.Overview
  | [ "logout" ] -> Url.Logout
  | _ -> Url.NotFound

let init() =
    let initialUrl = parseUrl (Router.currentUrl())
    let defaultState =
        { User = Anonymous
          CurrentUrl = initialUrl
          CurrentPage = Page.Index }

    match initialUrl with
    | Url.Index ->
        defaultState, Cmd.none

    | Url.Login ->
        let loginState, loginCmd = Login.init()
        let nextPage = Page.Login loginState
        { defaultState with CurrentPage = nextPage }, Cmd.map LoginMsg loginCmd

    | Url.Overview ->
        defaultState, Router.navigate("login", HistoryMode.ReplaceState)

    | Url.Logout ->
        defaultState, Router.navigate("/", HistoryMode.ReplaceState)

    | Url.NotFound ->
        { defaultState with CurrentPage = Page.NotFound }, Cmd.none
```
The highlighted line shows how requirement (6) can be enforced. Once the application starts up, we know for sure that the `User = Anonymous` which means if the application happened to start with an initial URL that is pointing to the Overview page, it will immediately redirect the user to the Login page instead as a result of the `Router.navigate("login", HistoryMode.ReplaceState)` command. We use the parameter `HistoryMode.ReplaceState` so that the navigation command doesn't push a "history entry" into the browser page. If that was the case, then a user will be trapped in `/login` as every time the user hits the Back button of the browser, he or she will go back to `/overview` which is a protected page that takes you back again to `/login` and so on and so forth.


> There are cases where the user information is loaded from the [Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) after a previous login attempt when the application is re-initialized after a full refresh. This way, the user wouldn't be `Anonymous` anymore and you have access to secure pages, such as the overview page in our example.

Moreover, if an end user happens to initialize the application at the `/logout` URL, we simply navigate back to the root which brings us to the `Home` page.

The same rules apply when the event `UrlChanged` is triggered. The `update` function has to account for these changes and acts upon them. Let us take a look at how to implement the `update` function with respect to URL changes.

### Implementing `update`:

Since we are using Discriminated Union Composition, we can start by handling incoming messages from child programs and propagate their results accordingly. However, something interesting is going on when the parent `Home` program inspects the events coming from `Login`; once a user has logged in, `state.User` is updated using the value of that user and the application navigates back to the root using the command `Router.navigate("/")`:
```fsharp {highlight: [5, 6]}
let update (msg: Msg) (state: State) =
    match msg, state.CurrentPage with
    | LoginMsg loginMsg, Page.Login loginState ->
        match loginMsg with
        | Login.UserLoggedIn user ->
            { state with User = LoggedIn user }, Router.navigate("/")

        | loginMsg ->
            let loginState, loginCmd = Login.update loginMsg loginState
            { state with CurrentPage = Page.Login loginState }, Cmd.map LoginMsg loginCmd

    | OverviewMsg overviewMsg, Page.Overview overviewState ->
        let overviewState, overviewCmd = Overview.update overviewMsg overviewState
        { state with CurrentPage = Page.Overview overviewState }, Cmd.map OverviewMsg overviewCmd

    | _, _ ->
        state, Cmd.none
```
This does two things. First of all, it makes the information of the logged in user available in the `Home` program and changes the URL back to the root `/`. This effectively triggers a `UrlChanged` event where the URL will be `Url.Index` (the entry page of `Home`). We haven't handled the `UrlChanged` event, so let us do that:
```fsharp {highlight: ['16-34']}
let update (msg: Msg) (state: State) =
    match msg, state.CurrentPage with
    | LoginMsg loginMsg, Page.Login loginState ->
        match loginMsg with
        | Login.UserLoggedIn user ->
            { state with User = LoggedIn user }, Router.navigate("/")

        | loginMsg ->
            let loginState, loginCmd = Login.update loginMsg loginState
            { state with CurrentPage = Page.Login loginState }, Cmd.map LoginMsg loginCmd

    | OverviewMsg overviewMsg, Page.Overview overviewState ->
        let overviewState, overviewCmd = Overview.update overviewMsg overviewState
        { state with CurrentPage = Page.Overview overviewState }, Cmd.map OverviewMsg overviewCmd

    | UrlChanged nextUrl, _ ->
        let show page = { state with CurrentPage = page; CurrentUrl = nextUrl }

        match nextUrl with
        | Url.Index -> show Page.Index, Cmd.none
        | Url.NotFound -> show Page.NotFound, Cmd.none
        | Url.Login ->
            let login, loginCmd = Login.init()
            show (Page.Login login), Cmd.map LoginMsg loginCmd

        | Url.Overview ->
            match state.User with
            | Anonymous ->  state, Router.navigate("login", HistoryMode.ReplaceState)
            | LoggedIn user ->
                let overview, overviewCmd = Overview.init user
                show (Page.Overview overview), Cmd.map OverviewMsg overviewCmd

        | Url.Logout ->
            { state with User = Anonymous }, Router.navigate("/")

    | _, _ ->
        state, Cmd.none
```
Similar to the way we handled the changed `Url` event in `init()`, we are checking the next URL that the application was navigated to (i.e. the `nextUrl` value) and decide which page we should show next based on that. However, there are two special cases, with `Url.Overview` we do not initialize the `Overview` child program unless there is indeed a logged in user, otherwise we navigate the application into the `login` page and for `Url.Logout` we reset the application and go back the root using `Router.navigate("/")`.

It is important to realize that even though we are *re-initializing* the `Overview` program by calling its `init` function, there are more things we can do. For example, we can check that if the current page is already `Page.Overview`, then we do not re-initialize it and instead trigger a message to reload a specific part of the information. This way, that page doesn't lose its state unnecessarily. Just remember that you have full control over how these child programs are initialized or updated, this is the flexibility of The Elm Architecture.

Now we can implement the final part which is the `render` function. First of all, let us implement a smaller rendering function to show the user interface of the `Home` page itself. I will call it `index` because we will call that function when `state.CurrentPage = Page.Index`

This page simply checks whether the user of the application has yet logged in or not, then proceeds to welcome the user by their username if they are logged in or welcoming an anonymous guest when a user has yet to login:
```fsharp
let index (state: State) (dispatch: Msg -> unit) =
    match state.User with
    | Anonymous ->
        Html.div [
            Html.h1 "Welcome, guest"
            Html.a [
                prop.classes [ "button"; "is-info" ]
                prop.style [ style.margin 5 ]
                prop.href (Router.format("login"))
                prop.text "Login"
            ]
        ]

    | LoggedIn user ->
        Html.div [
            Html.h1 (sprintf "Welcome, %s" user.Username)
            Html.a [
                prop.classes [ "button"; "is-info" ]
                prop.style [ style.margin 5 ]
                prop.href (Router.format("overview"))
                prop.text "Overview"
            ]
            Html.a [
                prop.classes [ "button"; "is-info" ]
                prop.style [ style.margin 5 ]
                prop.href (Router.format("logout"))
                prop.text "Logout"
            ]
        ]
```
When the user is `Anonymous`, we show a `Login` anchor element which navigates to `/login`. When a user logs in, this `Home` page will switch the current view and instead shows two buttons, one for navigating to the `Overview` page and another for logging out. See the `href` values for these anchor elements. Since we are using Bulma for styling, I am giving these links a class of `button` to make them look like buttons but they are just links actually.

Finally the root `render` function that puts the application together and sets up the router to listen for URL changes:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
    let activePage =
        match state.CurrentPage with
        | Page.Login login -> Login.render login (LoginMsg >> dispatch)
        | Page.Overview overview -> Overview.render overview (OverviewMsg >> dispatch)
        | Page.Index -> index state dispatch
        | Page.NotFound -> Html.h1 "Not Found"

    Router.router [
        Router.onUrlChanged (parseUrl >> UrlChanged >> dispatch)
        Router.application [
            Html.div [
                prop.style [ style.padding 20 ]
                prop.children [ activePage ]
            ]
        ]
    ]
```
And with that, we finish up our last sample application of this chapter. A lot of large applications follow this exact structure, only with many more pages and different behaviors per page. I have demonstrated the fundamental aspects of data communication with respect to routing and hope that you will be able to adapt the techniques learnt in this chapter to suit your application's needs.

You can find the full source code of this application in the repository [Zaid-Ajaj/login-with-url-extended](https://github.com/Zaid-Ajaj/login-with-url-extended)

<div style="width:100%">
  <div style="margin: 0 auto; width:50%;">
    <resolved-image source="/images/scaling/login-with-url-extended.gif" />
  </div>
</div>
