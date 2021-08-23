# Basic Elmish Project Structure

We have talked about how Elmish makes use of the native React JavaScript library to handle the user interface part of the Elm Architecture. But how are these libraries connected and what makes the project structure of the [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started) repository different from that of [fable-getting-started](https://github.com/Zaid-Ajaj/fable-getting-started) we used in the very first Hello World example?

To answer the question, we take a look at the `App.fsproj` of an Elmish project:
```xml {highlight: [9, 10]}
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <Compile Include="App.fs" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Fable.Elmish.React" Version="3.0.1" />
    <PackageReference Include="Feliz" Version="0.68.10" />
  </ItemGroup>
</Project>
```
The highlighted lines show the nuget packages used in the project. This project uses `Fable.Elmish.React` which is used to make React and Elmish play well together. As for `Feliz` it is used to write React code, i.e. whatever you use in your `render` functions.

Consider the package `Fable.Elmish.React`. It is pulled from nuget and has the following dependency structure:

<resolved-image source="/images/elm/elmish-project-structure.png" />

Since `Fable.Elmish` and `Fable.React` are both *transitive* dependencies of `Fable.Elmish.React` these are also pulled in when you reference `Fable.Elmish.React`. However, `Fable.React` is the binding used to interact with React. We need to install React as well from npm, which we already do if you take a look into the `package.json` file:

```json {highlight: [8,9]}
{
  "private": true,
  "scripts": {
    "start": "webpack-dev-server",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "react": "^16.8.0",
    "react-dom": "^16.8.0"
  },
  "devDependencies": {
    "@babel/core": "^7.1.2",
    "fable-compiler": "^2.3.24",
    "fable-loader": "^2.1.8",
    "webpack": "^4.38.0",
    "webpack-cli": "^3.3.6",
    "webpack-dev-server": "^3.7.2"
  }
}
```
