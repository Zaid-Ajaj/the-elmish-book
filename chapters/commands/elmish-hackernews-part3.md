# Elmish Hackernews: Part 3

Previously on the Elmish Hackernews application we have using the function `loadStoryItems` to retrieve and parse the items from the Hackernews API. However, hypothetical users of the application are complaining: they say that it takes a long time before any useful information is presented on screen. After diagnosing the problem, we figured out that for some story items, the network latency is longer than 10 seconds. Even though other items might have already been loaded, the application is waiting *all* of the items to be loaded before it can show anything on screen.

After a review of the code, we concluded that the root of this "problem" is the `Async.Parallel` function that is combining all of the asynchronous operations to load story items into a single asynchronous operation and awaiting them untill every one of them has been loaded before returning the result.

In this part, we will try to solve this problem by changing the way the story items are loaded. Instead of awaiting all the loading operations to complete as a single operation, we will load each item *separately* and have the user inteface update whenever an item finishes loading regardless of whether other items have finished loading or not. The end result looks like the following:

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/commands/elmish-hackernews-part3.gif" />
  </div>
</div>

### Visualzing the strategy for loading

Let me try to show you what I mean by changing how the story items are loaded. The following diagram shows how we start from the `update` function to trigger a command and eventually we end up with a single message `LoadedStoryItems` which is then dispached back to the program and processed again by the `update` function before rerendering the user interface. This is what we have been doing in parts 1 and 2 using `Async.Parallel` to aggregate the asynchronous operations before constructing a *single* message out of the results:

<div style="width:100%; margin-top: 50px; margin-bottom: 50px; ">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/async-parallel-strategy.png" />
  </div>
</div>

Instead of aggregating the operations using `Async.Parallel` to form a single result, we instead trigger a command *per asynchronous operation* to load a story item where each of the commands can result in a message with the asynchronous state of that story item whether it is still loading or has been loaded. These messages are processed individually by the `update` function. This way, the program is not waiting for all operations to form a single result but rather it is triggering a bunch of commands and processing the messages dispatched from these commands as they come in, updating the user interface with every step. The following diagram highlights this strategy:

<div style="width:100%; margin-top: 50px; margin-bottom: 50px; ">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/async-batch-strategy.png" />
  </div>
</div>

Using this strategy, the user interface will start showing story items as soon as they are loaded on an individual basis without waiting for every story item to load which makes the user interface feel very interactive as more data comes in.

This strategy relies on the fact that you can run multiple commands simultaneously in one go which is exactly what the `Cmd.batch` function provides. It takes a bunch of commands and starts them in parallel but unlike `Async.Parallel`, this function does not wait for the commands to finish nor it aggregates the results. In fact, `Cmd.batch` *cannot* know when the commands has finished running because each command may or may not dispatch a message at any given time. Not to forget that some commands might even dispatch messages indefinitely. This is the signature of the function:

```fsharp
Cmd.batch : Cmd<'Msg> list -> Cmd<'Msg>
```

### A Realistic Use Case

Imagine you are building a classic content management system (CMS), a common landing page for these systems after you login is a *dashboard* page. The dashboard has many different panels where each panel shows a summary of information for some part of that CMS, whether is it the total sales of the application, the number of viewers or a chart of the unsuccesful orders etc. Since each panel loads information that is independant of other panels, you can use this strategy to load the data of each panel in parallel, updating the user interface of each panel as more data is loaded without waiting for the other panels to finish loading their related information.

<div style="width:100%; margin-top: 50px; margin-bottom: 50px; ">
  <div style="margin: 0 auto; width:80%;">
    <resolved-image source="/images/commands/fable-cms-example.png" />
  </div>
</div>

### Modelling The State

In parts 1 and 2 we had a single asynchronous operation that loads all the story items in one go. To keep track of the state of that operation we modelled the data using the `Deferred<'t>` type where `'t` was `Result<HackernewsItem list, string>` to account for failure of loading story items in case of HTTP and or JSON errors. In this part however, we are not keeping track of a single operation, but instead of *multiple ongoing* operations at the same time: every story item has an asynchronous state (initial, in progress and resolved).

You might be tempted to use `Deferred<Result<HackernewsItem, string>> list` for these operations and that would be a close model but that is not enough (why? think about it before you read on).

Once these operations start, they are all in the `Deferred.InProgress` state. You basically have a list that looks like this `[ Deferred.InProgress; Deferred.InProgress; Deferred.InProgress; ...]`. Once a story item is loaded with information, you have to update the list but there is no way *identify* which item was loaded. To identify story items, we need to associate each of the deferred states with an ID of the item being loaded:
```fsharp
(int * Deferred<Result<HackernewsItem, string>>) list
```
Here we are using an integer to identify the asynchronous state of each item. This integer is the `id` field of the story item in subject. Instead of `a' list`, you can also use a `Map` to model the mapping between the story item ID and the associated `Deferred` state of that item. I personally find `Map` nicer in this example even though a list of tuples would work just fine:
```fsharp
Map<int, Deferred<Result<HackernewsItem, string>>>
```
This way, we keep track of the asynchronous state of each story item and we are able to identify these states by the ID of the story item that is being loaded. However, where are these IDs are coming from? These have to be loaded in an earlier stage which in itself is an asycnhronos operation that can be modelled with `Deferred`. The end result for the state becomes something like this:
```fsharp
type DeferredStoryItem = Deferred<Result<HackernewsItem, string>>

type State =
  { CurrentStories: Stories
    StoryItems : Deferred<Result<Map<int, DeferredStoryItem>, string>> }
```
The "outer" asynchronous operation is responsible for loading the only the IDs of the story items from the Hackernews API and from there we initialize the "inner" asynchronous states for the story items. I know this looks very complicated but bear in mind, this is the Hackernews API that is a bit unconventional which complicates our model with these nested asynchronous states.

