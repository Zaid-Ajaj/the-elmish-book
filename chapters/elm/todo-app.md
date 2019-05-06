# To-Do List application: Part 0

So far we have learned quite a bit about Elmish, but nothing helps understanding concepts like actually building something that combines the ideas into a coherent application, and for that we will build a To-Do list application in Elmish. This is *the* hello world of every UI framework or paradigm and because of that, it has almost become too cliche to build one these things. However, I will put my spin on the subject and build it in three parts starting from the minimal implementation and upgrading the application, adding more features as we go. 

What's important to learn from this experiement is that we understand the *train of thought* in how you approach the problem and which *questions* you ask yourself to guide you when writing your implemenation.  

Now let's take a look at what we will be building to hype you up a bit. For part 1 we will implement the bare minimum of what you can a call a To-Do list application:

<div style="width:100%">
  <div style="margin: 0 auto; width:65%;"> 
    <resolved-image source="/images/elm/todo-part1.gif" />      
  </div>
</div>


For styling, we will be using [Bulma](https://bulma.io/) as our CSS framework and [Font Awesome]() for, well, the awesome icons. Later on we will refactor it to use [Fulma](https://github.com/Fulma/Fulma) intead which will help us use Bulma in a type-safe manner within Elmish applications. 

To start off, we clone the [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started) repository like we did in the [Counter](counter.md) example and work our way from there to build the application. Initially, the application will look like this:

<h1 style="color:green">COOL GIF PLACEHOLDER</h1>

As you can see from the gif above, the application does a couple of things:
 - Shows a list of to-do items.
 - Every item has description and a checkbox for whether the item is complete.
 - You can type in the description of a new to-do item and add to the list. 
 
The first I want to do after cloning is adding a couple of links to reference Bulma and Font Awesome to the `index.html` page inside the `public` directory:
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