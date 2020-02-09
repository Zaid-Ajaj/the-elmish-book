# Multi-Page Routing

Previously on [Understanding Data Communication](understanding-data-communication), we looked at implementing a multi-page application we had two pages: a login page where only an admin user can login, at which point the application switches the page to the home page where information about that user is presented.

<div style="width:100%">
  <div style="margin: 0 auto; width:50%;">
    <resolved-image source="/images/scaling/admin-logout.gif" />
  </div>
</div>

In this section, we will step it up a notch by taking the example above and introducing URL routing between the pages. This means, not only information is flowing from one page to another, but also the application as a whole can switch pages from URL changes and propagete the information necessary for the initialization of another page. This time, the requiements will reflect those of a real-world application as follows:
 1. The application starts at the *Home* page where it shows a generic message to greet anonymous users such as "Hello, guest". This page is at the root `/` URL.
 2. The Home page has a link that navigates to the *Login* page where an admin can login, just like in the example above. This page is at the `/login` URL.
 3. Once a user has logged in, they are redirected back to the landing page at the root `/` URL where the greeting message now refers to the username of that user who logged in. I.e. `"Hello, {username}"`.
 4. Once a user has logged in, the Home page no longer shows the link to the login page, instead it shows a link to logout which resets the application back to the Home page.
 5. Once a user has logged in and is now on the Home page, they can see a link that navigates to URL `/overview`. This URL points to the *Overview* page where information about the currently logged in user is shown.
 6. An anonymous user of the application who hasn't logged in, isn't allowed to view the overview page if they manually change the URL to point to `/overview`. Instead, the user is redirected to the Login page immediately.

> In the initial sample, the Home page is a child program of the App root program. Here, we will have the Home page be the root program of the application.

### Page Accessibility With Respect To Users

The first thing we have to think about when it comes to applications that involve some users logging in, is detemining which pages are secured that require users to be logged in, which pages don't (i.e. allow anonymous users) and which pages allow both.

The requirements (1) and (3) tell us that the Home should be available for both anonymous and logged in users, showing different information and different UI elements in each case. Requirement (6) shows that the Overview page is only accessible after a user has succesfully logged in.

What about the Login page, though? Of course, anonymous users should always be allowed to view the Login. However, once they logged in, should they be allowed to go to the login page again (if they happen to manually change the URL in the address bar)? There are a couple of options. First of all, you can simply not allow logged in users to go the Login page and instead redirect them immediately to the Home page. Another option is let them login again, in which case the user of the application is replaced with that last user who logged in. I think both options are fine, for our sample application, we will just allow everyone to view the Login page since that still adheres to the requirements above. In summary, we have three pages:
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

To start off with the Home page, since it has to show different UI elements based on whether a has logged in or not, it has to keep track of the state of the application user. Since I am re-using the `Api` module from the initial sample, I can model an anonymous user and a logged in user simply as `Option<Api.User>`. However, for the sake of better semantics I will define a custom discriminated union, similar to the shape of `Option` that represents a user of the application:
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
Here, the `Page.Index` and `Url.Index` both refere to the Home page itself. We are also assuming we have to pages, `Login` and `Overview` implemented as child programs in their respective modules. The implementation of `Login` will be exactly the same as the one from the initial sample. As for the `Overview` module, it is a simple page that shows the username of the currently logged in user. We will not be focussing a lot on the `Login` and `Overview` modules.

As for the `Msg` type, it can be modelled as follows to be able to handle messages from the child programs as well as react to URL changes:
```fsharp
type Msg =
    | LoginMsg of Login.Msg
    | OverviewMsg of Overview.Msg
    | UrlChanged of Url
```
### Implementing `init()`
It might be tempting to simply always initialize the Home page with the default values of the state:
```fsharp
let init() =
    { User = Anonymous;
      CurrentUrl = Url.Index;
      CurrentPage = Page.Index; }, Cmd.none
```
However, this approach is incorrect because the initialization of the root program depends on which URL the application starts with. This means we have to parse the *initial* URL first and decide which page we can or cannot land on:
```fsharp {highlight: [17]}
let parseUrl = function
  | [ ] -> Url.Index
  | [ "login" ] -> Url.Login
  | [ "overview" ] -> Url.Overview
  | _ -> Url.NotFound

let init() =
    let initialUrl = parseUrl (Router.currentUrl())
    let defaultState =
        { User = Anonymous
          CurrentUrl = initialUrl
          CurrrentPage = Page.Index }

    match initialUrl with
    | Url.Index ->  defaultState, Cmd.none
    | Url.Login -> { defaultState with CurrrentPage = Page.Login }, Cmd.none
    | Url.Overview -> defaultState, Router.navigate("login")
    | Url.NotFound -> { defaultState with CurrentPage = Page.NotFound }, Cmd.none
```
The highlighted line shows how requirement (6) can be enforced. Once the application starts up, we know for sure that the `User = Anonymous` which means if the application happened to start with an initial URL that is pointing to the Overview page, it will immediately redirect the user to Login page instead as a result of the `Router.navigate("login")` command.

> There are cases where the user information is loaded from the [Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) after a previous login attempt when the application is re-initialized after a full refresh. This way, the user wouldn't be `Anonymous` anymore and you have access to secure pages, such as the overview page in our example.

