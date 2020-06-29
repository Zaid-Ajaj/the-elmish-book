# Elmish Hackernews: Part 2

In this part, we will continue building the Elmish Hackernews application and allowing it to load the story items from different item categories other than the top stories which is what we did in the previous part. It will look something like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/commands/elmish-hackernews-part2.gif" />
  </div>
</div>

As you can see from the gif above, the application contains tab buttons. Clicking any of which loads the items from a different end point based on the category of the stories: `New` for new stories, `Top` for stories and so on. The application keeps track of the active tab. Besides the tabs, every loaded item contains the *score* of that item. The score is included in the JSON that is returned from the Hackernews API. Finally we are adding a nice icon next to each loaded item.

### Modelling The State

Since the application now has multiple story categories to load the story items from, we start adding a discriminated union to describe these stories and adding the current active stories to the `State`:
```fsharp {highlight: [9]}
[<RequireQualifiedAccess>]
type Stories =
    | New
    | Top
    | Best
    | Job

type State =
  { CurrentStories: Stories
    StoryItems : Deferred<Result<HackernewsItem list, string>> }
```
Keeping track of the current story category means that we should have a way to switch to another category. That is something we add to the `Msg`:
```fsharp {highlight: [2]}
type Msg =
  | ChangeStories of Stories
  | LoadStoryItems of AsyncOperationStatus<Result<HackernewsItem list, string>>
```
That's pretty much it for the `State`.

### Refactoring `init` and `update`:

Initially, the application loads the new stories, so `init` is refactored to the following:
```fsharp {highlight: [2]}
let init() =
  { CurrentStories = Stories.New
    StoryItems = HasNotStartedYet }, Cmd.ofMsg (LoadStoryItems Started)
```
As for `update`, it needs to account for the new `Msg.ChangeStories` we added to the `State` but also needs to refactor `LoadStoryItems Started` case because we not loading just the hardcoded end point of the top stories but instead the end point should be dependant on the currently active stories category:
```fsharp {highlight: [3,4,5,6, 10]}
let update (msg: Msg) (state: State) =
    match msg with
    | ChangeStories stories ->
        let nextState = { state with StoryItems = InProgress; CurrentStories = stories }
        let nextCmd = Cmd.fromAsync (loadStoryItems stories)
        nextState, nextCmd

    | LoadStoryItems Started ->
        let nextState = { state with StoryItems = InProgress }
        let nextCmd = Cmd.fromAsync (loadStoryItems state.CurrentStories)
        nextState, nextCmd

    | LoadStoryItems (Finished items) ->
        let nextState = { state with StoryItems = Resolved items }
        nextState, Cmd.none
```
Notice here that `loadStoryItems` is not just of type `Async<Msg>` anymore but instead it has type:
```fsharp
loadStoryItems : Stories -> Async<Msg>
```
because the end point used in the function depends on that selected stories category:
```fsharp {highlight: [10]}
let storiesEndpoint stories =
  let fromBaseUrl = sprintf "https://hacker-news.firebaseio.com/v0/%sstories.json"
  match stories with
  | Stories.Best -> fromBaseUrl "best"
  | Stories.Top -> fromBaseUrl "top"
  | Stories.New -> fromBaseUrl "new"
  | Stories.Job -> fromBaseUrl "job"

let loadStoryItems stories = async {
    let endpoint = storiesEndpoint stories
    let! (status, responseText) = Http.get endpoint
    (* the rest is the same, omitted for brevity *)
```
Great! Now the loading story items is refactored. Nothing needs to change in the actual implementation because only end point is different per story category. As for the individual items themselves, loading and parsing also doesn't require any refactoring, except that we now need to decode the `score` field as well of each item as follows:
```fsharp {highlight: [5, 13]}
type HackernewsItem = {
  id: int
  title: string
  url: string option
  score : int
}

let itemDecoder : Decoder<HackernewsItem> =
  Decode.object (fun fields -> {
    id = fields.Required.At [ "id" ] Decode.int
    title = fields.Required.At [ "title" ] Decode.string
    url = fields.Optional.At [ "url" ] Decode.string
    score = fields.Required.At [ "score" ] Decode.int })
```

### Refactoring `render` and friends

Most of the changes in this part are actually within the user interface where we are adding the tabs and highlighting the currently active tab.
```fsharp {highlight: ['8-27', 38]}
let storyCategories = [
  Stories.New
  Stories.Top
  Stories.Best
  Stories.Job
]

let renderTabs selectedStories dispatch =
  let switchStories stories =
    if selectedStories <> stories
    then dispatch (ChangeStories stories)

  Html.div [
    prop.className [ "tabs"; "is-toggle"; "is-fullwidth" ]
    prop.children [
      Html.ul [
        for stories in storyCategories ->
        Html.li [
          prop.classes [ if selectedStories = stories then "is-active" ]
          prop.onClick (fun _ -> switchStories stories)
          prop.children [
            Html.a [ Html.span (storiesName stories) ]
          ]
        ]
      ]
    ]
  ]

let render (state: State) (dispatch: Msg -> unit) =
  Html.div [
    prop.style [ style.padding 20 ]
    prop.children [
      Html.h1 [
        prop.className "title"
        prop.text "Elmish Hacker News"
      ]

      renderTabs state.CurrentStories dispatch
      renderStories state.StoryItems
    ]
  ]
```
Here we are rendering the tabs using the `renderTabs` function which takes as input the currently selected stories category from the state as well as the `dispatch` function because we want to be able to dispatch `Msg.ChangeStories` from the one of the tabs if it is not already selected. Also to highlight the active tab, we give it the [Bulma Tab](https://bulma.io/documentation/components/tabs/) class `is-active` when the currently selected stories category is equal to the corresponding category of the tab.

There are some changes required for rendering the score and the icon in each loaded story item but I don't think it particularly interesting to go through the code in detail like I did for the rest of the application. You can try to implement it yourself based on the gif in the beginning of this section and use the source code at [Zaid-Ajaj/elmish-hackernews-part2](https://github.com/Zaid-Ajaj/elmish-hackernews-part2) as a reference.

That sums it up for part 2 of the Elmish Hackernews application. I admit there hasn't much new theory for the material in this part but it will provide a nice segway into the next part where we use an entirely different technique for loading the story items from Hackernews.