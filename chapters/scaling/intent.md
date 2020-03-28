# The Intent Pattern

In the previous section when we were [wiring up the pages](understanding-data-communication#wiring-up-the-pages) with the `App` module, we talked about how the parent program can *inspect* and *intercept* events coming from child programs. Here, the parent program has two options:
- Intercept the event without propagating it further down to child programs.
- Inspect the event and propagate it to the child program for further processing.

The App program intercepted the event from the Login page when a user has successfully logged in and decided not to propagate that event further down to the Login program. It makes to do so because we switched the currently active page to Home when that event occurred so there is no point from having Login process the event any further. We can take this as a high-level guideline: when intercepting events from child programs, we do not have to propagate these events down if we are switching the currently active page.

Although this makes sense from the parent program perspective, it feels weird from the child program point of view where it expects that the events will be processed no matter which event that is.

It might also lead to bugs where a programmer is staring at the `update` function of a child program for an hour wondering why an event isn't being processed, only to realize that the event was being intercepted from a parent program when it should have only been inspected and propagated down further. This is a typical case where a bug is introduced due to miscommunication: it was not the **intention** of the child program to have one of its events being intercepted.

### The `Intent` Type

The best way to communicate intensions of certain parts of the application is to encode them using the type system and have the compiler help us figure out from the parent program point of view what we should inspect and what we should intercept: enter the `Intent` type.

> The `Intent` type is also known as `ExternalMsg`.

Along with `State` and `Msg` that each child program has, there is a new ingredient that can be added to the mix called `Intent`. This type is just like `Msg` in the sense that it describes events that can occur within a single program but instead of being processed by the the child program itself, it is specifically meant to communicate events that the parent program has to process and act upon.

In the previous example, we used an active pattern called `UserLoggedIn` from the `Login` module to check whether a user has logged in and switch the application to the Home page if that was the case. This `UserLoggedIn` is a great candidate as an event to be included in a specialized `Intent` type from the `Login` module:
```fsharp
// Inside of Login.fs

[<RequireQualifiedAccess>]
type Intent =
    | UserLoggedIn of Api.User
    | DoNothing
```
We also add another case of `Intent.DoNothing` which means that the parent program shouldn't take further action other than propagating the events as is. Then we can can extend the definition of the `update` function and have return the intent as part of its return values:
```fsharp {highlight: [19, 20, 21]}
let update (msg: Msg) (state: State) =
    match msg with
    | UsernameChanged username ->
        { state with Username = username  }, Cmd.none, DoNothing

    | PasswordChanged password ->
        { state with Password = password }, Cmd.none, DoNothing

    | Login Started ->
        let nextState = { state with LoginAttempt = InProgress }
        let login = async {
            let! loginResult = Api.login state.Username state.Password
            return Login (Finished loginResult)
        }

        let nextCmd = Cmd.fromAsync login
        nextState, nextCmd, DoNothing

    | Login (Finished (Api.LoggedIn user)) ->
        let nextState = { state with LoginAttempt = Resolved (Api.LoginResult.LoggedIn user) }
        nextState, Cmd.none, UserLoggedIn user

    | Login (Finished loginResult) ->
        let nextState = { state with LoginAttempt = Resolved loginResult }
        nextState, Cmd.none, DoNothing
```
The `update` function now has been extended to the following type:
```fsharp
val update : Msg -> State -> State * Cmd<Msg> * Intent
```
The returned state and command are of interest for this child program of Login but the intent is something the parent program App needs to work with. Since the API changed of Login, we have to change the way the App module calls Login:
```fsharp {highlight: ['6-13']}
// Inside App.fs

let update (msg: Msg) (state: State) =
    match msg, state.CurrentPage with
    | LoginMsg loginMsg, Page.Login loginState ->
        let loginState, loginCmd, intent = Login.update loginMsg loginState
        match intent with
        | Login.Intent.DoNothing ->
            { state with CurrentPage = Page.Login loginState }, Cmd.map LoginMsg loginCmd

        | Login.Intent.UserLoggedIn user ->
            let homeState, homeCmd = Home.init user
            { state with CurrentPage = Page.Home homeState }, Cmd.map HomeMsg homeCmd

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
This way, the parent program does not have to guess whether it should propagate an event to a child program or not. Simply *always* propagate the event but match against the `Intent` of the program to see if there is any event that can be of interest for the parent and sibling programs.

### Keep Things Simple

Introducing the `Intent` type might increase the robustness of your application but it also complicates the API quite a bit. Do not introduce this type when there is no need for it and try to keep your definitions as simple as possible. I know this applies to many areas of Elmish application but especially with composing larger applications, you might fall in the trap of trying to build the perfect and most consistent API where a simple part of your application becomes a "perfect mess" no one of team wants to touch any more.