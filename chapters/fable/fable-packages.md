# Fable Packages

From the template we started with in the [Hello World](hello-world.md) section, we had a simple F# project `App.fsproj` that includes a single F# source file called `App.fs`. If we examine `App.fsproj`, we will see that it is a normal F# project that follows the dotnet SDK format that we are used to from F# on dotnet:
```xml {highlight:[9]}
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <Compile Include="App.fs" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Fable.Browser.Dom" Version="1.0.0-alpha-003" />
  </ItemGroup>
</Project>
```
Now take a closer look at the highlighted line: a package reference is included that points to `Fable.Browser.Dom`. This package was restored from `nuget`. From dotnet's perspective it is a normal package but in fact this is a *Fable-specific* package and it is meant to only be used within Fable projects. Using this package, we were able to `open Browser.Dom` namespace and gain access to some of the browser's APIs, specifically the DOM APIs that allows us to reference and manipulate elements on the page. 

### Fable-specific Packages

A normal dotnet package published to the `nuget` registry is essentially a zip file containing the compiled assemblies of the library. Such zip file has the following structure:
```
Library.nupkg
  ├── lib
       ├─ net461
            ├─── Library.dll
       ├─ netstandard2.0
            ├─── Library.dll     
  
  ├── <other meta data>   
``` 
Where `net461` and `netstandard2.0` are directories containing the library assemblies compiled against different target frameworks.

A Fable package is almost the same as a normal dotnet package but with the source files of the library included in the package in a special `fable` directory as highlighted below:
```bash {highlight: [8,9,10]}
Fable.Library.nupkg
  ├── lib
       ├─ net461
            ├─── Fable.Library.dll
       ├─ netstandard2.0
            ├─── Fable.Library.dll    
  
  ├── fable
        ├── Fable.Library.fsproj
        ├── Library.fs
  
  ├── <other meta data>   
``` 

### Fable Compiles Source Code

Let me mention this again, the *source files* are included in the nuget package. This is very important because Fable operates on source code instead of compiled assemblies. This has the consequence that F# packages are not compatible by default in F# projects. To make a F# package compilable by Fable, you need to publish a new version of the package with the source code included with the condition that the source code is also Fable-compatible: doesn't use APIs that Fable doesn't recognize as discussed in [.NET Compatibility](compatibility.md). 

You might be wondering and thinking to yourself: "Well, then why are the compiled assemblies are still included in the Fable nuget package if Fable only requires the source files?" and that would be a great question! It is not Fable that is using these compiled files but it is your IDE. Whether you are using Inonide, Visual Studio or Rider, these IDE's provide their intellisense and auto-complete features using the definitions within there compiled `dll` files. 
