### Building a counter application

Let us now try to build something that not only has multiple elements, but also keeps track of and manipulates some local *state*. A counter application is the best candidate for these simple requirements. We can build something that looks like this: 

![counter](img/counter.gif)

As you can see, we want buttons that change the contents of a text element every time you click one of them. To build this from the template, we will add two button tags to the `index.html` page and give them identities `"increase"` and `"decrease"`. We will also add a header element with id `"countViewer"` where we will show the current count, here is how  `index.html` will look like:

```html
<!doctype html>
<html>
<head>
  <title>Fable Getting Started</title>
</head>
<body>
  <button id="increase"> Increase </button> 
  <button id="decrease"> Decrease </button> 
  <h1 id="countViewer"></h1>

  <script src="bundle.js"></script>
</body>
</html>
```

Now we will do something similar like we did back with our last example that prints the console message: get references to the buttons by their id values and attaching event handlers. Because we want to keep local state of the current count, we will use a mutable value. The `App.fs` becomes the following:

```fs
module App

open Fable.Import.Browser

// get references for UI elements
let increase = document.getElementById "increase"
let decrease = document.getElementById "decrease"
let countViewer = document.getElementById "countViewer"
 
let mutable currentCount = 0

// attach event handlers
increase.onclick <- fun ev ->
    currentCount <- currentCount + 1
    countViewer.innerText <- sprintf "Count is at %d" currentCount

decrease.onclick <- fun ev ->
    currentCount <- currentCount - 1
    countViewer.innerText <- sprintf "Count is at %d" currentCount

// set the count viewer with the initial count
countViewer.innerText <- sprintf "Count is at %d" currentCount
```
So far so good. We can add a slight change to the code to make the counter increase or decrease the count by a random number, for example, some random number between 5 and 10
```fs
let rnd = System.Random()

// attach event handlers
increase.onclick <- fun ev ->
    currentCount <- currentCount + rnd.Next(5, 10)
    countViewer.innerText <- sprintf "Count is at %d" currentCount

decrease.onclick <- fun ev ->
    currentCount <- currentCount - rnd.Next(5, 10)
    countViewer.innerText <- sprintf "Count is at %d" currentCount
``` 

![random-counter](img/random-counter.gif)

Now, let us complicate this simple application by introducing yet another button, this button will behave the same as the `increase` button does but with a caveat: it will increase the count after a delay of 1 second. First things first, add a button tag to your html:
```xml
<button id="increaseDelayed">Increase delayed</button>
```
Next we will write an `async` function that runs a callback after a delay:
```fs
// Runs the callback after a delay
let runAfter ms callback = 
  async {
    do! Async.Sleep ms 
    do callback()
  } 
  |> Async.StartImmediate

let increaseDelayed = document.getElementById "increaseDelayed"

increaseDelayed.onclick <- fun _ ->
  runAfter 1000 (fun () ->
    count <- count + rnd.Next(5, 10)
    countViewer.innerText <- sprintf "Count is at %d" count
  )
``` 

![random-counter-delayed](img/random-counter-delayed.gif)

Alright, we got our counter up and running and had it increase or decrease the count value randomly and even used an asynchronous function in the mix, now it is time to take a step and think about what we used in this section to better understand Fable. 