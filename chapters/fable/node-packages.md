# Node.js packages

Understanding the hybrid nature of Fable is vital to being productive with Fable projects and realizing their full potential. In every typical Fable project or repository (however you like to call it), you are working at least with two *types* of projects:

 - An F# project
 - A Node.js project

You have already seen the F# project in the [Hello World](hello-world) template inside the `src` directory, and it is what you are usually familiar with from .NET. This is, however only half of the story because the repository itself is actually a Node.js project.

Let's have another look at the structure of the repository, notice the highlighted file called `package.json`:
```bash {highlight: [6]}
fable-getting-started
  ├─── .gitattributes
  ├─── .gitignore
  ├─── LICENSE
  ├─── package-lock.json
  ├─── package.json
  ├─── README.md
  ├─── webpack.config.js
  ├─── App.sln
  ├─── .config
  │     ├───  dotnet-tools.json
  ├─── dist
  │     ├───  fable.ico
  │     ├───  index.html
  │
  └─── src
        ├─── App.fs
        ├─── App.fsproj
```
The location of the `package.json` file *implies* that this directory is indeed a Node.js project and `package.json` is at the *root* of such project. 

Inside `package.json`, you can specify the dependencies that the project uses. These dependencies can either be libraries or development tools such as command-line interface (CLI) programs. Let's have a look:
```json
{
  "private": true,
  "scripts": {
    "build": "dotnet fable ./src && webpack",
    "start": "dotnet fable watch ./src --runFast webpack-dev-server"
  },
  "devDependencies": {
    "webpack": "^5.74.0",
    "webpack-cli": "^4.10.0",
    "webpack-dev-server": "^4.10.0"
  }
}

```
### Development dependencies
This `package.json` has two very important sections: the `devDependencies` and `scripts`. The former section defines *development* dependencies which are libraries and cli programs used during development. When you run `npm install` in the directory where `package.json` lives, all these dependencies are downloaded into a directory called `node_modules` next to `package.json`.

This means your development dependencies are installed on a *per-project* basis which is really great because first, you do not need to install any machine-wise installations and second because the versions of these programs are maintained inside `package.json` allowing you to easily update them.

The development dependencies we have here are all related to `webpack`, our choice for bundling and serving the application during development. Note that there are other options to work with Fable projects such as [Vite](https://vitejs.dev/) which has gained a lot of popularity among Fable/F# devs recently.

### Npm scripts

The latter section of `package.json` is the `scripts` sections, also known as npm scripts. This section provides shortcuts to *running* the cli programs that were installed as development dependencies or any shell command from the system. You can run these scripts using the command
```bash
npm run <script name>
```
In our projects, we have the two scripts `start` and `build`. 

Let us first talk about `build` which is a short hand command that invokes the following
```
dotnet fable ./src && webpack
```
This script invokes the Fable compiler with `dotnet fable` and asks it to compile the project inside the `./src` directory. Then, once that has finished it invokes `webpack` which takes care of the bundling business. 

The `start` script on the other hand is slighly more complicated
```
dotnet fable watch ./src --runFast webpack-dev-server
```
It invokes the Fable compiler in _watch_ mode and immediately starts `webpack-dev-server` without waiting for the compilation to finish (what `--runFast` does) so that both processes run in parallel: Fable watching F# source files and recompiling them as you edit them and webpack development server rebundling and refreshing the page as soon as new JS files are generated.

Note that these two commands assume you have already restored the dotnet tools using `dotnet tool restore`.

Finally it is worth mentioning that at the time of writing we are using Fable v4.