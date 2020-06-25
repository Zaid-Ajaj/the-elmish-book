# Fable packages

From the template we started within the [Hello World](hello-world.md) section, we had a simple F# project `App.fsproj`. That project includes a single F# source file called `App.fs`. If we examine `App.fsproj`, we will see that it is a normal F# project that follows the .NET SDK format that we are used to from F# on .NET:
```xml {highlight:[9]}
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <Compile Include="App.fs" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Fable.Browser.Dom" Version="1.0.0" />
  </ItemGroup>
</Project>
```
Now take a closer look at the highlighted line: a package reference is included that points to `Fable.Browser.Dom`. This package was restored from [nuget](http://www.nuget.org). From .NET's perspective, it is a normal .NET package. But in fact, this is a *Fable-specific* package. It is meant to only be used within Fable projects. Using this package, we were able to open the `Browser.Dom` namespace and gain access to some of the browser's APIs. Specifically, we gained access to the DOM APIs that allow us to reference and manipulate elements on the page. What makes a Fable-specific package different than those meant to be used from .NET?

### Fable-specific packages

A normal .NET package published to the `nuget` registry is essentially a zip file containing the compiled assemblies of the library. Such a zip file has the following structure:
```
Library.nupkg
  ├── lib
       ├─ net461
            ├─── Library.dll
       ├─ netstandard2.0
            ├─── Library.dll

  ├── <other meta data>
```
The `net461` and `netstandard2.0` directories contain the library assemblies compiled against different target frameworks.

A Fable package is almost the same as a standard .NET package but with the library's source files included in the package in a special `fable` directory as highlighted below:
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

### Fable compiles source code

The *source files* are included in the NuGet package. This is very important because Fable operates on source code instead of compiled assemblies. This has the consequence that F# packages are not automatically compatible with Fable projects. To make an F# package compilable by Fable, you need to publish a new version of the package with source code included. And that source code must be Fable-compatible: it does not use APIs that Fable cannot recognize as discussed in [.NET Compatibility](compatibility.md).

You might be wondering, "Well, then why are the compiled assemblies still included in the Fable NuGet package if Fable only requires the source files?" It is not Fable that is using these compiled files, but it is your IDE. Whether you are using Ionide, Visual Studio, or Rider, these IDEs provide their IntelliSense and auto-complete features using the definitions within these compiled `dll` files.

### Fable compiles dependencies

For a full build, Fable not only compiles the entry project but also compiles the dependencies of the project coming from NuGet along with their (transitive) dependencies if any exist. The following diagram illustrates a valid project that Fable can compile, assuming all dependencies are compatible with the Fable version you are using. This is a valid assumption most of the time unless you are using an age-old Fable package. This goes to say that Fable is *not* necessarily backward-compatible with Fable packages:

<resolved-image source="/images/fable/simple-project.png" />
