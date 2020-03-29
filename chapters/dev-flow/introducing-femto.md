# Introducing Femto

Way back in chapter one, we talked about [Fable Bindings](../fable/fable-bindings). The most important and most common types of bindings are those that require third-party npm dependencies (see type 4.3 packages). Using these packages means that you have to install both the  .NET nuget package which exposes the F# API that is essentially a thin shell (wrapper) on top of a npm package that must be installed as well.

For example, the [Feliz](https://github.com/Zaid-Ajaj/Feliz) nuget package the we are using for the user interface DSL depends on npm packages `react@16.8.0` and `react-dom@16.8.0`. In order to use Feliz, you need to install the nuget package using
```bash
dotnet add package Feliz
```
Then install the corresponding npm packages separately using as follows:
```bash
npm install react@16.8.0 react-dom@16.8.0
```
The versions of the npm dependencies are tightly coupled with the version of the nuget package. For a long time, as a Fable developer you had to lookup the documentation of the binding to know which versions of npm packages it requires. Sometimes the situation was even worse: you have to search through the source of the binding which npm package version is supported to finally give up, install the latest version of the npm package and hope for the best.

For direct dependencies, the problem isn't as bad as it seems. However, when it comes to transitive dependencies, this problem starts to become a blocker and a real pain for many developers. Let us take for the example the package [Feliz.Recharts](https://zaid-ajaj.github.io/Feliz/#/Ecosystem/Recharts) it is a binding for [recharts](http://recharts.org/en-US/) that can be used to build interactive charts in Elmish applications. Since it a binding for the [recharts](http://recharts.org/en-US/) npm dependency, recharts must installed. Also, since this (nugt) package depends on Feliz, it will by extension depend on `react@16.8.0` and `react-dom@16.8.0`. How do you manage the versions of these packages, and how does a major version update influence the version of the dependant npm package?

### Femto to the rescue!

I build a CLI tool called [Femto](https://github.com/Zaid-Ajaj/Femto) to solve this exact. Femto bridges the gap between nuget Fable bindings and npm dependencies and is able to automagically resolve the required npm packages without any manual work. It allows Fable binding authors to include npm package *metadata* that the binding depends upon. Then, when you install the nuget package, Femto will look up the versions of the required npm dependencies, resolve the correct versions or update existing ones if required.

To use Femto, install it as a global dotnet CLI tool as follows:
```
dotnet tool install femto --global
```
Then when you want to install a package, simply `cd` your way to the F# project directory and install a binding like this:
```bash
cd ./src
femto install {PackageName}
```
To show how it works, try installing `Feliz.Recharts` into the [fable-getting-started](https://github.com/Zaid-Ajaj/fable-getting-started) repository. This repository doesn't have Feliz installed nor does it know about `react`/`react-dom` packages. Now from a fresh repository clone, I will run Femto as follows:
```bash
git clone https://github.com/Zaid-Ajaj/fable-getting-started.git
cd fable-getting-started
cd ./src
femto install Feliz.Recharts
```
Femto will tell what it is trying to do and how it is doing it:
```
$ femto install Feliz.Recharts
[22:41:14 INF] Analyzing project C:\projects\fable-getting-started\src\App.fsproj
[22:41:14 INF] Running dotnet restore against the project
[22:41:16 INF] Using nuget to install Feliz.Recharts
[22:41:20 INF] ✔ Nuget package Feliz.Recharts installed successfully
[22:41:20 INF] Resolving potentially required npm package with femto --resolve
[22:41:20 INF] Analyzing project C:\projects\fable-getting-started\src\App.fsproj
[22:41:20 INF] Running dotnet restore against the project
[22:41:25 INF] Using npm for package management
[22:41:30 INF] Found package.json in C:\projects\fable-getting-started
[22:41:33 INF] Executing required actions for package resolution
[22:41:33 INF] Installing dependencies [react@16.8.0, react-dom@16.8.0, recharts@1.8.5]
[22:41:43 INF] ✔ Package resolution complete
```
Just like that, Femto used nuget to install `Feliz.Recharts`, its nuget dependency (Feliz) and all the required npm dependencies automatically.

Femto is not a new package manager, though it has advanced package resolution mechanism, it only instructs `dotnet` and `npm` to download and install the actual packages. You can also install the nuget package manually and let Femto do only the npm package resolution:
```bash
cd ./src
dotnet add package Feliz.Recharts
femto --resolve
```
As you can see from the previous logs of Femto, the command `Femto install Feliz.Recharts` is just a short hand for the above command where Femto will first ask `dotnet` to install the package then calls itself again with the `--resolve` argument to initiate the automatic package resolution.

### Missing npm package metadata

What about Fable bindings without npm metadata? Femto is only useful when authors of Fable bindings actually include this information about supported npm packages within the nuget itself as described in the docs of [Femto - Library Authors docs](https://github.com/Zaid-Ajaj/Femto#library-authors). Please let the authors know about it and ask them to include the metadata into their package to ensure Femto compatibility and thus a great user experience when working wih Fable packages.

To learn more about Femto, read the [docs](https://github.com/Zaid-Ajaj/Femto) and blog post [Introducing Femto](https://fable.io/blog/Introducing-Femto.html).
