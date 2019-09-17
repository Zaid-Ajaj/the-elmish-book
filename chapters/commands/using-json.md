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
          // simulate delay
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
Now we can convert JSON into these user defined types. Let us start with `Thoth.Json`

### Decoding JSON with `Thoth.Json`

