# Elmish Hackernews: Part 1

We start off out Elmish Hackernews application with the simplest possible implementation which loads the first 10 story items from the Hackernews API and renders them on screen.

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/commands/elmish-hackernews-part1.gif" />
  </div>
</div>

Like always, we start building the application from the [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started) template.

### Modelling The State

Our application will be loading a bunch of story items from the Hackernews API. Depending of the story *category*, wether it `Top`, `Best`, `New`,`Ask`, `Job` or `Show` the items will have different fields. However, regardless of the category, each story item will at least have the fields `id` and `title`. Some of these story items might have a `url` which links to the main story (or project, article etc.)

In this part we will load the first ten `Top` story items from this end point: https://hacker-news.firebaseio.com/v0/topstories.json. To model the story items, we will use a record:
```fsharp
type HackernewsItem = {
    id: int
    title: string
    url : string option
}
```
Now that we have a type for a story item, we can model the `State` and `Msg`. Just like we did for every example that deals with remote data that has mutliple states (i.e. "initial", "loading" and "resolved") we will be using the `Deferred` type to model the story items as follows:
```fsharp
type State = {
  StoryItems: Deferred<Result<HackernewsItem list, string>>
}

type Msg =
  | LoadStoryItems of AsyncOperationEvent<Result<HackernewsItem list, string>>
```

> The types `Deferred<'t>` and `AsyncOperationEvent<'t>` are covered in section [Modelling Asynchronous State](async-state.md)

Not here that we are using `Result<HackernewsItem list, string>` because the loading might fail due to one of the reasons:
 - HTTP error: not being able to reach the Hackernews API at all because maybe the server is down or receiving a non-successful status code in the response of the HTTP request.
 - JSON parsing error: decoding the JSON might fail due to fact that the JSON structure returned from the Hackernews API doesn't match with what the `HackernewsItem` decoder is parsing. (We need to write such decoder).

Technically, to model the *exact* situation, including all the possible errors (from HTTP or JSON) we would need to use this type:
```fsharp {highlight: [2]}
Result<
    Result<HackernewsItem, string> list,
    string
>
```
Instead of
```fsharp {highlight: [2]}
Result<
    HackernewsItem list,
    string
>
```
The difference here is `HackernewsItem` in the latter, simplified case as opposed to `Result<HackernewsItem, string>` in the former, idealistic model. Since we are loading each story item *separately* (due to how Hackernews API works) and each one might fail due to HTTP or JSON, each story item can have an error. However, in our application, I am choosing to ignore these errors to keep the application simple.

In depends on the requirements of your application in how far you want to keep track of the various errors that might occur in the program. In our case we don't care a lot about hthem because we want to keep things simple and we can offord to ignore those items that fail due to the HTTP call or the JSON parsing. The main point is: it is a deliberate choice whether or not we keep track of the errors that might occur because these are known.

In most modern APIs, loading a list of something usually happens in single request, not loading each item separately like what Hackernews API does which complicates the situation a little but again, that is why I chose to tackle this API to better understand and learn how to work with asynchronous operations.

Moving on, let us implement the actual loading of the story items from Hackernews.

### Implementing `init` and `update`

Since we have modelled the `State` and `Msg`, we can implement `init` and `update`. These are actually quite simple and straightforward:
```fsharp {highlight: [10]}
let init() =
  let initialState = { StoryItems = HasNotStartedYet }
  let initialCmd = Cmd.ofMsg (LoadStoryItems Started)
  initialState, initialCmd

let update (msg: Msg) (state: State) =
  match msg with
  | LoadStoryItems Started ->
      let nextState = { state with StoryItems = InProgress }
      nextState, Cmd.fromAsync loadStoryItems

  | LoadStoryItems (Finished (Ok storyItems)) ->
      let nextState = { state with StoryItems = Resolved (Ok storyItems) }
      nextState, Cmd.none

  | LoadStoryItems (Finished (Error error)) ->
      let nextState = { state with StoryItems = Resolved (Error error) }
      nextState, Cmd.none
```
The code above is the usual business when working with `Deferred` and `AsyncOperationEvent` and these have been covered quite a lot in previous sections. The actual loading work is the highlighted line:
```fsharp
nextState, Cmd.fromAsync loadStoryItems
```
where `loadStoryItems` has the type `Async<Msg>` which is resposible of requesting the story items from Hackernews API via HTTP and decoding the JSON from the response into a list of `HackernewsItem`. Before we get into that, let us write a dummy implementation of `loadStoryItems` which just returns a hardcoded list of items after a delay:
```fsharp
let loadStoryItems = async {
    // simulate network delay
    do! Async.Sleep 1500
    let storyItems = [ { id = 1; title = "Example title"; url = None } ]
    return LoadStoryItems (Finished (Ok storyItems))
}
```
Now the types in the `update` function check out and there are no compiler errors anymore.

### Implementing the `render` function

Before we get back to the the implementation of `loadStoryItems`, let us also implement the `render` function to see the application running. There isn't much going on with the `render` function, so I will get it out the way. As usual, the `render` function is broken down to smaller functions (`renderItem`, `renderItems`, `renderError` and `spinner`) to make up the entire user interface.

For this application, I am using [Bulma]() for styling and [Font Awesome]() for the icons which means I have added links to the stylesheets in the `index.html`:
```html {highlight: ['5-10']}
  <head>
    <title>Fable</title>
    <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css" />
    <link rel="stylesheet"
      href="https://use.fontawesome.com/releases/v5.8.1/css/all.css"
      integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf"
      crossorigin="anonymous" />
    <link rel="shortcut icon" href="fable.ico" />
  </head>
```

