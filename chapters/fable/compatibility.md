# Compatibility with .NET

The base class library or *BCL* for short are those native APIs from .NET that F# can use in normal F# applications. Think the namespaces that start with `System.*`. In the previous counter example, we used `System.Random` to generate random numbers which is a class from the BCL that we were able to use and run in the browser.

Although we were using the `System.Random` class, the actual implementation is not .NET code. Under the hood, Fable translates these APIs to something that already (hopefully) exists in the native javascript APIs which is in this specific case the `Math.random()` function.

Supporting *all* of the base class library is not a goal of Fable and when certain BCL functionality is needed, then a binding to the native equivalent of the functionality will be the way to go.

Fable tries to support certain BCL functions and classes when *'it makes sense'* because Fable compiles F# with the idea in mind that the code will run inside a javascript runtime, like V8 in the browser or Node.js on the server. In many cases, the APIs provided from the BCL don't work out of the box in these javascript environments. For example, multi-threading APIs within the `System.Threading.Tasks` namespace are not supported because javascript environments are usually single-threaded.

Likewise, APIs from `System.IO` are not supported because javascript in the browser cannot access the file system by default. However, Javascript on the server *should* be able to access the file system and do all crazy things on the hosting machine and in such cases we will use javascript-specific APIs from Node.js. Again, we would use a binding to access these APIs, the binding `Fable.Node` covers most built-in modules from Node.js.

That said, there are many supported APIs from the base class library that Fable compiles while maintaining the same behavior you would expect if you were running the code from F# on .NET. So let us go through a quick tour of these APIs.

### Numeric types

While Javascript only has the `Number` type (64-bit floating number, the same as `System.Double`) to represent numbers, the BCL has many numeric types besides `System.Double` with varying sizes that Fable implements with exact arithmetic precision out of the box: `System.Int16` (short), `System.Int64` (long), `System.Decimal` and `System.Numerics.BigInt` as well as the unsigned counter-parts of the integers.

### Date/Time

Dotnet has `System.DateTime` to represent dates and times, Fable supports this type and the `DateTime` API of static functions, as well as a subset of `System.TimeSpan` and `System.DateTimeOffset`. It is worth noting that a `DateTime` instance compiles down to a `Date` instance in javascript which makes interoperability even more straightforward.

### Converters

APIs from `System.Convert` and `System.BitConverter` are supported. Although I have to mention that there are some subtleties when you use these classes in browser or node, for example the functions `Convert.FromBase64String` and `Convert.ToBase64String` use [atob](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/atob) and [btoa](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa) under the hood, which are native browser functions and will not run out of the box within Node.js environments, at least at the time of writing that is. In such cases, you would have to provide a binding that *does* work with Node.js by using [Buffers](https://nodejs.org/api/buffer.html#buffer_class_method_buffer_from_string_encoding):

```fsharp
[<Emit("Array.prototype.slice.call(Buffer.from($0, 'base64'))")>]
let fromBase64 (value: string) : byte array = jsNative
```

This is just to show that not everything is supported by default using Fable and that sometimes you might need to work around these rare situations.

### Regular Expression

Although the .NET API for `Regex` is supported, the code compiles down to the `Regex` instance of javascript which has a different feature-set than the features provided by the native .NET API. When using `Regex` with Fable, it is the same as if you instantiated a `Regex` instance on .NET with `RegexOptions.EcmaScript`, see the differences [outlined here](https://www.regular-expressions.info/dotnet.html).

### Globalization

Although the numeric and date types are supported, the formatting APIs of these types using `CultureInfo` is *not*. There are a couple of reasons for this, most importantly is that such feature would inflate the bundle size of the generated javascript because it includes a lot of static information about the different `CultureInfo` instances: names of days, months, currencies, digit separators and a lot more that you most likely will never use. Besides the bundle size, implementing globalization from scratch is a daunting task with high maintenance costs. Luckily though, there exists native and standard globalization support in javascript runtimes, that, funny enough is called [Internationalization](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl). In both browser and Node.js you can easily make use of this through the interoperability features of Fable:

```fsharp
open Fable.Core
open Fable.Core.JsInterop

type INumberFormatter =
    abstract format : float -> string

[<Emit("new Intl.NumberFormat($0, { style: 'currency', currency: $1 })")>]
let moneyFormatter (culture: string) (currency: string) : INumberFormatter = jsNative

let euro = moneyFormatter "nl-NL" "EUR"
let usd = moneyFormatter "en-US" "USD"

euro.format 1000.0 // € 1.000,00
usd.format 1000.0 // $1,000.00
```
