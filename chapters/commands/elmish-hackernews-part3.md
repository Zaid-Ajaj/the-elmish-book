# Elmish Hackernews: Part 3

Previously on the Elmish Hackernews application we have using the function `loadStoryItems` to retrieve and parse the items from the Hackernews API. However, hypothetical users of the application are complaining: they say that it takes a long time before any useful information is presented on screen. After diagnosing the problem, we figured out that for some story items, the network latency is longer than 10 seconds. Even though other items might have already been loaded, the application is waiting *all* of the items to be loaded before it can show anything on screen.

After a careful review of the code, we concluded that the root of this "problem" is the `Async.Parallel` function that is combining all of the asynchronous operations to load story items into a single asynchronous operation and awaiting them untill every single story item has been loaded before returning the result.

In this part, we will try to solve this problem by changing the way the story items are loaded. Instead of awaiting all the loading operations to complete, we will load each item separately and have user inteface update whenever an item finishes loading regardless of whether other items have finished loading or not. The end result hopefully looks like the following:

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/commands/elmish-hackernews-part3.gif" />
  </div>
</div>

### Visualzing the strategy for loading

Let me try to show you what I mean by changing how the story items are loaded. The following diagram shows how we start from the `update` function to trigger a command and eventually we end up with a single message `LoadedStoryItems` which is then dispached back to the program and processed again by the `update` function. This is what we have been doing in parts 1 and 2 using `Async.Parallel` to aggregate the asynchronous operations before constructing a *single* message out of the results:

<div style="width:100%; margin-top: 50px; margin-bottom: 50px; ">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/async-parallel-strategy.png" />
  </div>
</div>

Instead of aggregating the operations using `Async.Parallel` to form a single result, we instead trigger a command *per asynchronous operation* to load a story item where each of the commands can result in a message with the asynchronous state of that story item whether it is still loading or has been loaded. These messages are processed individually by the `update` function. This way, the program is not waiting for all operations to form a single result but rather it is triggering a bunch of commands and processing the results as they come in, updating the user interface with every step. The following diagram highlights this strategy:

<div style="width:100%; margin-top: 50px; margin-bottom: 50px; ">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/commands/async-batch-strategy.png" />
  </div>
</div>

Using this strategy, the user interface will start showing story items as soon as they are loaded on an individual basis without waiting for every story item to load which makes the user interface feel very interactive as more data comes in.

This strategy relies on the fact that you can run multiple commands simultaneously in one go which is exactly what the `Cmd.batch` function provides. It takes a bunch of commands and starts them in parallel but unlike `Async.Parallel`, this function does not wait for the commands to finish nor it aggregates the results. In fact, `Cmd.batch` *cannot* know when the commands has finished running because each command may or may not dispatch a message at any given time. Not to forget that some commands might be keep dispatching messages indefinitely.

```fsharp
Cmd.batch : Cmd<'Msg> list -> Cmd<'Msg>
```

### A Realistic Use Case

Imagine you are building a classic content management system (CMS), a common landing page for these systems after you login is the *dashboard* page. The dashboard has many different panels where each panel shows a summary of information for some part of that CMS, whether is it the total sales of the application, the number of viewers or a chart of the unsuccesful orders etc. Since each panel loads information that is independant of other panels, you can use this strategy to load the data of each panel in parallel, updating the user interface of each panel as more data is loaded without waiting for the other panels to finish loading their related information.

<div style="width:100%; margin-top: 50px; margin-bottom: 50px; ">
  <div style="margin: 0 auto; width:80%;">
    <resolved-image source="/images/commands/fable-cms-example.png" />
  </div>
</div>

### Modelling The State