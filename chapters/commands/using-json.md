# Thoth.Json and SimpleJson

Previously on [Asynchronous XMLHttpRequest](async-xhr.md), we looked at how to retrieve data from a static file server, now we will *process* the data and show it to the user in a meaningful manner. To do that, we will be using both [Thoth.Json](https://mangelmaxime.github.io/Thoth/json/v3.html) and [Fable.SimpleJson](https://github.com/Zaid-Ajaj/Fable.SimpleJson) to decode the JSON text into user defined types, of course we will use them separately so that we can compare both approaches to JSON decoding.

To get started, I have set up a small application in the [elmish-with-json](https://github.com/Zaid-Ajaj/elmish-with-json) repository that loads JSON from the server and after a delay, shows it *as is* on screen:

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/elmish-json.gif" />
  </div>
</div>

The application just shows the JSON content as a *string* which represents information about a coffee shop, this is also how the types are modelled:
```fsharp
type State =
  { StoreInfo: Deferred<Result<string, string>> }

type Msg =
  | LoadStoreInfo of AsyncOperationEvent<Result<string, string>>
```

> The types `Deferred<'t>` and `AsyncOperationEvent<'t>` are covered in section [Modelling Asynchronous State](async-state.md)


The implementation of `init` and `update` is self-explanatory at this point I hope:
```fsharp {highlight: [12]}
let init() =
  { StoreInfo = HasNotStartedYet }, Cmd.ofMsg (LoadStoreInfo Started)

let update (msg: Msg) (state: State) =
  match msg with
  | LoadStoreInfo Started ->
      let nextState = { state with StoreInfo = InProgress }
      let loadStoreInfo =
        async {
          // simulate network latency
          do! Async.Sleep 1500
          let! (statusCode, storeInfo) = Http.get "/store.json"
          if statusCode = 200
          then return LoadStoreInfo (Finished (Ok storeInfo))
          else return LoadStoreInfo (Finished (Error "Could not load the store information"))
        }

      nextState, Cmd.fromAsync loadStoreInfo

  | LoadStoreInfo (Finished result) ->
      let nextState = { state with StoreInfo = Resolved result }
      nextState, Cmd.none
```
Now instead of reading the contents as a string, we want to convert that string into a type and populate its data from the JSON contents. The JSON-formatted text looks as follows:
```json
{
  "name": "Best Coffee Ever",
  "since": 2010,
  "daysOpen": [
    "Monday",
    "Tuesday",
    "Wednesday"
  ],
  "products": [
    {
        "name": "Coffee",
        "price": 1.5
    },
    {
        "name": "Cappuccino",
        "price": 2.0
    }
  ]
}
```
First of all, we can model a type that maps the structure of the JSON-formatted text as follows:
```fsharp
type Product = {
  name: string
  price: float
}

type StoreInfo = {
  name: string
  since: string
  daysOpen: string list
  products: Product list
}
```
Now we can convert JSON into these user defined types such that we are not just loading a `string` from the server, but instead a `StoreInfo` object. The `State` type become the following:
```fsharp
type State =
  { StoreInfo: Deferred<Result<StoreInfo, string>> }
```
I've kept the error type to a `string` because we still want to show a textual error message when something goes wrong. Now notice the highlighted code where we receive the JSON from  the server and try to parse it:
```fsharp {highlight: ['17-29']}
let update (msg: Msg) (state: State) =
  match msg with
  | LoadStoreInfo Started ->
      let nextState = { state with StoreInfo = InProgress }
      let loadStoreInfo =
        async {
          // simulate network latency
          do! Async.Sleep 1500
          let! (statusCode, storeInfo) = Http.get "/store.json"
          if statusCode = 200
          then return LoadStoreInfo (Finished (Ok storeInfo))
          else return LoadStoreInfo (Finished (Error "Could not load the store information"))
        }

      nextState, Cmd.fromAsync loadStoreInfo

  | LoadStoreInfo (Finished (Ok storeInfoJson)) ->
      // Here, we are able to retrieve the JSON from the server
      // Now we try to parse thr JSON to a `StoreInfo` instance
      match parseStoreInfo storeInfoJson with
      | Ok storeInfo ->
          // JSON was paresed succesfully into `StoreInfo`
          let nextState = { state with StoreInfo = Resolved (Ok storeInfo) }
          nextState, Cmd.none

      | Error error ->
          // JSON parsing failed here :/
          let nextState = { state with StoreInfo = Resolved (Error error) }
          nextState, Cmd.none

  | LoadStoreInfo (Finished (Error httpError)) ->
      let nextState = { state with StoreInfo = Resolved (Error httpError) }
      nextState, Cmd.none
```
Here, nothing changed when we receive the `LoadStoreInfo Started` message into the program, we simply load the JSON from the server. However, when message `LoadStoreInfo (Finished (Ok storeInfoJson))` is received where `storeInfoJson` is a `string`, we try to parse that piece of string into an instance of `StoreInfo` using the `parseStoreInfo` function. We haven't defined that function yet and we will be using with `Thoth.Json` to do so.

> We keep the parsing of the JSON in the `update` function instead of inside the asynchronous command. This is because JSON parsing is a pure operation and can be unit-tested without involding any side-effects which are sometimes discarded when unit-testing the `update` function.

We also now get a compile error in the `render` function because it doesn't know how to render the `StoreInfo`:
```fsharp {highlight: [11, 12, 13]}
let render (state: State) (dispatch: Msg -> unit) =
  match state.StoreInfo with
  | HasNotStartedYet -> Html.none
  | InProgress -> Html.h1 "Loading..."
  | Resolved (Error errorMsg) ->
      Html.h1 [
        prop.style [ style.color.red ]
        prop.text errorMsg
      ]

  | Resolved (Ok products) ->
      // COMPILE ERROR
      Html.pre products
```
Let us fix that real quick by making it render information from the store:
```fsharp {highlight: ['11-18']}
let render (state: State) (dispatch: Msg -> unit) =
  match state.StoreInfo with
  | HasNotStartedYet -> Html.none
  | InProgress -> Html.h1 "Loading..."
  | Resolved (Error errorMsg) ->
      Html.h1 [
          prop.style [ style.color.red ]
          prop.text errorMsg
      ]

  | Resolved (Ok storeInfo) ->
      Html.div [
        Html.h1 storeInfo.name
        Html.ul [
          for product in storeInfo.products ->
          Html.li product.name
        ]
      ]
```

Now we can get back to the implementation `parseStoreInfo` function. From the way it is used in the code, you can infer that the type of such function is `string -> Result<StoreInfo, string>`. This is because parsing usually might either be succesful and returns an instance of `StoreInfo` or might fail and returns a `string` in case the JSON is not well formatted or the decoding functions (see below) are looking for required fields that aren't present in the JSON content. Let us see how we can use `Thoth.Json` for decoding that JSON.

### Decoding JSON with `Thoth.Json`

First of all, let us install the library into the project so that we have that out of the way:
```bash
cd src
dotnet add package Thoth.Json
```
This package is built around functional contructs called "Coders". Coders are *functions* that convert JSON and are divided into two categories:
 - *Encoders* that transform typed objects and values into JSON
 - *Decoders* that transform JSON into typed objects.

In this section, we will be using *decoders* because we want to convert JSON (decode it) into a typed object: the `StoreInfo` type. A decoder has the type:
```fsharp
type Decoder<'t> = (* ... *)
```
Never mind the actual type definition for now, we will get to that later but essentially a `Decoder<'t>` is a *function* that can read a piece of JSON and converts it to an instance of `'t`.

Standard built-in decoders in the Thoth.Json library do not understand complex types such as that of `StoreInfo` so we have to "teach" a bunch of little decoders how to decode JSON into it by combining and composing smaller decoders that work with primitive types.

For example to create a `Decoder<Product>` (a decoder which take a piece of JSON and converts it to `Product`) where `Product` has the fields `name:string` and `price:float`, we need to use `Decoder<string>` against the `name` field and `Decoder<float>` against the `price` field and *combine* both decoders to make up a `Decoder<Product>`.

The decoders `Decoder<string>` and `Decoder<float>` are built-in decoders in `Thoth.Json`.

Let's see how to build that `Decoder<Product>` in action and walk through the code:

```fsharp
let productDecoder : Decoder<Product> =
  Decode.object (fun field -> {
    name = field.Required.At [ "name" ] Decode.string
    price = field.Required.At [ "price" ] Decode.float
  })
```
Here, we are constructing the `Product` decoder using the `Decode.object` function. This is because we want to map a JSON object into the `Product` record. This function takes a single argument which is a "field getter" that allows you to define how the fields of the `Product` (the name and the price) can be decoded. In our case, we are decoding the `name` field using the `Decode.string` decoder which itself has type `Decoder<string>` and the for `price` field, we are using the `Decode.float` decoder which is of type `Decoder<float>`.

You can use this decoder to try parse a piece of JSON into a record instance of `Product` as follows:
```fsharp
let productJson = """
  {
    "name": "Mocha",
    "price": 2.25
  }
"""

let product : Result<Product, string> =
  Decode.fromString productDecoder productJson
```
Here, we are using the function `Decode.fromString` and giving it two things: the decoder we want to use and the string to decode from (i.e. to deserialize). The output of that function is a proper `Result<Product, string>` because the parsing might either succeed and gives you a `Product` back or it can fail and returns you the parsing error.

The parsing can fail for many reasons, for example because of invalid JSON formatting, the JSON not being an object literal which is what we are decoding against, the fields being missing or having the wrong the JSON type (i.e. `price` is a string).

Now that we have a `Decoder<Product>` we can use it as part of another, bigger decoder: `Decoder<StoreInfo>` because that is our object we want to parse. Here we go:
```fsharp
let storeInfoDecoder : Decoder<StoreInfo> =
  Decode.object (fun field -> {
    name = field.Required.At [ "name" ] Decode.string
    since = field.Required.At [ "since" ] (Decode.map string Decode.int)
    daysOpen = field.Required.At [ "daysOpen" ] (Decode.list Decode.string)
    products = field.Required.At [ "products" ] (Decode.list productDecoder)
  })
```
Same as with the previous decoder, we are using `Decode.object` and requiring fields at their respective JSON path. However, notice the `Decoder.list`: because we do not just want to decode a single product, but instead a list of products, we *transform* the decoder `productDecoder` into a new decoder that understands lists of that old decoder. To put simply, here are the types:
```fsharp
Decode.list : Decoder<'t> -> Decoder<'t list>

productDecoder : Decoder<Product>

Decode.list productDecoder : Decoder<Product list>
```
Another thing to notice as well is the field `since`. It is defined as a string in the `StoreInfo` record but in the JSON object we have as an integer. Since it is an integer in the JSON, we have to decode it using `Decode.int` which is a `Decoder<int>` but we *map* the result of the decoding (when it is succesfull) into another value which is in our case just making a `string` from the integer that was decoded.
```fsharp
Decode.map : Decoder<'t> -> ('t -> 'u) -> Decoder<'u>

Decoder.int : Decoder<int>

Decoder.map Decoder.int string : Decoder<string>
// Same as
Decoder.map Decoder.int (fun parsedInt -> string parsedInt) : Decoder<string>
```
And now we have our decoders ready to define the `parseStoreInfo` function that we want to use inside of the `update` function:
```fsharp
let parseStoreInfo (inputJson: string) : Result<StoreInfo, string> =
  Decoder.fromString storeInfoDecoder inputJson
```
This can be simplified even further:
```fsharp
let parseStoreInfo = Decoder.fromString storeInfoDecoder
```
Et voilà, the application is now parsing the JSON and showing data on screen.

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/thoth-working.gif" />
  </div>
</div>

You can see the full worked out example at [elmish-with-json-thoth](https://github.com/Zaid-Ajaj/elmish-with-json-thoth) on Github.

### Time for Fable.SimpleJson

Now we have seen how to parse the JSON contents into `StoreInfo` and how easy it is to do that with `Thoth.Json`, let us take a look at a different approach using [Fable.SimpleJson](https://github.com/Zaid-Ajaj/Fable.SimpleJson.git) and afterwards we can compare both approaches to see which one is more suitable for different tasks.

First things first, we start by installing the library into the project so we can use it:
```bash
cd src
dotnet add package Fable.SimpleJson
```

While `Thoth.Json` uses composed decoders to parse the JSON into the proper types, `SimpleJson` has to no such thing. All that `SimpleJson` does is parse the JSON, which is initially a string, into a *generic JSON data structure*:
```fsharp
/// A type representing Javascript Object Notation
type Json =
  | JNumber of float
  | JString of string
  | JBool of bool
  | JNull
  | JArray of Json list
  | JObject of Map<string, Json>
```
Once `SimpleJson` gives you a value of type `Json`, it is up to how you convert it into your specialized types like `Product` and `StoreInfo`. Let us see how this works in action by writing a function that tries to parse a `Json` value into a `Product`:
```fsharp
open Fable.SimpleJson

let parseProduct (value: Json) : Option<Product> =
  match value with
  | JObject product ->
      let name = Map.tryFind "name" product
      let price = Map.tryFind "price" product
      match name, price with
      | Some (JString name), Some (JNumber price) ->
          Some { name = name; price = price }
      | _ ->
          None
  | _ ->
    None
```
Here we using F#'s pattern matching to look for the expected shape of a product and mapping the values of the fields of that product into a `Product` instance. Because we know that `Product` must be an object, we match against `JObject product` where `product` has type `Map<string, Json>` which itself can be traversed using `Map` functions such as `Map.tryFind` to find the specific fields of the `Product`.

Notice that we choose here to return `Option<Product>` but we could have chosen to return `Result<Product, string>` instead as follows:
```fsharp
let parseProduct (value: Json) : Result<Product, string> =
  match value with
  | JObject product ->
      let name = Map.tryFind "name" product
      let price = Map.tryFind "price" product
      match name, price with
      | Some (JString name), Some (JNumber price) ->
          Some { name = name; price = price }
      | _ ->
          Error "The JSON object didn't have matching fields with Product"
  | _ ->
    Error "The JSON value wasn't an object that matches with Product"
```
It is up to you how much details you want to put in these error messages. You would to expand the pattern matching of the fields if you want to be more specific with your error messages. This is unlike `Thoth.Json` which automatically generates nice error messages if the fields and / or their types of the JSON do not match those of the F# type that we are decoding into.

In any case, we can can complete the parsing by writing a function that now parses JSON into `StoreInfo`:
```fsharp
open Fable.SimpleJson

let parseStoreInfo (json: string) : =
  // tryParseNative : string -> Option<Json>
  match SimpleJson.tryParseNative json with
  | Some (JObject storeInfo) ->
      let name = Map.tryFind "name" storeInfo
      let since = Map.tryFind "since" storeInfo
      let daysOpen = Map.tryFind "daysOpen" storeInfo
      let products = Map.tryFind "products" storeInfo
      match name, since, daysOpen, products with
      | Some (JString name), Some (JNumber since), Some (JArray days), Some (JArray products) ->
          let days = days |> List.choose (function | JString day -> Some day | _ -> None)
          let products = products |> List.choose parseProduct
          Ok {
            name = name
            since = string since
            daysOpen = days
            products = products
          }
      | _ ->
        Error "properties of the parsed JSON were not found or had the wrong type"
  | _ ->
    Error "Parsed JSON is not valid or is not an object"
```
This is the same `parseStoreInfo` we wrote before but instead now using `SimpleJson`. Effectively the program works the same as it did when we were parsing with `Thoth.Json`.

### Automatic converters: Fable.SimpleJson vs. Thoth.Json

In the last two examples of parsing using either libraries, we have been using the *manual* way of parsing whether is it using decoders with `Thoth.Json` or pattern matching with `SimpleJson`. However, both libraries include automatic parsing capabilities that match the JSON structure with the F# type and instantiate it directly using Fable's Reflection.

In order for the automatic conversion to work, the shape of the JSON has to match that of the F# type but that is not entirely the case of our store information: the `since` field is an integer in in the JSON but it is a `string` in the `StoreInfo` type. So we have to refactor the `StoreInfo` and change the `since` field into an integer as well:
```fsharp {highlight: [3]}
type StoreInfo = {
  name: string
  since: int
  daysOpen: string list
  products: Product list
}
```
Without matching the JSON and F# type, `Thoth.Json` will give you an error saying that it could not convert an integer into a string for the field `since` which is totally correct. On the other hand, `Fable.SimpleJson` is more forgiving in these cases and it will just stringify the integer into a string to make it match the F# type.

Using `Fable.SimpleJson`:
```fsharp
open Fable.SimpleJson

let inline parseStoreInfo (json: string) : Result<StoreInfo, string> =
  Json.tryParseNativeAs<StoreInfo> json
```
That's it! The function `Json.tryParseNativeAs<'t>` will do the magic conversion internally. Using `Thoth.Json`, it is just as simple:
```fsharp
open Thoth.Json

let inline parseStoreInfo (json: string) : Result<StoreInfo, string> =
  Decode.Auto.fromString<StoreInfo>(json)
```
Nothing else required, both functions do basically the same thing.

> It is very important to understand that the *inlining* of the conversion function is required! Whenver you use Fable's reflection capabilites to retrieve type meta-data in runtime, the types *must* be known at compile-time. This is because Fable includes the Reflection meta-data on demand as in with the examples above to avoid having to include all the meta-data of all used types when they are not needed.

### Comparison Fable.SimpleJson vs Thoth.Json

We have now seen how to parse a piece of JSON using the *manual* and *automatic* way and building typed records from it. When it comes to the automatic converters, both `Thoth.Json` and `Fable.SimpleJson` do pretty much the same except that `Thoth.Json` has nicer error messages and `Fable.SimpleJson` are less strict.

However, when it comes to the manual converters it is a different story. You must be wondering something along the lines: "Aren't these `SimpleJson` stuff supposed to be, well *simple* to work with? The Thoth.Json approach is obviously simpler and cleaner." I would definitely agree to that statement.

Decoders from `Thoth.Json` are really cool, you can compose them together in a functional manner to make bigger decoders and they will automatically nice error messages for you without the explicit matching of JSON structure that is going on with `Fable.SimpleJson`. In the use-case above and general JSON-parsing scenario's I would recommend `Thoth.Json`.

The explicitness of `Fable.SimpleJson` comes from the fact that it operates on a *lower-level* than `Thoth.Json` does to process the JSON: `SimpleJson` gives you [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) of the JSON to work with. Transforming the JSON into typed entities is only one use-case of such AST. Another use case for the AST is *re-write* into another AST before processing it further if you have a piece of JSON that isn't easily convertable using decoders. Take this structure of the JSON:
```json
{
  "RequestId:0HKV9C49II9CK": {
    "Path": "/api/documents/read/2",
    "Method": "GET",
    "Duration": 1617,
    "Status": 200
  }
}
```
The keys of the object themselves contain data and they are not valid names of fields. You can use `Fable.SimpleJson` to *preprocess* and *rewrite* the structure of the JSON above into something that is *decoder-friendly* and let `Thoth.Json` take over from that point:
```json
[
  {
    "RequestId": "0HKV9C49II9CK",
    "Path": "/api/documents/read/2",
    "Method": "GET",
    "Duration": 1617,
    "Status": 200
  }
]
```

### Conclusion

Although `Thoth.Json` and `Fable.Simple` seem to overlap a lot in functionality, they can have different purposes and depending on your task as hand, one can more suitable than the other. In cases where you writing the parsing of the JSON by hand (the manual way) I would definitely use `Thoth.Json` because of it's elegant functional nature and ease of use. However, for low-level JSON operations and library infrastructure that require a very flexibel API, then I would go for `Fable.SimpleJson`. This has been a success story where `Fable.SimpleJson` has been an infrastructure component of [Fable.Remoting](https://github.com/Zaid-Ajaj/Fable.Remoting) and [Elmish.Bridge](https://github.com/Nhowka/Elmish.Bridge).