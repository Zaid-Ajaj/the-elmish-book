# Basic Elmish Project Structure

We have talked about how Elmish makes use of the native React Javascript library to handle the user interface part of the The Elm Architecture, but how are these libraries connected and what makes the project structure of [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started) repository different than that of [fable-getting-started](https://github.com/Zaid-Ajaj/fable-getting-started) we used in the very first Hello World example?

To answer the question, we take a look at the `App.fsproj` of an Elmish project:
```xml {highlight: [9]}
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <Compile Include="App.fs" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Fable.Elmish.React" Version="3.0.1" />
    <PackageReference Include="Feliz" Version="0.38.0" />
  </ItemGroup>
</Project>
```
Notice the highlighted line, a reference to the library `Fable.Elmish.React` is included in the project. This library is pulled from nuget and has the following dependency structure:

<resolved-image source="/images/elm/elmish-project-structure.png" />

Since `Fable.Elmish` and `Fable.React` are both *transitive* dependencies of `Fable.Elmish.React` these are also pulled in when you reference `Fable.Elmish.React`. However, `Fable.React` is the binding used to interact with React, we need to install React as well from npm, which we already do if you take a look into the `package.json` file:

```json {highlight: [16, 17]}
{
  "private": true,
  "scripts": {
    "start": "webpack-dev-server",
    "build": "webpack --mode production"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/Zaid-Ajaj/elmish-todo-part3.git"
  },
  "dependencies": {
    "@babel/core": "^7.1.2",
    "fable-compiler": "^2.3.17",
    "fable-loader": "^2.1.8",
    "gh-pages": "^2.0.1",
    "react": "^16.8.0",
    "react-dom": "^16.8.0",
    "webpack": "^4.25.1",
    "webpack-cli": "^3.1.2",
    "webpack-dev-server": "^3.2.1"
  }
}
```