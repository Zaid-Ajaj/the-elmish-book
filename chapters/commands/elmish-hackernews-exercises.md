# Elmish Hackernews: Exercices

In this section, you will be tasked to add a number of features to the Elmish Hackernews sample application starting from where we left off in [Part 3](elmish-hackernews-part3). You can clone the code repository from [Zaid-Ajaj/elmish-hackernews-part3](https://github.com/Zaid-Ajaj/elmish-hackernews-part3) and proceed from that point to implement the new requirements.

### Exercise 1: Sort The Story Items

When we start loading the first 10 story items separately from the Hackernews API, the order in which they appear on screen is different every time depending on which items are loaded first. Moreover, the order cannot be guaranteed from just the IDs of the story items because we are converting them to a hash table of the type `Map<int, DeferredStoryItem>`. Sort the story items when they are rendered such that:
 1. Items that are still loading, appear *after* items that are loaded
 2. Loaded items are sorted by their `time` field (an integer representing Unix-time) that is available from the JSON. Recent story items appear before old story items.

Hint: the sorting happens in here
```fsharp {highlight: [9]}
let renderStories items =
  match items with
  | HasNotStartedYet -> Html.none
  | InProgress -> spinner
  | Resolved (Error errorMsg) -> renderError errorMsg
  | Resolved (Ok items) ->
      items
      |> Map.toList
      // sort here
      |> List.map (fun (id, storyItem) -> renderStoryItem id storyItem)
      |> Html.div
```


### Exercise 2: Implement a "Load More" button

In the current implementation of this application, we are choosing to load the IDs of only the first ten story items when the stories end point and from there load the contents of each item. However, as of now there is no way to load more items other than the ones that are already loaded. The top stories end point for example, returns the most recent 500 story items from the Hackernews API.

```fsharp {highlight: [10]}
let loadStoryItems stories = async {
    let endpoint = storiesEndpoint stories
    let! (status, responseText) = Http.get endpoint
    match status with
    | HttpOk ->
        // parse the response text as a list of IDs (ints)
        let storyIds = Decode.fromString (Decode.list Decode.int) responseText
        match storyIds with
        | Ok storyIds ->
            let firstTenStories = List.truncate 10 storyIds
            return LoadStoryItems (Finished (Ok firstTenStories))
        | Error parseError ->
            return LoadStoryItems (Finished (Error parseError))

    | HttpError ->
      // non-OK response finishes with an error
      return LoadStoryItems (Finished (Error "Could not load the IDs of the story items."))
}
```

In this exercise, add a (sticky) button at the bottom of the screen to load the *next 10* story items that haven't been loaded yet. This button becomes disabled when story items are being loaded and invisible when there no more story items that can be loaded.

Hint: refactor `LoadedStoryItem` as follows
```fsharp
int * Result<HackernewsItem, string>
// becomes
int * AsyncOperationEvent<Result<HackernewsItem, string>>
```