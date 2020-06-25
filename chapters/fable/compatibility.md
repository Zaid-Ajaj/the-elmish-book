# Compatibility with .NET

The base class library or *BCL* for short are those native APIs from .NET that F# can use in normal F# applications. Think the namespaces that start with `System.*`. In the previous counter example, we used `System.Random` to generate random numbers which is a class from the BCL that we were able to use and run in the browser.

Although we were using the `System.Random` class, the actual implementation is not .NET code. Under the hood, Fable translates these APIs to something that already (hopefully) exists in the native JavaScript APIs which is in this specific case the `Math.random()` function.

Supporting *all* of the base class library is not a goal for Fable, and when certain BCL functionality is needed, then a binding to the native equivalent of the feature will be the way to go.

Fable tries to support certain BCL functions and classes when *'it makes sense'* because Fable compiles F# with the assumption that the code will run inside a JavaScript runtime, like V8 in the browser or Node.js on the server. In many cases, the APIs provided in the BCL do not work out of the box in these JavaScript environments. For example, multi-threading APIs within the `System.Threading.Tasks` namespace are not supported because JavaScript environments are usually single-threaded.

Likewise, APIs from `System.IO` are not supported because JavaScript in the browser cannot access the file system by default. However, JavaScript on the server *should* be able to access the file system and do all sorts of crazy things on the hosting machine. In such cases, we will use JavaScript-specific APIs from Node.js. Again, we will use a binding to access these APIs, the binding `Fable.Node` covers most built-in modules from Node.js.

That said, there are many supported APIs from the base class library that Fable compiles while maintaining the same behaviour you would expect if you were running the code from F# on .NET. So let us go through a quick tour of these APIs.

### Numeric types

While JavaScript only has the `Number` type (64-bit floating point number, the same as `System.Double`) to represent numbers, the BCL has many numeric types besides `System.Double`, with varying sizes. Fable implements those with exact arithmetic precision out of the box: `System.Int16` (short), `System.Int64` (long), `System.Decimal` and even `System.Numerics.BigInt`, as well as the unsigned counter-parts of the integers.

### Date/Time

.NET has `System.DateTime` to represent dates and times. Fable supports this type and the `DateTime` API of static functions, as well as a subset of `System.TimeSpan` and `System.DateTimeOffset`. It is worth noting that a `DateTime` instance compiles down to a `Date` instance in JavaScript, which makes interoperability even more straightforward.

### Converters

APIs from `System.Convert` and `System.BitConverter` are supported. Although I must mention that there are some subtleties when you use these classes in the browser versus on the server. For example, the functions `Convert.FromBase64String` and `Convert.ToBase64String` use [atob](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/atob) and [btoa](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa) under the hood. These are native browser functions and will not run out of the box within Node.js environments (at least at the time of writing). In such cases, you would have to provide a binding that *does* work with Node.js by using [Buffers](https://nodejs.org/api/buffer.html#buffer_class_method_buffer_from_string_encoding):

```fsharp
[<Emit("Array.prototype.slice.call(Buffer.from($0, 'base64'))")>]
let fromBase64 (value: string) : byte array = jsNative
```

This is just to show that not everything is supported by default using Fable and that sometimes you might need to work around these rare situations.

### Regular Expression

Although the .NET API for `Regex` is supported, the code compiles down to the `Regex` instance of JavaScript which has a different feature-set than the features provided by the native .NET API. When using `Regex` with Fable, it is the same as if you instantiated a `Regex` instance on .NET with `RegexOptions.EcmaScript`. See the differences [outlined here](https://www.regular-expressions.info/dotnet.html).

### Globalization

Although the numeric and date types are supported, the formatting APIs of these types using `CultureInfo` are *not*. There are a couple of reasons for this. Most importantly, such a feature would inflate the bundle size of the generated JavaScript. .NET's support for globalization includes a lot of static information about the different `CultureInfo` instances: names of days, months, currencies, digit separators and a lot more that you likely will never use. Aside from the bundle size, implementing globalization from scratch is a daunting task with high maintenance costs. Luckily though, there exists native and standard globalization support in JavaScript runtime, that, funny enough is called [Internationalization](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl). In both browser and Node.js you can easily make use of this through the interoperability features of Fable:

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

### System.Xml

Types from this namespace are not implemented. Similar to the Globalization namespace, maintenance costs are just too high for a proper implementation in the core Fable library. However, we still are able to write a binding for an existing XML processing library in JavaScript and use it from our Fable projects. In the browser, there is already the [DOMParser](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser) type that allows us to work with XML documents. This `DOMParser` has an API that is very similar to that of `XmlDocument` in .NET. Unfortunately, the binding for the API still needs to implemented. Another downside of `DOMParser` is that it cannot be used in a Node.js environment because it is only available in a browser environment by default. I personally don't like the `DOMParser` API and since the functionality is only available in the browser, I decided to build my own XML parser library for Fable without any environment-specific dependencies such that it would work out of the box for node.js and the browser. Enter [Fable.SimpleXml](https://github.com/Zaid-Ajaj/Fable.SimpleXml): a very simple XML parser for Fable. It will handle 99% of everyday use-cases when working with XML.

### System.Guid

The `Guid` type is supported in Fable and is represented as a string during runtime when compiled to JavaScript. You can generate new instances of `Guid` using the `Guid.NewGuid()` function. The function is implemented using `Math.random` under the hood.