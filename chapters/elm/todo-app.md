# To-Do List application

So far we have learned quite a bit about Elmish, but nothing helps understanding concepts like actually building something that combines the ideas into a coherent application, and for that we will build a To-Do list application in Elmish. This is *the* hello world of every UI framework or paradigm and because of that, it has almost become too cliche to build one these things. However, I will put my spin to  the subject and build it in three parts starting from the minimal implementation and upgrading the application, adding more features as we go. I will thoroughly explain all of the *three* parts, going through the code bit by bit. After the third part however, you will be tasked to extend the application and add a couple of features by yourself. These excercises will help you test what you have learned so far. 

The most important thing about this experiement is that we understand the *train of thought* in how you approach the problem and which *questions* you ask yourself to guide you when writing your implemenation. 

### Part 1: The bare minimum
We will implement the bare minimum of what you can a call a To-Do list application. Here we will learn how to render a list of text elements into the user interface with F#'s list comprehensions.

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;"> 
    <resolved-image source="/images/elm/todo-part1.gif" />      
  </div>
</div>

### Part 2: An actual To-Do list application
The application will look more like an actual todo list where each item can be marked as completed. The items can also be deleted. Here we will refactor our data model such that we can *identify* the items in the UI and update these exact elements in our `update` function.

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;"> 
    <resolved-image source="/images/elm/todo-part2.gif" />      
  </div>
</div>

### Part 3: Stepping it up a notch
Here we will dive deeper into our amazing To-Do list application and add the feature of making every item *editable* as follows. This is a more complex variant of `Part 2` that will help enforce the concepts even more.

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;"> 
    <resolved-image source="/images/elm/todo-part3.gif" />      
  </div>
</div>

### Styling with Bulma, Icons with Font Awesome

As I have mentioned earlier, we will be using [Bulma](https://bulma.io/) as our CSS framework and [Font Awesome](https://fontawesome.com/) for, well, the awesome icons. To start off, we clone the [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started) repository like we did in the [Counter](counter.md) example and work our way from there to build the application. From part 1 up to Part 3, the `index.html` page will be same, including the external CSS files. So the very first thing do after cloning is adding a couple of links to reference Bulma and Font Awesome to the `index.html` page inside the `public` directory:
```html {highlight: ['7-12']}
<!doctype html>
<html>
<head>
  <title>Fable</title>
  <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css"/>
  <link rel="stylesheet" 
        href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" 
        integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf"
        crossorigin="anonymous" /> 
  <link rel="shortcut icon" href="fable.ico" />
</head>
<body>
    <div id="elmish-app"></div>
    <script src="bundle.js"></script>
</body>
</html>
```

Don't worry if you aren't familiar with the classes that Bulma provides, I wasn't either when I started writing the chapter! It is a matter of looking up the [documentation](https://bulma.io/documentation/) to see what classes you need. Although I intend to keep the source code up to date, it is possible that there might be slight differences between the classes used in the source code and the current documentation because it is updated frequently. At the time of writing, we are using Bulma version 0.7.4 and version font awesome version 5.8.1. See the versions in the `link` elements where we referenced both libraries.

Without further ado, let's jump right in in [Part 1](todo-app-part1)!