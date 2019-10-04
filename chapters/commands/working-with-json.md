# Working with JSON

The information we get back from a web server using HTTP is usually not just plain text as in with the Lorem Ipsum snippet we retrievd in the previous section but very often the text we get back is *structured* where JSON is the most commonly used format to structure that text.

> We usually say "We get JSON from the web server" as a short hand for "We get text back from the web server structured as JSON"

Now understanding JSON and being able to parse the JSON-formatted text is esential to virtually every modern web application that communicates with an external web server as JSON is the de-facto format for the data being exchanged.

Parsing the JSON means that we convert the text into a structured type that we can work and manipulate in our applications.

In Fable, there two main libraries to work with JSON:
 - [Thoth.Json](https://mangelmaxime.github.io/Thoth/json/v3.html) by [Maxime Mangel](https://github.com/MangelMaxime) - Uses JSON encoders and decoders to transform JSON structures into user-defined types, inspired by the Elm package [elm/json](https://package.elm-lang.org/packages/elm/json/latest/). Comes with built-in "automatic converters".
 - [Fable.SimpleJson](https://github.com/Zaid-Ajaj/Fable.SimpleJson) - Converts JSON-formatted text itself into a JSON structure that can be manipulated, searched and transformed into other structures. Comes with built-in "automatic converters".

> Automatic converters are used to let the library transform the JSON-formatted text into typed entities automatically by means of Reflection (F#/.NET mechanism for type-introspection), this works nicely for 99% of the time and saves you from having to write conversion code by yourself.

We will try to understand and learn how to work with both libraries. Although both libraries somewhat overlap with the functionality they provide, both follow different ways of solving certain problems and one might be more suitable than the other for different situations.