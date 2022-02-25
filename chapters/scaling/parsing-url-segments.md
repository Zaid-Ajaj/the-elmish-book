# Parsing Url Segments

In the [previous section](routing), we talked about how URL segments represented by a `string list` are the primitive form that make up a URL. We can pattern match against these segments to determine which page will be shown on screen. Luckily for us, pattern matching in F# can be extended and refined to suit the form that we are matching against when the segments aren't represented just as strings but maybe integers or dates. Let us look at a couple of examples:

### Parsing Segments As Numbers

Many pages might be expecting a number in the URL segments such as `/user/42`. This URL contains two segments and it will be turned into `[ "user"; "42" ]`. We can read this numeric value of "42" dynamically and do something with it using a partial active pattern. In the `Feliz.Router` package, the module `Route` contains active patterns that can be used to pattern match against these segments. The first of which is the `Route.Int` pattern which can be used to match against a string that is parsable as an integer:
```fsharp {highlight: [7]}
let render (state: State) (dispatch: Msg -> unit) =
  let activePage =
    match state.CurrentUrl with
    | [ ] -> Html.h1 "Home"
    | [ "about" ] -> Html.h1 "About"
    | [ "contact" ] -> Html.h1 "Contact"
    | [ "user"; Route.Int userId ] -> Html.h1 (sprintf "UserId: %d" userId)
    | _ -> Html.h1 "Not Found"

  React.router [
    router.onUrlChanged (UrlChanged >> dispatch)
    router.children [ activePage ]
  ]
```
That parsed integer `userId` is made available in the scope and can be used in the render function dynamically. The `Route` module contains more patterns like the one above:
 - `Route.Number` to match against (floating) numbers
 - `Route.Int64` to match against 64-bit integers
 - `Route.Guid` to match against `Guid` values
 - `Route.Decimal` to match against decimal values
 - `Route.Bool` to match against boolean values
 - `Route.Query` to expand query string parameters into a `(string * string) list` which can be pattern matched against further.

The `Route.Query` matches against a special kind of URL segment: the query string parameters.

### Parsing Query String Parameters

URL segments can extended with query string parameters. These parameters provide more information about the route. When parsing the URL segments, `Feliz.Router` puts the query string parameters into their own segment as follows:
```fsharp
Url "/user?id=42" => Segments [ "users"; "?id=42" ]
```
The `Route.Query` active pattern can take a string like `?id=42` and turn it into a list of key-value pairs `[ "id", "42" ]`. This parameter list in turn can be pattern-matched using the more primitive patterns such as `Route.Int` and we end up with a really nice and easy API for parsing these parameters:
```fsharp {highlight: [10]}
let render (state: State) (dispatch: Msg -> unit) =
  let activePage =
    match state.CurrentUrl with
    | [ ] -> Html.h1 "Home"
    | [ "about" ] -> Html.h1 "About"
    | [ "contact" ] -> Html.h1 "Contact"
    // matches against /user/{userId}
    | [ "user"; Route.Int userId ] -> Html.h1 (sprintf "UserId: %d" userId)
    // matches against /user?id={userId}
    | [ "user"; Route.Query [ "id", Route.Int userId ] ] -> Html.h1 (sprintf "UserId: %d" userId)
    | _ -> Html.h1 "Not Found"

  React.router [
    router.onUrlChanged (UrlChanged >> dispatch)
    router.children [ activePage ]
  ]
```
Of course, you can pattern match against multiple parameters using the same list of query string parameters. Suppose we have a "search" page which has two parameters: `query` and `limit`. The first parameter is the string that we want to look for and the second parameter is optional and specifies the maximum number of search results to show on screen. Then we can pattern match that page as follows:
```fsharp {highlight: ['11-20']}
let activePage =
  match state.CurrentUrl with
  | [ ] -> Html.h1 "Home"
  | [ "about" ] -> Html.h1 "About"
  | [ "contact" ] -> Html.h1 "Contact"
  // matches against /user/{userId}
  | [ "user"; Route.Int userId ] -> Html.h1 (sprintf "UserId: %d" userId)
  // matches against /user?id={userId}
  | [ "user"; Route.Query [ "id", Route.Int userId ] ] -> Html.h1 (sprintf "UserId: %d" userId)
  // matches against /search?query={query}&limit={limit}
  | [ "search"; Route.Query parameters ] ->
      match parameters with
      | [ "query", query; "limit", Route.Int limit ] ->
          Html.h1 (sprintf "Searching for '%s' (limit %d))" query limit)
      | [ "limit", Route.Int limit; "query", query; ] ->
          Html.h1 (sprintf "Searching for '%s' (limit %d))" query limit)
      | [ "query", query ]
          Html.h1 (sprintf "Searching for '%s' (not limit))" query)
      | _ ->
          Html.h1 "Invalid search parameters"
  | _ ->
    Html.h1 "Not Found"
```
Notice here that the order matters of the tuples in the list we are pattern matching against. So we match against the different ordering in which the parameters may appear:
 - `/search?query={query}&limit={limit:int}`
 - `/search?limit={limit:int}&query={query}`
 - `/search?query={query}`

Of course you could work around the ordering by sorting the parameters by their keys using `List.sortBy fst parameters`, then matching the patterns from this sorted list. However, you could always write a function that takes that list and tries to turn it into a record that contains the parameter information. This function can for example return `Result<SearchParameters, string>` where `SearchParameters` is defined as follows:
```fsharp
type SearchParameters =
    { query : string
      limit : int option }
```
I will leave the implementation of such function to the reader. Remember that if `query` is missing, then the function should return `Error "Invalid search parameters: missing query"` and making `query` to be of type `string option` is considered cheating ;)