# Getting Started

To get started with Fable, it is easier to use a template instead of starting from scratch, for that I have set up the a simple hello world fable application in the [fable-getting-started](https://github.com/Zaid-Ajaj/fable-getting-started) repo, if we take a look around the repository, it has the following structure:
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
You might be thinking *"these are many files for a hello world app!"* and you would be right, we will discuss the structure of the template as well as the purpose of each file in great detail soon, for now bear with me. The most important parts of the template are these directories:
-  `src`: where your F# source code lives 
-  `public`: the ouput directory when you compile F# to javascript 

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
This means in order to run your F# code in the browser, you will first need to compile the project and then run `index.html` in your browser. Before being able to compile the project, there are a couple of requirements that you need installed on your machine:

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

As you can see, a bunch of things happend in there