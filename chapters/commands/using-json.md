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