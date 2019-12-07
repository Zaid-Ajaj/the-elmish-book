# Elmish Hackernews

In this chapter, we hopefully learnt a lot about Elmish commands, HTTP and JSON. It is time to wrap up the chapter with an application that lets us apply these concepts within a realistic scenario. We will be attempting to build a clone application of [Hackernews](https://news.ycombinator.com). Hackersnews, as you might have guessed, is a news website where people post links to interesting topics in programming, math and entrepreneurship. The cool thing about Hackernews is that they have a public API that you can query and get the news items yourself and then render them however you like in your application. This public API provided by Hackernews is *interesting* in the sense that it isn't particularly developer friendly like most common web APIs which makes it a perfect candidate to tackle and learn from.

### Hackernews API
"So what makes Hackernews so *interesting*?" I hear you say. Well, to be able to build a meaningful page with links to stories and posts, you have to issue *multiple HTTP requests* and combine their results before you can render these links and posts on screen.

Hackernews is built around "*news items*" coming from "*stories*". Stories are divided into six categories: `Top`, `Best`, `New`,`Ask`, `Job` and `Show`. You can query each of these stories to get the corresponding items. However, when you query for example the top stories, you don't get the items but instead you get the identities of the items. See the results for yourself and navigate to [https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty](https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty). The response from this HTTP endpoint looks like this:
```json
[ 21558013, 21557309, 21557057, 21557909, 21557890, /* 495 more items */ ]
```
> These are the results at the time of writing, you most likely will get different items when you try it out yourself.

The top stories endpoint returned a JSON array of item identities for 500 items. For each of these items, you can issue another HTTP request to get the data of that specific item. For example to query the data of item with identity `21558013`, you send a GET request to [https://hacker-news.firebaseio.com/v0/item/21558013.json?print=pretty](https://hacker-news.firebaseio.com/v0/item/21558013.json?print=pretty) and you get these results back:
```json
{
  "by" : "fortran77",
  "descendants" : 1,
  "id" : 21558013,
  "kids" : [ 21558095 ],
  "score" : 13,
  "time" : 1574000952,
  "title" : "Gource.io – a software version control visualization tool",
  "type" : "story",
  "url" : "http://gource.io"
}
```
As you can see, we get quite a lot of information for this item such as the title, the url to the story or in this case to the website of this item. There are also information about the user who posted this item (i.e. the `by` field has the username) which you can further query to get information about that user. There is another array of identities in the `kids` field that identify comments of this specific item. You can query these comments and the result itself might have more comments because the comments have a nested structure. The `descendants` field gives you the total number of comments down the entire comment tree.

Understanding the API you are working with is crucial before you are able to properly model your application. Head to [Hackernews API documentation](https://github.com/HackerNews/API) to learn more about the API and all the available information that you can query.

For the purposes of our Elmish Hackernews clone we will be restricting ourselves into just getting the information of items and render them as a list with links to the `url` of those items. Building an entire clone that maps to the API is out of scope for this application, though definitely possible using the techniques that we will be applying in the remainder of this chapter.

Just like with chapter 2, I have divivded the implementation of the Elmish Hackernews clone into three parts where we incrementally add more features as we go.


### Elmish Hackernews: Part 1

In the beginning, we will be implementing the minimal requirements of the application which is just to load the news items of the top stories into the application and render them in a list. It looks like this:

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/elmish-hackernews-part1.gif" />
  </div>
</div>

### Elmish Hackernews: Part 2

In this part, we will expand upon what we have learnt in part 1 and implement different tabs that load different stories from Hackernews pages, as well decoding the "score" of each item and rendering it on screen:

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/elmish-hackernews-part2.gif" />
  </div>
</div>

### Elmish Hackernews: Part 3

Here, we step it up a notch. In contrary to the part 1 and part 2 where we load the story items in one go after all items have been loaded, we will load the story items individually.

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/elmish-hackernews-part3.gif" />
  </div>
</div>