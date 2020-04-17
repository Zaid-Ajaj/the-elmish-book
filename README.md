# The Elmish Book

The Elmish Book is a practical guide to building modern and reliable web applications in F# from first principles. We will be using the [Fable](https://fable.io/) compiler, which will take our F# code and turn it into Javascript. This allows our code to run anywhere Javascript runs, whether it is the browser, [Node.js][nodejs], or other runtimes. Fable is designed with interoperability in mind, which makes it simple to re-use and integrate with the vast ecosystem of JavaScript libraries, as we will see later on in the book.

Our primary focus will be building client applications for the browser. We will start by learning the development workflow around client applications, slowly understanding the tooling and the hybrid nature of Fable projects since we will be both using [.NET][dotnet] and Node.js tools for development.

Using the Elmish library, we will build and design our applications following The Elm Architecture: A beautiful pattern for making genuinely modular user interfaces as popularized by the [Elm][elm] programming language. We will spend a significant portion of the book talking about, understanding, and building applications that follow this architecture starting from scratch until it becomes second nature to the reader, hence the name of this book.

The premise of The Elm Architecture is the ability to build robust and reliable applications: applications that don't fail or break easily. Building a stable structure requires identifying the failure points of that structure and accounting for them. When it comes to web applications, many problems come down to the correct handling of data and syncing it with the user interface. Data can have many failure points, whether it is a failure when being retrieved, a failure when being processed from one form to another, or failure when assuming the data to be available and using it when in fact, it is not. To account for these problems, we will spend a lot of time discussing **data modeling** and ways to encode the data using types with the help of F#'s powerful type-system while having the compiler at our backs.

The pacing of the book is *deliberately* slow because learning front-end development can often be overwhelming. That is why each chapter is divided into bite-sized sections that are hopefully easy to understand on their own. These sections include working small samples to demonstrate the various concepts. As you progress through the book, the concepts start to become more apparent as we keep expanding upon the things we learn along the way.

Some parts of the book are *opinionated* and do not necessarily follow the tutorials and guidelines you have potentially read before. However, this is not to say that you should follow my advice and forget what you already know, it is the opposite: my goal is that you learn a lot and gain more experience to draw your conclusions and understand why one approach is better than the other. That is why I will try my best to explain my *train of thought* when going through the examples and the way they are implemented.

[elm]:https://elm-lang.org/
[nodejs]:https://nodejs.org/en/
[dotnet]:https://dotnet.microsoft.com/
