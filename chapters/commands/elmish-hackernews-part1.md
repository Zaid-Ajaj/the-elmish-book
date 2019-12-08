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
    let storyItems = [ { id = 1; title = "Example title"; Url = None } ]
    return LoadStoryItems (Finished (Ok storyItems))
}
```
Now the types in the `update` function check out and there are no compiler errors anymore.