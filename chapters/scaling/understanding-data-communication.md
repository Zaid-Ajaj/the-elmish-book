# Understanding Data Communication

What happens within a child program is often of interest for other child programs to know about. Sometimes it is even necessary to communicate information that was gathered in one child program to another. Since child programs do not know about the existence of their siblings (nor they should know because that is not of their concern), relaying information from one child program to another goes through the parent program before it is passed down to other children. Here, the parent program acts as a proxy because of the order in which the messages are handled: first the child program dispatches an event which is wrapped into a parent message type before it gets unwrapped back and processed by the `update` function of that child program. Review section [Flow of Messages](splitting-programs.md#flow-of-messages) for a refresher to understand why that is the case.

Since all events of child programs has to go through the parent, the parent program can decide whether to just pass down these events to the child programs for further processing or it can initiate different events in other child programs after initializing them. To better understand what I am talking about, let us go through an example.

Consider the following application that for now only consists of a Login page as you can see below. After logging in, the result of the login attempt is shown below the Login button where it will be a successful attempt when the username and password are both "admin". Using other credentials will fail to login and an error "Username or password is incorrect" is shown on screen.

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/admin-login.gif" />
  </div>
</div>

The end goal of this example is that after a successful login attempt, the user is redirected to the home page where the username is shown in big bold letters. This means that we have to introduce a new page called Home and have some way of taking the result of the login operation and sharing it with the Home page. Once the Home page is active, we want the user to be able to "log out" in which case the application will reset back to the Login page. Take a second to think about how this would work and how the information would have to flow from the Login page to the Home page.

You can find the source code of the initial repository in [Zaid-Ajaj/login-sample-initial](https://github.com/Zaid-Ajaj/login-sample-initial.git), clone it locally and follow along with the section.

The repository consists of an Elmish application, some extension functions and an `Api` module that contains shared types and a dummy asynchronous `login` function. Here are the files of the repository:

```bash
 src
  │ -- Api.fs # dummy API module
  | -- Extensions.fs # extension functions
  | -- Login.fs # Login child program
  │ -- App.fs # App parent and root program
  │ -- Main.fs # Entry point of the application
```
This `Api` module is a mock of a back-end. The functions in there will just wait for a bit to simulate network latency then come back with hardcoded results. We have the Login page implemented as a child program of the root program called App. This App module isn't doing anything interesting at this point, only receiving events and passing them right back at the Login. The state of Login is integrated into App using [State-Field composition](composition-forms#state-field-composition) where Login is only child in this program:
```fsharp
type State =
  { Login: Login.State }

type Msg =
    | LoginMsg of Login.Msg

let init() =
    let loginState, loginCmd = Login.init()
    { Login = loginState }, Cmd.map LoginMsg loginCmd

let update (msg: Msg) (state: State) =
    match msg with
    | LoginMsg loginMsg ->
        let loginState, loginCmd = Login.update loginMsg state.Login
        { state with Login = loginState }, Cmd.map LoginMsg loginCmd

let render (state: State) (dispatch: Msg -> unit) =
  Login.render state.Login (LoginMsg >> dispatch)
```
Since we will be introducing a Home page into this App module, we will turn to using [Discriminated Union composition](composition-forms#discriminated-union-composition) very soon. For now, let us discuss the Login and Api modules. Login is a simple page which collects the the username and password using form inputs. When you click the "Login" button, the function `Api.login` is called which takes a username and password input, then after a short delay, returns you a `LoginResult`. This is a type that describes the possible outcomes of a login attempt. The entire `Api` module is implemented as follows:
```fsharp
[<RequireQualifiedAccess>]
module Api

type AccessToken = AccessToken of string

type User =
    { Username : string
      AccessToken : AccessToken }

type LoginResult =
    | UsernameOrPasswordIncorrect
    | LoggedIn of User

let login (username: string) (password: string) =
    async {
        do! Async.Sleep 1500
        if username = "admin" && password = "admin" then
            let accessToken = System.Guid.NewGuid().ToString()
            return LoggedIn { Username = username; AccessToken = AccessToken accessToken }
        else
            return UsernameOrPasswordIncorrect
    }
```
This `LoginResult` type can either give you `UsernameOrPasswordIncorrect` if you happen to give it the wrong credentials (anything other than "admin") or it can give you a `LoggedIn of User` where `User` contains information about the use who logged in. Currently, this `User` type has only the username and an *access token*. In real world single page applications, it is common that authenticated users receive an access token after a successful login attempt. Using this token, they can issue subsequent requests to the back-end by which they are identified and authorized. Access tokens usually do not contain sensitive information and often expire after a couple of hours. During a session, a single page application keeps track of the token from the currently logged in user because it needs this token to issue requests and ask for data about that user.

Enough with the little detour of security management, what we care about now is that after we get a `User` instance from logging in, we can track the currently logged in user and share his or her information across the pages of the application so that these pages can themselves issue requests to the back-end and ask for data.

The implementation of the Login page is very simple. As you would expect, the `State` type will keep track of username and password from the form inputs as well as the status of the login asynchronous operation:
```fsharp {highlight: [4, 9]}
type State =
    { Username: string
      Password: string
      LoginAttempt: Deferred<Api.LoginResult> }

type Msg =
    | UsernameChanged of string
    | PasswordChanged of string
    | Login of AsyncOperationStatus<Api.LoginResult>
```
What is more interesting than the credentials of the user, is that we can track the status of the login attempt in a single field called `LoginAttempt`. This way the user interface can show a spinner when the `LoginAttempt = InProgress` or show the login outcome when it is resolved:
```fsharp
let renderLoginOutcome (loginResult: Deferred<Api.LoginResult>)=
    match loginResult with
    | Resolved Api.LoginResult.UsernameOrPasswordIncorrect ->
        Html.paragraph [
            prop.style [ style.color.crimson; style.padding 10 ]
            prop.text "Username or password is incorrect"
        ]

    | Resolved (Api.LoginResult.LoggedIn user) ->
        Html.paragraph [
            prop.style [ style.color.green; style.padding 10 ]
            prop.text (sprintf "User '%s' has successfully logged in" user.Username)
        ]

    | otherwise ->
        Html.none
```
And the Login button
```fsharp
Html.div [
    prop.className "field"
    prop.children [
        Html.button [
            prop.className [
                "button is-info is-fullwidth"
                if state.LoginAttempt = InProgress
                then "is-loading"
            ]
            prop.onClick (fun _ -> dispatch (Login Started))
            prop.text "Login"
        ]
    ]
]
```
I will let you study the rest of the render function on your own, there isn't much worth noting except for the fact that we are using [Bulma](https://bulma.io) classes for styling.

### Modelling The Home Page

Once the currently logged in user lands on the Home page, he or she should see their username on that page. This means that the Home page has information about currently logged in user. Regardless of where this information comes from, it is a *requirement* for initializing the Home page: it shouldn't be possible to go the Home page without obtaining an instance of a `User` first. This can be enforced by modelling the exposed program API of Home to reflect this requirement, specifically in the `init` function of Home:
```fsharp
[<RequireQualifiedAccess>]
module Home

open Elmish

let init (user: Api.User) : State * Cmd<Msg> = (* . . . *)
```
Unlike the usual type definition of `init` that expects `unit` as input, this definition expects a `User` instance as input: the Home page cannot be initialized unless we provide it a `User` instance to proceed with processing whether it is to load more data in the initial command (using the access token of the user) or in our case just to maintain the information of that user in the state of program:
```fsharp
[<RequireQualifiedAccess>]
module Home

type State =
    { User: Api.User }

type Msg =
    | Logout

open Elmish

let init (user: Api.User) =
    { User = user }, Cmd.none
```
Finally we have a `Msg` type where the only event that can occur is a `Logout`. Let's finish with the implementation of Home since it is really simple:
```fsharp
open Elmish
open Feliz

let update (msg: Msg) (state: State) : State * Cmd<Msg> =
    match msg with
    | Logout -> state, Cmd.none

let centered (children: ReactElement list) =
    Html.div [
        prop.style [
            style.margin.auto
            style.textAlign.center
            style.padding 20
            style.width (length.percent 100)
        ]

        prop.children children
    ]

let render (state: State) (dispatch: Msg -> unit) =
    centered [
        Html.h1 [
            Html.strong (state.User.Username.ToUpper())
        ]

        Html.button [
            prop.className "button is-info"
            prop.onClick (fun _ -> dispatch Logout)
            prop.text "Logout"
        ]
    ]
```
Like I said, the username will be shown in big bold letters on the Home page, hence `Html.h1` and `Html.strong`. The most important concept to realize is that *at any given moment*, the Home page has access to a `User` instance and does not have to check whether a user was logged in or not.

The `Home` module has to be in a file that is included after `Api` in order for it to access that module but also included before `App` so that `App` can reference `Home`:
```bash {highlight: [5]}
 src
  │ -- Api.fs # dummy API module
  | -- Extensions.fs # extension functions
  | -- Login.fs # Login child program
  | -- Home.fs # Home child program
  │ -- App.fs # App parent and root program
  │ -- Main.fs # Entry point of the application
```

You might have not noticed it, but the `Logout` event isn't actually doing *anything* when it is dispatched into the `update` function. It simply returns the state as is. Although it might be the case for *this* child program of Home that it doesn't do anything, but since this event has to go through the parent App, then it might be of use. Let us look at the big picture and wire up both the Login and Home page with their parent App.

### Wiring Up The Pages

Now that we have two modules, Home and Login, each containing a child program we can wire them up using Discriminated Union composition like we did before. First we introduce a new `Page` type that captures they currently active page and use it in the `State` type of the App module.
```fsharp
[<RequireQualifiedAccess>]
type Page =
  | Login of Login.State
  | Home of Home.State

type State =
  { CurrentPage: Page }

type Msg =
    | LoginMsg of Login.Msg
    | HomeMsg of Home.Msg

let init() =
    let loginState, loginCmd = Login.init()
    { CurrentPage = Page.Login loginState }, Cmd.map LoginMsg loginCmd
```
As you can see, we are still initializing the Login page first. In fact, we can't initialize Home at this point because we have to obtain an instance of `User` first which is to be collected *at some point* from the Login page. Then we have the `render` function that renders the currently active page:
```fsharp
let render (state: State) (dispatch: Msg -> unit) =
  match state.CurrentPage with
  | Page.Login loginState -> Login.render loginState (LoginMsg >> dispatch)
  | Page.Home homeState -> Home.render homeState (HomeMsg >> dispatch)
```
We have seen this before. However, the actual interesting parts are happening in the `update` function. Initially we implement it as follows:
```fsharp
let update (msg: Msg) (state: State) =
    match msg, state.CurrentPage with
    | LoginMsg loginMsg, Page.Login loginState ->
        let (updatedLoginState, loginCmd) = Login.update loginMsg loginState
        { state with CurrentPage = Page.Login updatedLoginState }, Cmd.map LoginMsg loginCmd

    | HomeMsg homeMsg, Page.Home homeState ->
        let (updatedHomeState, homeCmd) = Home.update homeMsg homeState
        { state with CurrentPage = Page.Home updatedHomeState }, Cmd.map HomeMsg homeCmd

    | _, _ ->
        state, Cmd.none
```
This implementation is basically saying these things:
 - "Whenever you receive events from Login while the Login page is active, then process these events in Login and update the state accordingly"
 - "Whenever you receive events from Home while the Home page is active, then process these events in Home and update the state accordingly"
 - "Otherwise, do nothing at all and return the state as is"

If you were to run the application using this implementation of `update`, the user will be presented with the Login page and stay there forever! Indeed, this is because we are missing an important piece of logic here: initializing the Home page. We have to ask ourselves: "At which point should the Home page get initialized?" or in other words, "Which *events* cause the Home page to be initialized?" Well, we know exactly when that should happen. Namely, when a user has successfully logged in. Specifically when the parent App receives a `LoginMsg loginMsg` where `loginMsg` is:
```fsharp
Msg.Login (Finished (LoginResult.LoggedIn user))
```
That event is triggered from within the Login page, but it also has to go through parent like all events which means the parent can **inspect** the data from this event, extract the `User` instance from it and initialize the Home page with it. First of all, I will add an [*active pattern*](https://fsharpforfunandprofit.com/posts/convenience-active-patterns/) in the `Login` module to make it easy for the parent program to inspect that specific event:
```fsharp
// Inside of Login.fs

let (|UserLoggedIn|_|) = function
    | Msg.Login (Finished (Api.LoginResult.LoggedIn user)) -> Some user
    | _ -> None
```
Then we can use this active pattern from the parent `update` function:
```fsharp {highlight: [5,6,7]}
let update (msg: Msg) (state: State) =
    match msg, state.CurrentPage with
    | LoginMsg loginMsg, Page.Login loginState ->
        match loginMsg with
        | Login.UserLoggedIn user ->
            let homeState, homeCmd = Home.init user
            { state with CurrentPage = Page.Home homeState }, Cmd.map HomeMsg homeCmd

        | _ ->
            let loginState, loginCmd = Login.update loginMsg loginState
            { state with CurrentPage = Page.Login loginState }, Cmd.map LoginMsg loginCmd

    | HomeMsg homeMsg, Page.Home homeState ->
        let homeState, homeCmd = Home.update homeMsg homeState
        { state with CurrentPage = Page.Home homeState }, Cmd.map HomeMsg homeCmd

    | _, _ ->
        state, Cmd.none
```
Let that sink in for a moment because this pretty much the gist of data communication in Elmish apps: parent applications **inspect** and **intercept** events coming from child programs in order to initialize or trigger more events in the current program and other child programs. We effectively took the data from an event that occurred in the Login page and used it to initialize the Home page.

It is very important to understand that inspection and interception are very different: the former is only peeking into the data of the event but the latter is also preventing the child program from processing that event. In the snippet above, once the parent program has intercepted the event of a successful login attempt, it directly initializes the Home page without letting the Login page process that event. Keep this in mind because sometime you still want to the state of the child program to change or let execute side-effects in which case you only want to do inspection. More on this coming up. Now let us see the results of the application:

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/admin-login-works.gif" />
  </div>
</div>

Following the same logic, we can intercept the `Logout` event coming from the Home page and have the application redirect back to the Login page:
```fsharp {highlight: [15, 16]}
let update (msg: Msg) (state: State) =
    match msg, state.CurrentPage with
    | LoginMsg loginMsg, Page.Login loginState ->
        match loginMsg with
        | Login.UserLoggedIn user ->
            let homeState, homeCmd = Home.init user
            { state with CurrentPage = Page.Home homeState }, Cmd.map HomeMsg homeCmd

        | _ ->
            let loginState, loginCmd = Login.update loginMsg loginState
            { state with CurrentPage = Page.Login loginState }, Cmd.map LoginMsg loginCmd

    | HomeMsg homeMsg, Page.Home homeState ->
        match homeMsg with
        | Home.Msg.Logout ->
            init()

        | homeMsg ->
            let homeState, homeCmd = Home.update homeMsg homeState
            { state with CurrentPage = Page.Home homeState }, Cmd.map HomeMsg homeCmd

    | _, _ ->
        state, Cmd.none
```
Intercepting the `Logout` will simply reset the data to its initial state using the `init` which effectively resets the application right back into the Login page.

> Handling messages other than `Logout` from the Home page is actually redundant because there are no other types of messages and F# compiler will complain that the second pattern will never match but I will keep it nonetheless because usually there are more than one event that can occur in child programs.

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/admin-logout.gif" />
  </div>
</div>

That settles it for the end goal of our little program. You can find the source code of the finished application in the repository [Zaid-Ajaj/login-sample-finished](https://github.com/Zaid-Ajaj/login-sample-finished).

