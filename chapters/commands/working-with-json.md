# Working with JSON

The information we get back from a web server using HTTP is usually not just plain text. Unlike the Lorem Ipsum snippet we retrieved in the previous section, very often the text we get back is *structured* where JSON is the most commonly used format to structure that text.

> We usually say "We get JSON from the web server" as shorthand for "We get text back from the web server structured as JSON"

Now understanding JSON and being able to parse the JSON-formatted text is essential to virtually every modern web application that communicates with an external web server as JSON is the de-facto format for the data being exchanged.

Parsing the JSON means that we convert the text into a structured type that we can work and manipulate in our applications.

In Fable, there are two main libraries to work with JSON:
 - [Thoth.Json](https://mangelmaxime.github.io/Thoth/json/v3.html), written by [Maxime Mangel](https://github.com/MangelMaxime) . It uses JSON encoders and decoders to transform JSON structures into user-defined types or vice-versa. It is inspired by the Elm package [elm/json](https://package.elm-lang.org/packages/elm/json/latest/). Comes with built-in "automatic converters".
 - [Fable.SimpleJson](https://github.com/Zaid-Ajaj/Fable.SimpleJson) written by yours truly. It converts JSON-formatted text itself into a JSON structure that can be manipulated, searched and transformed into other structures. Comes with built-in "automatic converters".

Automatic converters are used to let the library transform the JSON-formatted text into typed entities automatically by means of Reflection (F#/.NET mechanism for type-introspection), this works nicely for 99% of the time and saves you from having to write conversion code by yourself.

In the rest of the this chapter, we will focus primarily on [Thoth.Json](https://mangelmaxime.github.io/Thoth/json/v3.html) because it has a really nice API to work with from Elmish applications. Fable.SimpleJson on the other hand, exposes a *low-level* API to manipulate and transform JSON itself which makes it more useful as a backbone for other libraries or infrastructure code. For example, Fable.SimpleJson is the power-engine behind [Fable.Remoting](https://github.com/Zaid-Ajaj/Fable.Remoting) and [Elmish.Bridge](https://github.com/Nhowka/Elmish.Bridge) where the library handles the deserialization of types on the front-end correctly and efficiently.