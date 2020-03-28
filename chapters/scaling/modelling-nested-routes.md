# Modelling Nested Routes

In section [Splitting Programs](splitting-programs), we leant how to model nested pages from child programs into a page type in the parent program and compose it correctly without having the parent know about the implementation details of the specific child program. We can do the same thing when it comes nested URL routes. Suppose we are building an application where we need a couple of pages to view, create or edit a certain user. We also need a page to view all users. Here we have two pages that are known from the root program. Assuming `Users` and `User` are child programs of the root `App` program. We can define the `Url` for the root program to be *independent* of those from the child programs. This means that `App` doesn't necessarily know about the nested URLs that child programs might be interested in.

It is a common trap to try to define the `Url` type from the parent model *before* the child program to work against the "limitations" of type inference and make the types available to both the parent program as well as the child program. This is sub-optimal because now the child programs suddenly know about the URLs of their parent program and probably other URLs about their sibling programs. There is a better way to do and it actually looks a lot the same as the state composition from child to parent.

Since we have two child programs `Users` and `User`, we want to map the URL of the application to one these programs. The `User` program however, is itself a parent program of the child programs `ShowUser`, `EditUser` and `AddUser`. The URL mapping of these programs goes as follows:
```bash
Url "/users" => Program(Users)
Url "/user/42" => Program(User => Program(ShowUser(42)))
Url "/user/42/edit" => Program(User => Program(EditUser(42)))
Url "/user/add" => Program(User => Program(AddUser))
```
From the `User` child program perspective, the `Url` type can be defined as follows:
```fsharp
// User.fs

type Url =
  | Index of userId:int
  | Edit of userId:int
  | AddUser
  | NotFound
```
Each of which, initialize the child program `ShowUser`, `EditUser` and `AddUser` respectively. However, from the parent point of view, it shouldn't know about which parts of the URL of interest to the user. Instead it can define a composite `Url` definition:

```fsharp
// App.fs
type Url =
  | Users
  | User of User.Url
```
Notice here, in the same way the `Page` references the state of the child program, the `Url` type can reference the URL of the child program. From the `User` program, we can have a function that parses `Url` definition that is the `User` is interested in:
```fsharp
// User.fs
let parseUrl = function
  // matches /{userId:int}
  | [ Route.Int userId ] -> Url.Index userId
  // matches /edit/{userId:int}
  | [ "edit"; Route.Int userId ] -> Url.Edit userId
  // matches /add
  | [ "add" ] -> Url.AddUser
  // matches anything else
  | _ -> Url.NotFound
```
Then from the parent program, we can compose the bigger `Url` type from the smaller ones:
```fsharp {highlight: [10]}
// App.fs

type Url =
  | Users
  | User of User.Url
  | NotFound

let parseUrl = function
  // matches /users
  | [ "users" ] -> Url.Users
  // matches /user/{User.Url}
  | "user" :: userSegments -> Url.User (User.parseUrl userSegments)
  // matches anything else
  | _ -> Url.NotFound
```
Again, because how awesome pattern matching is, we read the first segment of the URL which is the "user", then take the *rest* of the segments and give them as input for the `parseUrl` function of the child program. This way the parent program can construct the child URL using the implementation defined by that program itself.

### Passing Urls To Child Programs

Every time the URL changes, we can propagate that information easily to child programs after it gets parsed from the root program, this way the child programs can decide how to react to the changes and which commands they should execute without having the root program make that decision for them. First of all, when a child program has nested URLs, it should take that URL as input in the `init` function and the parent has to propagate it when it is initialized
```fsharp {highlight: ['10-13']}
// User.fs
let init (currentUrl: Url) =
  { CurrentUrl = currentUrl }

// App.fs
let init() =
  let currentUrl = parseUrl(Router.currentUrl())
  match currentUrl with
  | Url.User userUrl ->
      let (userState, userCmd) = User.init userUrl
      { state with
          CurrentUrl = currentUrl
          CurrentPage = Page.User userState }, Cmd.map UserMsg userCmd

  | Url.Users ->
      let (usersState, usersCmd) = Users.init()
      { state with
          CurrentUrl = currentUrl
          CurrentPage = Page.Users usersState }, Cmd.map UsersMsg usersCmd

  | NotFound ->
      { state with
          CurrentUrl = currentUrl
          CurrentPage = Page.NotFound }
```
As for the `update` function, we can do some interesting stuff. When the URL changes it triggers a message from the root program. Depending on the child program that is currently active, the root program can decide whether to **re-initialize** the active page from its `init` function when the URL is pointing to that *same* active page, or it can trigger `UrlChanged` event (child message type) in that active page's program using it's parsed URL and have that page decide how it should update itself. The latter approach is ideal because usually we don't want the active page to lose its state from re-initialization. This means when the root program receives a `UrlChanged` event, it has to compare the changed URL against the active page and decide how to do the propagation.

The great thing about this, is that *we* have control over which parts should be updated and which shouldn't. Many frameworks out there will make the decision for the developers but I believe this is really a decision to be made from the application code, not the libraries. That is why `Feliz.Router` makes no assumptions about how you choose to process URL changes and only helps you with parsing the URL segments in a simple manner, the rest is up to you.