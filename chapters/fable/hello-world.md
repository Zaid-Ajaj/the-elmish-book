# Hello World

To get started with Fable, it is easier to use a template instead of building your application from scratch, for that I have set up a simple hello world fable application in the [fable-getting-started](https://github.com/Zaid-Ajaj/fable-getting-started) repository, clone it locally on your machine as follows:

```bash
git clone https://github.com/Zaid-Ajaj/fable-getting-started.git
```
If we take a look around the repository, it has the following contents:
```
fable-getting-started
  ├─── .gitattributes
  ├─── .gitignore
  ├─── LICENSE
  ├─── Nuget.Config
  ├─── package-lock.json
  ├─── package.json
  ├─── README.md
  ├─── webpack.config.js
  ├─── dist
  │     ├───  fable.ico
  │     ├───  index.html
  │
  └─── src
        ├─── App.fs
        ├─── App.fsproj
```

The most important parts of the template are these directories:
- `src` is where your F# source code lives
- `dist` is the output directory when you compile F# to JavaScript
- `package.json` is used by Node.js to give information to the Node.js package manager (npm for short) that allows it to identify the project as well as handle the project's *dependencies*
- `webpack.config.js` will contain our "compiler configuration" with [webpack](https://webpack.js.org/). We will talk about Webpack in great detail in a later chapter because it is an advanced topic.

The only F# source file in the project is `App.fs` and it contains the following code:
```fsharp
module App

printfn "Hello world from Fable"
```
When the F# project is compiled using Fable, a single JavaScript file called `main.js` will be output in the `dist` directory, the `main.js` file in turn, is referenced by `index.html`, also in the `dist` directory:
```html {highlight:[9]}
<!doctype html>
<html>
<head>
  <title>Fable</title>
  <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="shortcut icon" href="fable.ico" />
</head>
<body>
  <script src="main.js"></script>
</body>
</html>
```
Which F# project to compile and where the output goes is defined within the configuration file `webpack.config.js`, in the following snippet I have highlighted the relevant configured options:

```js {highlight:[5]}
var path = require("path");

module.exports = {
    mode: "none",
    entry: "./src/App.fsproj",
    devServer: {
        contentBase: path.join(__dirname, "./dist")
    },
    module: {
        rules: [{
            test: /\.fs(x|proj)?$/,
            use: "fable-loader"
        }]
    }
}
```
the `entry` options specifies the path to the project that should be compiled. The other options will be discussed in a later chapter.

### Compiling the project
To get your F# code to run in the browser, you will first need to compile the project and then open `index.html` in your browser. However, before being able to compile the project, there are a couple of requirements that you need to have installed on your machine:

- [.NET Core](https://www.microsoft.com/net/download) 2.2 or later, both SDK and runtime
- [Node.js](https://nodejs.org/en/) 10.0 or later

Of course, having a code editor is not a requirement for building the project but rather for development. To edit F# code, it is highly recommended to have [VS Code](https://code.visualstudio.com/) installed (along with with the [Ionide](http://ionide.io/) extension).

Once you have installed both .NET and Node.js, you can verify that you have the correct versions by running these commands in your terminal:
```bash
dotnet --version
node --version
```
After you have checked the versions, you can clone the [fable-getting-started](https://github.com/Zaid-Ajaj/fable-getting-started) repository from GitHub and compile the whole project
```bash
cd fable-getting-started
npm install
npm run build
```
I use windows, so the compilation looks as follows on my machine

<resolved-image source='/images/fable/compile.gif' />

As you can see, a bunch of things happen in there. After the build is finished, there should be a `main.js` file in your `dist` directory:

```
dist
  ├───  main.js
  ├───  fable.ico
  ├───  index.html
```

Now that we have the JavaScript generated, we can open the `index.html` page in the browser; it will look blank because we haven't added anything to it. Still, you can open the developer tools tab and look at the browser console; we should see the message `"Hello world from Fable"` printed out:

<resolved-image source='/images/fable/browser-console.png' />

Congrats! We have just got our first Fable application running. Let us change the source code to make it print a different message and recompile. Go to `App.fs` and change the printed message from `"Hello from Fable"` to `"Fable is up and running..."` as follows:

```fsharp {highlight: [3]}
module App

printfn "Fable is up and running..."
```
Now to compile again, you only need to run:
```bash
npm run build
```

This time there is no need to run `npm install` because the project dependencies were already installed from the first run.
After `npm run build` finished running you can refresh the `index.html` page in the browser and see the new message printed out in the browser console:

<resolved-image source="/images/fable/new-message.png" />

### User Interaction

Of course, printing out a message to the console is boring. We can try something slightly less boring with some user interaction, we are running our code in the browser after all. So let us add a button that will print a message in the console when clicked. First things first, add the button to the `index.html` page:

```html {highlight: [10]}
<!doctype html>
<html>
    <head>
        <title>Fable</title>
        <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="shortcut icon" href="fable.ico" />
    </head>
<body>
  <button id="printMsg">Print Message</button>
  <script src="main.js"></script>
</body>
</html>
```
Here, we have added a `button` tag to the page with identity attribute called `"printMsg"`, we will use this id to reference the button from the F# code. Modify the contents of `App.fs` to the following:
```fsharp
module App

open Browser.Dom

let printMsgButton = document.getElementById "printMsg"

printMsgButton.onclick <- fun eventArgs ->
    printfn "Button clicked"
```
We start by opening the namespace `Browser.Dom`: this is the first example of a Fable *binding*: a library that allows our code to access native JavaScript APIs. In the case above, we use `document` with which we can reference and manipulate elements on the page, see [full docs here](https://developer.mozilla.org/en-US/docs/Web/API/Document) of `document`.

Then, we ask `document` to give us a reference for the HTML element that has the id `"printMsg"`, i.e. the button tag we added earlier to the `index.html` page. After that, we attach an *event handler* to the button element: a function that will run when the button is clicked.

Now you can save `App.fs` and recompile using `npm run build`, refresh the page and you should get something that looks like this:

<resolved-image source="/images/fable/button-click.gif" />
