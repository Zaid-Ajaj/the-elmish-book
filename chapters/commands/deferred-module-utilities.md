# Deferred Module Utilities

Previously on [Modelling Asynchronous State](async-state) we discussed and learnt about the `Deferred<'T>` type which models the state of a piece of data that is yet to be retrieved from an external source like an HTTP web service. After we have modelled our data using this type, it is very easy to work with it efficiently: to access the `'T` in `Deferred<'T>` we always have to pattern match against the type, specifically matching the `Resolved` case and transforming the value. The same applies when we want to check whether the `Deferred<'T>` is still in progress to show some loading icon: we have pattern match against the `InProgress` case and return `true` if that is the case.

We can make our lives better by extracting common patterns of working with the `Deferred<'T>` type into a specialized module which we will call `Deferred`:
```fsharp
[<RequireQualifiedAccess>]
/// Contains utility functions to work with value of the type `Deferred<'T>`.
module Deferred

/// Returns whether the `Deferred<'T>` value has been resolved or not.
let resolved = function
    | HasNotStartedYet -> false
    | InProgress -> false
    | Resolved _ -> true

/// Returns whether the `Deferred<'T>` value is in progress or not.
let inProgress = function
    | HasNotStartedYet -> false
    | InProgress -> true
    | Resolved _ -> false

/// Transforms the underlying value of the input deferred value when it exists from type to another
let map (transform: 'T -> 'U) (deferred: Deferred<'T>) : Deferred<'U> =
    match deferred with
    | HasNotStartedYet -> HasNotStartedYet
    | InProgress -> InProgress
    | Resolved value -> Resolved (transform value)

/// Verifies that a `Deferred<'T>` value is resolved and the resolved data satisfies a given requirement.
let exists (predicate: 'T -> bool) = function
    | HasNotStartedYet -> false
    | InProgress -> false
    | Resolved value -> predicate value

/// Like `map` but instead of transforming just the value into another type in the `Resolved` case, it will transform the value into potentially a different case of the the `Deferred<'T>` type.
let bind (transform: 'T -> Deferred<'U>) (deferred: Deferred<'T>) : Deferred<'U> =
    match deferred with
    | HasNotStartedYet -> HasNotStartedYet
    | InProgress -> InProgress
    | Resolved value -> transform value
```
These are the most commonly used functions when working with values of the type `Deferred<'T>`. You can simply add a file in your project with these functions and modify them as you see fit. I don't plan on making a specialized package just for these couple of functions since writing them and modifying them is easy enough to do on a per project basis.