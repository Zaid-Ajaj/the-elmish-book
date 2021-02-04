# Using Thoth.Json

Previously on [Asynchronous XMLHttpRequest](async-xhr.md), we looked at how to retrieve data from a static file server, now we will *process* the data and show it to the user in a meaningful manner. JSON is the most common format of the data that is coming from the server. We will turn this JSON content into something that the Elmish application can actually work with.

To get started, I have set up a small application in the [elmish-with-json](https://github.com/Zaid-Ajaj/elmish-with-json) repository that loads JSON from the server and after a delay, shows it *as is* on screen:

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/elmish-json.gif" />
  </div>
</div>

The application just shows the JSON content as a *string* which represents information about a coffee shop. Currently the state and message of the application are modelled as follows, using `string` as the result of remote data we get back from the server:

```fsharp
type State =
  { StoreInfo: Deferred<Result<string, string>> }

type Msg =
  | LoadStoreInfo of AsyncOperationStatus<Result<string, string>>
```

> The types `Deferred<'t>` and `AsyncOperationStatus<'t>` are covered in section [Modelling Asynchronous State](async-state.md)


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
First of all, we can model a type that maps the structure of the JSON-formatted text into F# record types:
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
Now we can convert JSON into these user defined types such that we are not loading just a `string` from the server, but instead a `StoreInfo` object. The `State` type become the following:
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
          // JSON was parsed successfully into `StoreInfo`
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
Here, nothing changed when we receive the `LoadStoreInfo Started` message into the program, we simply load the JSON from the server. However, when the message `LoadStoreInfo (Finished (Ok storeInfoJson))` is received where `storeInfoJson` is a `string`, we try to parse that `string` into an instance of `StoreInfo` using the `parseStoreInfo` function. We haven't defined that function yet and we will be using `Thoth.Json` to do so.

> We keep the parsing of the JSON in the `update` function instead of inside the asynchronous command. This is because JSON parsing is a pure operation and can be unit-tested without involving any side-effects which are sometimes easier to discard when unit-testing the `update` function.

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

Now we can get back to the implementation of the `parseStoreInfo` function. From the way it is used in the code, you can infer that the type of this function is `string -> Result<StoreInfo, string>`. This is because the parsing might either be successful and return an instance of `StoreInfo`, or might fail and return a `string` in case the JSON is not well formatted or the decoding functions (see below) are looking for required fields that aren't present in the JSON content. Let us see how we can use `Thoth.Json` for decoding that JSON.

### Decoding JSON with `Thoth.Json`

First of all, let us install the library into the project so that we have that out of the way:
```bash
cd src
dotnet add package Thoth.Json
```
`Thoth.Json` is built around functional constructs called "Coders". Coders are *functions* that convert JSON and are divided into two categories:
 - *Encoders* that transform typed objects and values into JSON
 - *Decoders* that transform JSON into typed objects.

In this section, we will be using *decoders* because we want to convert JSON (decode it) into a typed object: the `StoreInfo` type. A decoder has the type:
```fsharp
type Decoder<'t> = (* ... *)
```
Never mind the actual type definition for now, we will get to that later but essentially a `Decoder<'t>` is a *function* that can read a piece of JSON and convert it to an instance of `'t`.

Built-in decoders in the `Thoth.Json` library do not understand complex user-defined types such as that of `StoreInfo` so we have to "teach" a bunch of little decoders how to work together and decode JSON into `StoreInfo` by combining and composing smaller decoders that operate on simpler primitive types.

For example to create a `Decoder<Product>` (a decoder which take a piece of JSON and converts it to `Product`) where `Product` has the fields `name:string` and `price:float`, we need to use `Decoder<string>` against the `name` field and `Decoder<float>` against the `price` field and *combine* both decoders to make up a `Decoder<Product>`.

The decoders `Decoder<string>` and `Decoder<float>` are built-in decoders in `Thoth.Json`.

Let's see how to build that `Decoder<Product>` in action and walk through the code:

```fsharp
let productDecoder : Decoder<Product> =
  Decode.object (fun get -> {
    name = get.Required.Field "name" Decode.string
    price = get.Required.Field "price" Decode.float
  })
```
Here, we are constructing the `Product` decoder using the `Decode.object` function. This is because we want to map a JSON object into the `Product` record. This function takes a single argument which is a "field getter" that allows you to define how the fields of the `Product` (the name and the price) can be decoded. In our case, we are decoding the `name` field using the `Decode.string` decoder which itself has type `Decoder<string>` and for the `price` field, we are using the `Decode.float` decoder which is of type `Decoder<float>`.

You can use this decoder to try parsing a piece of JSON into a record instance of `Product` as follows:
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
Here, we use the function `Decode.fromString` and give it two things: the decoder we want to use and the string to decode from (i.e. to deserialize). The output of that function is a proper `Result<Product, string>` because the parsing might either succeed and give you a `Product` back or it can fail and return the parsing error. This function has type:
```fsharp
Decode.fromString : Decoder<'t> -> string -> Result<'t, string>
```

The parsing can fail for many reasons, for example because of invalid JSON formatting, the JSON not being an object literal which is what we are decoding against, the fields being missing or having the wrong JSON type (e.g. `price` is a string).

Now that we have a `Decoder<Product>` we can use it as part of another, bigger decoder: `Decoder<StoreInfo>` because that is our object we want to parse:
```fsharp
let storeInfoDecoder : Decoder<StoreInfo> =
  Decode.object (fun get -> {
    name = get.Required.Field "name" Decode.string
    since = get.Required.Field "since" (Decode.map string Decode.int)
    daysOpen = get.Required.Field "daysOpen" (Decode.list Decode.string)
    products = get.Required.Field "products" (Decode.list productDecoder)
  })
```
Same as with the previous decoder, we are using `Decode.object` and requiring fields at their respective JSON path. However, notice the `Decoder.list`: because we do not just want to decode a single product, but instead a list of products, we *transform* the decoder `productDecoder` into a new decoder that understands lists of that thing which the old decoder parses. To put it simply, `Decode.list` takes a `Decoder<'t>` and returns `Decoder<'t list>`.
```fsharp
Decode.list : Decoder<'t> -> Decoder<'t list>

productDecoder : Decoder<Product>

Decode.list productDecoder : Decoder<Product list>
```
Another thing to notice as well is the field `since`. It is defined as a string in the `StoreInfo` record but in the JSON object we have as an integer. Since it is an integer in the JSON, we have to decode it using `Decode.int` which is a `Decoder<int>` but we *map* the result of the decoding (when it is successful) into another value which is in our case just making a `string` from the integer that was decoded.
```fsharp
Decode.map : Decoder<'t> -> ('t -> 'u) -> Decoder<'u>

Decoder.int : Decoder<int>

Decoder.map Decoder.int string : Decoder<string>
// Same as
Decoder.map Decoder.int (fun parsedInt -> string parsedInt) : Decoder<string>
```
Now we have our decoders ready to define the `parseStoreInfo` function that we want to use inside of the `update` function:
```fsharp
let parseStoreInfo (inputJson: string) : Result<StoreInfo, string> =
  Decode.fromString storeInfoDecoder inputJson
```
This can be simplified even further:
```fsharp
let parseStoreInfo = Decode.fromString storeInfoDecoder
```
Et voilà, the application is now parsing the JSON and showing data on screen.

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/thoth-working.gif" />
  </div>
</div>

You can see the full worked out example at [elmish-with-json-thoth](https://github.com/Zaid-Ajaj/elmish-with-json-thoth) on Github.

### Automatic Converters In Thoth.Json

In this example of parsing the JSON, we have been using the *manual* way of parsing with decoders using `Thoth.Json`. You might have wondered, if the library already knows the types of the record fields, can't the library automatically implement a decoder based on the record type itself? Yes, it can! Thoth.Json makes use of the Reflection capabilities in Fable which allows it to inspect the type information and metadata from which it can infer a decoder that can parse the corresponding JSON structure. However, in order for the automatic conversion to work, the shape of the JSON has to match that of the F# type but that is not entirely the case of our store information: the `since` field is an integer in in the JSON but it is a `string` in the `StoreInfo` type. So we have to refactor `StoreInfo` and change the `since` field into an integer as well:
```fsharp {highlight: [3]}
type StoreInfo = {
  name: string
  since: int
  daysOpen: string list
  products: Product list
}
```
Now we only have to write the following:
```fsharp
open Thoth.Json

let parseStoreInfo (json: string) : Result<StoreInfo, string> =
  Decode.Auto.fromString<StoreInfo>(json)
```
That is it! The function `Decode.Auto.fromString<'t>(json: string)` uses the metadata of type `'t` to infer how the type should be decoded from the input JSON string. This function is also *safe*: it returns `Result<'t, string>` which can either be the successfully decoded `'t` or a nice error message telling you where the decoding went wrong.
