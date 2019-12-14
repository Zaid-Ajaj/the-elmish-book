# Elmish Hackernews: Part 3

Previously on the Elmish Hackernews application we have using the function `loadStoryItems` to retrieve and parse the items from the Hackernews API. However, hypothetical users of the application are complaining: they say that it takes a long time before any useful information is presented on screen. After diagnosing the problem, we figured out that for some story items, the network latency is longer than 10 seconds. Even though other items might have already been loaded, the application is waiting *all* of the items to be loaded before it can show anything on screen.

After a careful review of the code, we concluded that the root of this "problem" is the `Async.Parallel` function that is combining all of the asynchronous operations to load story items into a single asynchronous operation and awaiting them untill every single story item has been loaded before returning the result.

In this part, we will try to solve this problem by changing the way the story items are loaded. Instead of awaiting all the loading operations to complete, we will load each item separately and have user inteface update whenever an item finishes loading regardless of whether other items have finished loading or not. The end result hopefully looks like the following:

<div style="width:100%">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/commands/elmish-hackernews-part3.gif" />
  </div>
</div>

### Strategies for asynchronous loading

