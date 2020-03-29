# Introduction

Throughout the book, we had been using primarily two templates to work with Fable front-end projects: [fable-getting-started](https://github.com/Zaid-Ajaj/fable-getting-started) and [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started). The former scaffolds a simple plain Fable project to work in the browser and the latter is the basic Elmish template that we have been using in chapters 2, 3 and 4.

When I introduced these templates, I mentioned that both of them are made for the purpose of *learning* and that they shouldn't be used for production environments. The primary reason was to keep the build configuration at a minimum so that we don't get too distracted with these aspects of the front-end development. However, the bigger our applications get, more advanced and fine-tuned build configuration are required both for development and production environments. The template as it is now suffers from many problems, let us go through a couple of them.

### Running Environment Specific Code
In many scenarios, we want the ability to execute different pieces of the code when running the environment in different environments: primarily development and production. For example, we want to introduce logging state changes of Elmish application to the console while in development but disable it in production.

### Large bundle size

When we compile the project using `npm run build`, the size of the generated Javascript is too big because it includes code that might not have been used. When you pull packages in, you might use a function or two from that package, the rest of the code from said package shouldn't be included in the final output if it isn't used.

### Hot module replacement

Also known as HMR for short, is one of the most important features required during development: it is the ability to see the changes you make to the code live **without** fully refreshing the page you are working on! This means if you are tuning the user interface on a page that required you to login first, then you wouldn't need to login again to see your changes whenever you update the UI. Instead, the state of the application is preserved and only the pieces of code are reloaded that were changed. This allows for really short feedback cycles and makes prototyping easier so that you can quickly see the results of your code.

### Using Static Assets

Currently with the templates, whenever we want to use static files like images or CSS files, we would have to include them either in the `index.html` page or reference them via absolute URLs in the `src` attribute of `img` tags. However, in modern front-end projects, it is common to reference static assets like you reference code modules and use them directly in the application.

In this short chapter, we will tackle the shortcomings of the [elmish-getting-started](https://github.com/Zaid-Ajaj/elmish-getting-started) template and turn it into a production-ready template as well as make it nicer to with work with during development. We will not focus on the application point of view but we will be focusing more on the build configuration side of things.

Build time configuration and fine-tuning is one of those domains of building front-end applications that is very important when working with real-world applications but is usually glanced over when learning front-end development and you have to learn it on your own as you go. That is why I am dedicating this small chapter to it.
