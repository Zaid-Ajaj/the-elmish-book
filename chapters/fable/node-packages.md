# Node.js Packages

Understanding the hybrid nature of Fable is vital to being productive with Fable projects and realizing their full potential. In every typical Fable project or repository (however you like to call it), you are at least with *types* of projects:

 - A F# project
 - A Node.js project

You have already seen the F# project in the [Hello World](hello-world) template inside the `src` directory and it is what you are usually familiar with from dotnet. This is however only half of the story because the repository itself is actually a node.js project. 

Lets have another look at the structure of the repository, notice the highlighted file called `package.json`:
```bash {highlight: [7]}
fable-getting-started
  ├─── .gitattributes
  ├─── .gitignore
  ├─── LICENSE
  ├─── Nuget.Config
  ├─── package-lock.json
  ├─── package.json
  ├─── README.md
  ├─── webpack.config.js
  ├─── public
  │     ├───  fable.ico
  │     ├───  index.html
  │
  └─── src
        ├─── App.fs
        ├─── App.fsproj
```
The `package.json` file *implies* that this directory is indeed a Node.js project. Within `package.json`, you can specify the dependencies that the project uses. These dependencies can either be libraries or command line interface (cli) programs. Let's have a look:
```json
{
  "private": true,
  "scripts": {
    "build": "webpack",
    "start": "webpack-dev-server"
  },
  "devDependencies": {
    "@babel/core": "^7.1.2",
    "fable-compiler": "^2.1.12",
    "fable-loader": "^2.1.5",
    "webpack": "^4.25.1",
    "webpack-cli": "^3.1.2",
    "webpack-dev-server": "^3.2.0"
  }
}
```
### Developement Dependencies
This `package.json` has two very important sections: the `devDependencies` and `scripts`. The former section defines *development* dependencies which are libraries and cli programs used during developement. When you run `npm install` in the directory where `package.json` lives, all these dependencies are downloaded into a directory called `node_modules` next to `package.json`. 

This means your development dependencies are installed on a *per-project* basis which is really great because first, you don't to install any program to compile your project and second because the versions of these programs are maintained inside `package.json` allowing you to work on multiple projects on the same machine that use different versions of the same programs. For example you can work on a project A that uses Fable `1.x` and another project B that uses Fable `2.x` without the two interfering with each other. 

You must have wondered: "How did Fable compile the project if I didn't install it anywhere?" Well, there you have it. You installed it as part of your developement dependencies with the package `fable-compiler`. The template uses version `2.1.12` of Fable which is the most recent version at the time of writing. I intend to keep the project template up-to-date with latest Fable versions. 


### Npm scripts 

The latter section of `package.json` is the `scripts` sections, also known as npm scripts. This section provides shortcuts to *running* the cli programs that were installed as development dependencies or any shell command from the system. For example, we installed `webpack` and `webpack-dev-server` which are programs that work with Fable to turn the F# project into a nicely bundled javascript file. We provide shortcuts to running these programs using the npm scripts `start` and `build`. To run such a script, you run the command: 
```bash 
npm run <script name>
```
So when we run `npm start` (short for `npm run start`) we are actually invoking `webpack-dev-server` which will start the developement server. The same goes for `npm run build`, this command will invoke `webpack` to start a full build of the project. 