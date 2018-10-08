# Getting Started

To get started with Fable, it is easier to use a template instead of starting from scratch, for that I have set up a simple hello world fable application in the [fable-getting-started](https://github.com/Zaid-Ajaj/fable-getting-started) repo, if we take a look around the repository, it has the following structure:
```
fable-getting-started
    | 
    │  .gitattributes
    │  .gitignore
    │  .travis.yml
    │  build.cmd
    │  build.fsx
    │  build.sh
    │  LICENSE
    │  package-lock.json
    │  package.json
    │  paket.dependencies
    │  paket.lock
    │  README.md
    │  webpack.config.js
    ├─── .paket
    │     |-- paket.exe
    │     |-- Paket.Restore.targets
    │     |-- paket.targets
    ├─── .vscode
    │     |-- settings.json
    ├─── public
    │     |-- index.html
    └─── src
          |-- App.fs
          |-- App.fsproj
          |-- paket.references
```
You might be thinking *"these are many files for a hello world app!"* we will discuss the structure of the template as well as the purpose of each file in great detail soon, for now bear with me, it might seem a bit overkill but I intend to use similar structure for projects in the upcoming chapters so understanding this one will help greatly. 

The most important parts of the template are these directories:
-  `src` is where your F# source code lives 
-  `public` is the ouput directory when you compile F# to javascript 

The only F# source file in the project is `App.fs` and it contains the following:
```fs
module App

printfn "Hello world from Fable" 
```
When the F# project is compiled using Fable, a single javascript file called `bundle.js` will be output in the `public` directory, the `bundle.js` file in turn, is referenced by `index.html` , also in the `public` directory:
```html
<!doctype html>
<html>
<head>
  <title>Fable Getting Started</title>
</head>
<body>
  <script src="bundle.js"></script>
</body>
</html>
```
This means in order to run your F# code in the browser, you will first need to compile the project and then run `index.html` in your browser. However, before being able to compile the project, there are a couple of requirements that you need installed on your machine:

- [.NET Core](https://www.microsoft.com/net/download) 2.1+ (both SDK and runtime)
- [Mono](https://www.mono-project.com/download/stable/) 5.0+ for non-windows machines
- [Node.js](https://nodejs.org/en/) 10.0+ 

After you have installed these, you can check if you have the correct versions by running these commands:
```bash
dotnet --version 
node --version
mono --version # if you are using Linux or macOs 
```
After you have verified the versions you can clone the starter template repository and compile the whole project, on windows:
```
git clone https://github.com/Zaid-Ajaj/fable-getting-started.git
cd fable-getting-started
build 
```
on linux or macOs:
```
git clone https://github.com/Zaid-Ajaj/fable-getting-started.git
cd fable-getting-started
./build.sh  
```
I use windows, so the compilation looks as follows on my machine
![img](img/compile.gif)

As you can see, a bunch of things happend in there, the template doesn't try to hide the build steps. After the build is finished, there should be a `bundle.js` file in your `public` directory:
  
![public](img/public.png) 

Now that we have the javascript generated, we can open `index.html` in the browser, open the developer tools tab and look at the browser console, we should see the message `"Hello world from Fable"` printed out:

![console](img/browser-console.png)

Congrats! We have just got our first Fable application. Let us change the source code to make it print a different message and recompile. Go to `App.fs` and change the contents to:
```fs
module App

printfn "Fable is up and running..."
```
then run `build` or (`./build.sh` if you are on linux or macOs) to recompile the project. This time the compilation should have taken significantly less time than the first time build, this is because the template downloaded all dependencies it needed before. Now you can refresh the `index.html` page in the browser and see the new message printed out:

![new-message](img/new-message.png)

Of course, printing out a message to the console is boring. We can try something slightly less boring with some user interaction, we are running code in the browser after all. First things first, add a button to the `index.html` page:

```html
<!doctype html>
<html>
<head>
  <title>Fable Getting Started</title>
</head>
<body>
  <button id="printMsg">Print Message</button>
  <script src="bundle.js"></script>
</body>
</html>
``` 
Here, we have added a `button` tag to the page with identity attribute called `"printMsg"`, we will use the id to reference the button from the F# code. Modify the contents of `App.fs` to the following:
```fs
module App

open Fable.Import.Browser

let printMsg = document.getElementById "printMsg"

printMsg.onclick <- fun ev ->
    printfn "Button clicked"
```
As you can see, line 3 opens the namespace to `Fable.Import.Browser`: this is the first example of a binding library