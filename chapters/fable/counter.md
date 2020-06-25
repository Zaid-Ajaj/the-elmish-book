# Counter Application

Let us now try to build something that not only has multiple elements but also keeps track of and manipulates some local *state*. A counter application is the best candidate for these simple requirements. We can build something that looks like this:

<resolved-image source="/images/fable/counter.gif" />

We will need buttons that change the contents of a text element every time you click one of them. To build this from the template, we will add two button tags to the `index.html` page and give them identities `"increase"` and `"decrease"`. We will also add a header element with id `"countViewer"` where we will show the current count. Here is what `index.html` will look like:

```html {highlight:[10, 11, 12]}
<!doctype html>
<html>
<head>
  <title>Fable</title>
  <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="shortcut icon" href="fable.ico" />
</head>
<body>
  <button id="increase"> Increase </button>
  <button id="decrease"> Decrease </button>
  <h1 id="countViewer"></h1>

  <script src="main.js"></script>
</body>
</html>
```

Now we will do something similar to what we did back with our [Hello World](hello-world) example that prints the console message. We will get references to the buttons by their id values and attach event handlers. Because we want to keep the local state of the current count, we will use a mutable value. The `App.fs` becomes the following:

```fsharp
module App

open Browser.Dom

// get references for UI elements
let increase = document.getElementById "increase"
let decrease = document.getElementById "decrease"
let countViewer = document.getElementById "countViewer"

let mutable currentCount = 0

// attach event handlers
increase.onclick <- fun ev ->
    // update the state
    currentCount <- currentCount + 1
    // update the view
    countViewer.innerText <- sprintf "Count is at %d" currentCount

decrease.onclick <- fun ev ->
    // update the state
    currentCount <- currentCount - 1
    // update the view
    countViewer.innerText <- sprintf "Count is at %d" currentCount

// set the count viewer with the initial count
countViewer.innerText <- sprintf "Count is at %d" currentCount
```
There you have it, a working counter app in F# that uses vanilla JavaScript APIs available in the browser.

### Random Increments and Decrements
So far, so good. We can add a slight change to the code to make the counter increase or decrease the count by some *random number*, say between 5 and 10. For this, we will use something you probably already know from writing F# that runs in normal .NET code: `System.Random`
```fsharp {highlight: [12, 16, 20]}
module App

open Browser.Dom

// get references for UI elements
let increase = document.getElementById "increase"
let decrease = document.getElementById "decrease"
let countViewer = document.getElementById "countViewer"

let mutable currentCount = 0

let rnd = System.Random()

// attach event handlers
increase.onclick <- fun ev ->
    currentCount <- currentCount + rnd.Next(5, 10)
    countViewer.innerText <- sprintf "Count is at %d" currentCount

decrease.onclick <- fun ev ->
    currentCount <- currentCount - rnd.Next(5, 10)
    countViewer.innerText <- sprintf "Count is at %d" currentCount

// set the count viewer with the initial count
countViewer.innerText <- sprintf "Count is at %d" currentCount
```

<resolved-image source="/images/fable/random-counter.gif" />


### Delayed Increments and Decrements
Now, let us complicate this simple application by introducing yet another button. This button will behave the same as the `increase` button behaves, but with a slight difference: it will increase the count after a delay of 1 second. First things first, add a button tag to your html:
```html {highlight: [12]}
<!doctype html>
<html>
<head>
  <title>Fable</title>
  <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="shortcut icon" href="fable.ico" />
</head>
<body>
  <button id="increase"> Increase </button>
  <button id="decrease"> Decrease </button>
  <button id="increaseDelayed">Increase delayed</button>
  <h1 id="countViewer"></h1>

  <script src="main.js"></script>
</body>
</html>

```
Next, we will write an `async` function that runs a callback after a delay and use it from the event handler:
```fsharp
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
    currentCount  <- currentCount  + rnd.Next(5, 10)
    countViewer.innerText <- sprintf "Count is at %d" currentCount
  )
```

<resolved-image source="/images/fable/random-counter-delayed.gif" />

Alright, we got our counter up and running, had it increase or decrease the count value randomly, and even used an asynchronous function in the mix. Now it is time to take a step back and think about what we actually did in this section to better understand Fable.
