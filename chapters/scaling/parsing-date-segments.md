# Parsing Date Segments

A lot of times, the URL may contain a segment that represent a *date*, these dates can be encoded in multiple ways such as:
 - `/visitors/report/{day:int}-{month:int}-{year:int}`
 - `/orders/filter?from={day:int}-{month:int}-{year:int}`

These URL may have the date components (i.e. day, month and year) in different segments or they can be encoded in a query string parameter. Let us try to come up with a simple way to parse these dates. Using just `Route.Int` won't be enough to match against a valid date pattern because the date components aren't simply integers. I would write a small library to do the parsing but I think the solution is simple enough that can be implemented in one function. I would write a module called `Date` and write a function there called `create` as follows:
```fsharp
[<RequireQualifiesAccess>]
module Date

open System

let (|Between|_|) (x: int) (y: int) (input: int) =
    if input >= x && input <= y
    then Some()
    else None

let isLeapYear (year: int) = DateTime.IsLeapYear(year)

type DateParts =
  { day: int
    month: int
    year: int }

let create (parts: DateParts) : Option<DateTime> =
  let day, month, year = parts.day, parts.month, parts.year
  if year <= 0 then
      None
  else
    match month, day with
    | 2, Between 1 29 when isLeapYear year -> Some (DateTime(year, month, day))
    | 2, Between 1 28 when not (isLeapYear year) -> Some (DateTime(year, month, day))
    | (1 | 3 | 5 | 7 | 8 | 10 | 12), Between 1 31 -> Some (DateTime(year, month, day))
    | (4 | 6 | 9 | 11), Between 1 30 -> Some (DateTime(year, month, day))
    | _ -> None
```
For all intents and purposes, this small module parses date parts (day, month and year) and tries to convert them into an instance of `DateTime` if the combination of parts is valid. It can be used with `Route.Int` to parse date segments from the URL as follows. First the segment has to be splitted by dashes (`-`) to get the separate parts as strings and match them with `Route.Int` to convert them into integers before using these as input for the `Date.create` function:
```fsharp
let activePage =
  match state.CurrentUrl with
  | [ "visitors"; "report"; dateSegment ] ->
      match dateSegment.Split '-' with
      | [| Route.Int day; Route.Int month; Route.Int year |] ->
          match Date.create { day = day; month = month; year = year } with
          | Some date -> Html.h1 "Show visitors report"
          | None -> Html.h1 "Not Found"
      | _ ->
        Html.h1 "Not Found"

  | [ "orders"; "filter"; Route.Query [ "from"; dateSegment ] ] ->
      match dateSegment.Split '-' with
      | [| Route.Int day; Route.Int month; Route.Int year |] ->
          match Date.create { day = day; month = month; year = year } with
          | Some date -> Html.h1 "Show filtered orders"
          | None -> Html.h1 "Not Found"
      | _ ->
        Html.h1 "Not Found"

  | _ ->
    Html.h1 "Not Found"
```
Even this snippet can be simplified even further by creating a pattern to match against date segments:
```fsharp
let (|Date|_|) (dateSegment: string) =
  match dateSegment.Split '-' with
  | [| Route.Int day; Route.Int month; Route.Int year |] ->
      Date.create { day = day; month = month; year = year; }
  | _ ->
      None
```
This simplifies the parsing into a simple function:
```fsharp
let activePage =
  match state.CurrentUrl with
  // matches /visitors/report/{Date}
  | [ "visitors"; "report"; Date date ] -> Html.h1 "Show visitors report"
  // matches /orders/filter?from={Date}
  | [ "orders"; "filter"; Route.Query [ "from"; Date date ] ] -> Html.h1 "Show filtered orders"
  // matches anything else
  | _ -> Html.h1 "Not Found"

```
`Date` is now a primitive active pattern that can be used as easily as `Route.Int` to match against date segments in the URL. Of course, depending on your application, the format might differ so you might have to adjust the code to suit your requirements.