It might help to refactor the types to simplify the model. For example, you can combine `Deferred` and `Result` into a single type
```fsharp
type DeferredResult<'t> = Deferred<Result<'t, string>>

type DeferredStoryItem = DeferredResult<HackernewsItem>

type State =
  { CurrentStories: Stories
    StoryItems : DeferredResult<Map<int, DeferredStoryItem>> }
```
It is just a more compact version of the same type. Personally I would say they are the same but others might find this version to be a bit more readable.

Moving on to the modelling the messagaes, we now know that there are two types of asynchronous events that might occur while the application is running:

 - One event when the IDs of the story items have been loaded
 - One event when a single story item has been loaded

Refactor the `Msg` type to account for these events:
```fsharp
type Msg =
  | LoadStoryItems of AsyncOperationEvent<Result<int list, string>>
  | LoadedStoryItem of int * Result<HackernewsItem, string>
  | ChangeStories of Stories
```
Notice here that `LoadStoryItems` eventually returns `int list` when finished, these are the IDs of the story items. When that event occurs, we initialize the asynchronous states of the items and wait for `LoadedStoryItem` events to get dispatched so we are able to process them and update the user interface.

### Implementing `init` and `update`

In this part, I will not go through the code in detail when it comes to the implementations of `init` and `update` because once you get the model right, what's left is fill in the blanks in these two functions which is actually quite straightforward from that point on. You can find the source code of this part in [Zaid-Ajaj/elmish-hackernews-part3](https://github.com/Zaid-Ajaj/elmish-hackernews-part3) for reference. At this point I will assume you are able to read the code on your own in order to prepare for the exercises in the next section. However, I do want to highlight a couple of important parts of the `update` function:
```fsharp {highlight: [5, 8]}
let update (msg: Msg) (state: State) =
  match msg with
  | LoadStoryItems (Finished (Ok storyIds)) ->
      // initialize the story IDs
      let storiesMap  = Map.ofList [ for id in storyIds -> id, Deferred.InProgress ]
      let nextState = { state with StoryItems = Resolved (Ok storiesMap) }
      // trigger a command from each story ID
      nextState, Cmd.batch [ for id in storyIds -> Cmd.fromAsync (loadStoryItem id) ]

  | LoadedStoryItem (Ok item) ->
      match state.StoryItems with
      | Resolved (Ok storiesMap) ->
          // update a single story item state from the storiesMap
          let modifiedStoriesMap =
            storiesMap
            |> Map.remove item.id
            |> Map.add item.id (Resolved (Ok item))

          let nextState = { state with StoryItems = Resolved (Ok modifiedStoriesMap) }
          nextState, Cmd.none

      | _ ->
          // state sink
          state, Cmd.none

  | (* omitted for brevity *)
```
More specifically this line:
```fsharp
Cmd.batch [ for id in storyIds -> Cmd.fromAsync (loadStoryItem id) ]
```
Which effectively creates a single command by batching a list of the commands where each of which loads a single story item from Hackernews API.

You might have wondered why `LoadedStoryItem` is of type
```fsharp
int * Result<HackernewsItem, string>
```
instead of
```fsharp
int * AsyncOperationEvent<Result<HackernewsItem, string>>
```
This is because we don't need to know whether the operation has started or not. As soon as the IDs of the story items are loaded, the asynchronous state of each item is `Deferred.InProgess` and the commands to load each item are triggered right away so we don't need to bother with the initial state of the items but only the end result when an item has been loaded.

> NOTE: You could argue that it is more correct to make a specialized type similar to `Deferred` for this case without an iniitial state, only `InProgress` and `Resolved` but I will not do that in this example because introducing a specialized type that I will likely use once is not worth complicating the model more than it already is.

### Implementing the `render` function

Even though the state type looks complicated, once you break it down in the `render` function, you will see that it is pretty straightforward as the user interface needs to account for the asynchronous states of the data we are keeping track of. Here are a couple of the smaller render functions used to make up the whole user interface (refere to [Zaid-Ajaj/elmish-hackernews-part3](https://github.com/Zaid-Ajaj/elmish-hackernews-part3) for the full code):
```fsharp
let renderStoryItem (itemId: int) storyItem =
  let renderedItem =
      match storyItem with
      | HasNotStartedYet -> Html.none
      | InProgress -> spinner
      | Resolved (Error error) -> renderError error
      | Resolved (Ok storyItem) -> renderItemContent storyItem

  Html.div [
    prop.key itemId
    prop.className "box"
    prop.style [ style.marginTop 15; style.marginBottom 15]
    prop.children [ renderedItem ]
  ]

let renderStories items =
  match items with
  | HasNotStartedYet -> Html.none
  | InProgress -> spinner
  | Resolved (Error errorMsg) -> renderError errorMsg
  | Resolved (Ok items) ->
      items
      |> Map.toList
      |> List.map (fun (id, storyItem) -> renderStoryItem id storyItem)
      |> Html.div

let render (state: State) (dispatch: Msg -> unit) =
  Html.div [
    prop.style [ style.padding 20 ]
    prop.children [
      title
      renderTabs state.CurrentStories dispatch
      renderStories state.StoryItems
    ]
  ]
```