```fsharp
let renderError (errorMsg: string) =
  Html.h1 [
    prop.style [ style.color.red ]
    prop.text errorMsg
  ]

let renderItem item =
  Html.div [
    prop.key item.id
    prop.className "box"
    prop.style [ style.marginTop 15; style.marginBottom 15 ]
    prop.children [
      match item.url with
      | Some url ->
          Html.a [
            prop.style [ style.textDecoration.underline ]
            prop.target.blank
            prop.href url
            prop.text item.title
          ]
      | None ->
          Html.p item.title
    ]
  ]

let spinner =
  Html.div [
    prop.style [ style.textAlign.center; style.marginTop 20 ]
    prop.children [
      Html.i [
        prop.className "fa fa-cog fa-spin fa-2x"
      ]
    ]
  ]

let renderItems = function
  | HasNotStartedYet -> Html.none
  | InProgress -> spinner
  | Resolved (Error errorMsg) -> renderError errorMsg
  | Resolved (Ok items) -> React.fragment [ for item in items -> renderItem item ]

let render (state: State) (dispatch: Msg -> unit) =
  Html.div [
    prop.style [ style.padding 20 ]
    prop.children [
      Html.h1 [
        prop.className "title"
        prop.text "Elmish Hackernews"
      ]

      renderItems state.StoryItems
    ]
  ]
```
Once we have our triplet `init`, `update` and `render` in place, we can actually take a look in how the application looks like:

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/commands/elmish-hackernews-part11.gif" />
  </div>
</div>

### Implementing `loadStoryItems`

Now that we have the general shape of the application what it should do. We can focus actually reading the story items with the `loadStoryItems` that is now returning a hardcoded list of items. Let us recap what we have to do to load the items:
 - Query the top stories end point and get a list of story item IDs via HTTP
 - Parse the IDs from JSON into a `int list` using Thoth.Json
 - From each of those IDs take the first 10 then load and parse the associated item from Hackernews
 - Aggregate the results into a single `Async` expression and return it as a `Msg`

As you can see, there is quite a lot to digest. For the HTTP and JSON stuff we will be using [Fable.SimpleHttp](https://github.com/Zaid-Ajaj/Fable.SimpleHttp) and [Thoth.Json](https://thoth-org.github.io/Thoth.Json/) respectively. Start by adding them to the project:
```bash
cd src
dotnet add package Fable.SimpleJson
dotnet add package Thoth.Json
```
Now we can use both and implement `loadStoryItems`:
```fsharp {highlight: [14]}
let storiesEndpoint = "https://hacker-news.firebaseio.com/v0/topstories.json"

let loadStoryItems = async {
  let! (status, responseText) = Http.get storiesEndpoint
  match status with
  | 200 ->
    // parse the response text as a list of IDs (integers)
    let storyIds = Decode.fromString (Decode.list Decode.int) responseText
    match storyIds with
    | Ok storyIds ->
        // take the first 10 IDs
        // load the item from each ID in parallel
        // aggregate the results into a single list
        let! storyItems = (*...*)
        return LoadStoryItems (Finished (Ok storyItems))

    | Error errorMsg ->
        // could not parse the array of story ID's
        return LoadStoryItems (Finished (Error errorMsg))
  | _ ->
      // non-OK response goes finishes with an error
      return LoadStoryItems (Finished (Error responseText))
}
```
First we call `Http.get` to make a GET request against the top stories end point and if the status code of the response is 200 then we decode the response text which is in JSON format as a list of intergers using
```fsharp
Decode.fromString (Decode.list Decode.int) responseText
```
When the JSON decoding is successful (i.e. you get a `int list` back) which contains the IDs of the story items, we will use each ID to load the item. To load each story item, I will write another function which itselt loads a single item based on an ID and decodes it into a `HackernewsItem`:
```fsharp
let itemDecoder : Decoder<HackernewsItem> =
  Decode.object (fun fields -> {
    id = fields.Required.At [ "id" ] Decode.int
    title = fields.Required.At [ "title" ] Decode.string
    url = fields.Optional.At [ "url" ] Decode.string
  })

let loadStoryItem (itemId: int) = async {
  let endpoint = sprintf "https://hacker-news.firebaseio.com/v0/item/%d.json" itemId
  let! (status, responseText) = Http.get endpoint
  match status with
  | 200 ->
    match Decode.fromString itemDecoder responseText with
    | Ok storyItem -> return Some storyItem
    | Error _ -> return None
  | _ ->
    return None
}
```
Now combining both functions `loadStoryItem` and `loadStoryItems` we get:
```fsharp {highlight: ['14-19']}
let loadStoryItem (itemId: int) : Async<Option<HackernewsItem>> = (* . . . *)

let loadStoryItems = async {
  let! (status, responseText) = Http.get storiesEndpoint
  match status with
  | 200 ->
    // parse the response text as a list of IDs (integers)
    let storyIds = Decode.fromString (Decode.list Decode.int) responseText
    match storyIds with
    | Ok storyIds ->
        // take the first 10 IDs
        // load the item from each ID in parallel
        // aggregate the results into a single list
        let! storyItems =
          storyIds
          |> List.truncate 10
          |> List.map loadStoryItem
          |> Async.Parallel
          |> Async.map (Array.choose id >> List.ofArray)

        return LoadStoryItems (Finished (Ok storyItems))

    | Error errorMsg ->
        // could not parse the array of story ID's
        return LoadStoryItems (Finished (Error errorMsg))
  | _ ->
      // non-OK response goes finishes with an error
      return LoadStoryItems (Finished (Error responseText))
}
```