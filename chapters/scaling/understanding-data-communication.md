# Understanding Data Communication

What happens within a child program is often of interest for other child programs to know about. Sometimes it is even necessary to communicate information that was gathered in one child program to another. Since child programs do not know about the existence of their siblings (nor they should know because that is not of their concern), relaying information from one child program to another goes through the parent program before it is passed down to other children. Here, the parent program acts as a proxy because of the order in which the messages are handled: first the child program dispatches an event which is wrapped into a parent message type before it gets unwrapped back and processed by the `update` function of that child program. Review section [Flow of Messages](splitting-programs.md#flow-of-messages) for a refresher to understand why that is the case.

Since all events of child programs has to go through the parent, the parent program can decide whether to just pass down these events to the child programs for further processing or it can initiate different events in other child programs after initializing them. To better understand what I am talking about, let us go through an example.

Consider the following application that for now only consists of a Login page as you can see below. After logging in, the result of the login attempt is shown below the Login button where it will be a succesful attempt when the username and password are both "admin". Using other credentials will fail to login and an error "Username or password is incorrect" is shown on screen.

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/admin-login.gif" />
  </div>
</div>

The end goal of this example is that after a succesful login attempt, the user is redirect to the home page where the username is shown in big bold letters. This means that we have to introduce a new page called Home and have some way of taking the result of the login operation and sharing it with the Home page. Take a second to think about how this would work and how the information would have to flow from the Login page to the Home page.

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
This `LoginResult` type can either give you `UsernameOrPasswordIncorrect` if you happen to give it the wrong credentials (anything other than "admin") or it can give you a `LoggedIn of User` where `User` contains information about the use who logged in. Currently, this `User` type has only the username and an *access token*. In real world single page applications, it is common that authenticated users receive an access token after a succesful login attempt. Using this token, they can issue subsequent requests to the back-end by which they are identified and authorized. Access tokens usually do not contain sensitive information and often expire after a couple of hours. During a session, a single page application keeps track of the token from the currently logged in user because it needs this token to issue requests and ask for data about that user.

Enough with the little detour of security management, what we care about now is that after we get a `User` instance from logging in, we can track the currently logged in user and share his or her information across the pages of the application so that these pages can themselves issue requests to the back-end and ask for data.

The implementation of the Login page is very simple. As you would expect, the `State` type will keep track of username and password from the form inputs as well as the status of the login asynchronous operation:
```fsharp {highlight: [4, 9]}
type State =
    { Username: string
      Password: string
      Login: Deferred<Api.LoginResult> }

type Msg =
    | UsernameChanged of string
    | PasswordChanged of string
    | Login of AsyncOperationStatus<Api.LoginResult>
```
What is more interesting than the credentials of the user, is that we can track the status of the login attempt in a single field called `Login`. This way the user interface can show a spinner when the `Login = InProgress` or show the login outcome when it is resolved:
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
            prop.text (sprintf "User '%s' has succesfully logged in" user.Username)
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
                if state.Login = InProgress
                then "is-loading"
            ]
            prop.onClick (fun _ -> dispatch (Login Started))
            prop.text "Login"
        ]
    ]
]
```
I will let you study the rest of the render function on your own, there isn't much worth noting except for the fact that we are sing Bulmma classes for stying.

### Modelling The Home Page

