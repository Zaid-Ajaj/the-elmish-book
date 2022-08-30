// make images work using absolute urls both in developement and when published to github pages
Vue.component("ResolvedImage", {
    props: ["source"],
    template: "<img :src='resolvedUrl' />",
    computed: {
        resolvedUrl: function() {
            if (offline) {
                // no need to change anything regarding image source
                return this.source;
            }

            let path = window.location.pathname;
            console.log(path);
            if (path.endsWith("/")) {
                return path.substr(0, path.length - 1) + this.source;
            } else {
                return path + this.source;
            }
        }
    }
});

var docutePlugins = offline ? []  : [ docuteGoogleAnalytics("UA-135472140-1") ];

var docs = new Docute({
    layout: "wide",
    target: "#root",
    plugins: docutePlugins,
    highlight: [ "fsharp", "bash", "ocaml", "fs", "json", "sass" ],
    cssVariables: {
        accentColor:  "hsl(171, 100%, 41%)",
        sidebarWidth: "300px",
        sidebarLinkActiveColor: "hsl(171, 100%, 41%)",
        sidebarLinkArrowColor: "hsl(171, 100%, 41%)"
    },
    nav: [
        { title: "❤️ Sponsor my work", link: "https://github.com/sponsors/Zaid-Ajaj" },
        { title: "📚 GitHub Repository", link: "https://github.com/Zaid-Ajaj/the-elmish-book" },
        { title: "✏️ Written by Zaid Ajaj", link: "https://github.com/Zaid-Ajaj" }
    ],
    sidebar: [
        {
            title: "The Elmish Book",
            links: [
                { title: "Introduction", link: "/" },
                { title: "Audience", link: "/chapters/audience" },
                { title: "Chapter Overview", link: "/chapters/overview" },
                { title: "Planned Chapters",link: "/chapters/planned-chapters" },
                { title: "Contributing", link: "/chapters/contributing" },
                { title: "Acknowledgment", link: "/chapters/acknowledgment" },
                { title: "License", link: "/license" }
            ]
        },
        {
            title: "Understanding Fable",
            links: [
                { title: "Introduction", link: "/chapters/fable/" },
                { title: "Hello World", link: "/chapters/fable/hello-world" },
                { title: "Development Mode", link: "/chapters/fable/development-mode" },
                { title: "Counter Application", link: "/chapters/fable/counter" },
                { title: "Observations", link: "/chapters/fable/observations" },
                { title: "Compatibility with .NET", link: "/chapters/fable/compatibility" },
                { title: "Fable Packages", link: "/chapters/fable/fable-packages" },
                { title: "Fable Bindings", link: "/chapters/fable/fable-bindings" },
                { title: "Node.js Packages", link: "/chapters/fable/node-packages" },
                { title: "Understanding How Fable Works", link: "/chapters/fable/how-fable-works" }
            ]
        },
        {
            title: "The Elm Architecture",
            links: [
                { title: "Introduction", link: "/chapters/elm/" },
                { title: "The Elm Architecture", link: "/chapters/elm/the-architecture" },
                { title: "Counter with Elmish", link: "/chapters/elm/counter" },
                { title: "Rendering HTML", link: "/chapters/elm/render-html" },
                { title: "Conditional Rendering", link: "/chapters/elm/conditional-rendering" },
                { title: "Using CSS", link: "/chapters/elm/using-css" },
                { title: "Collecting User Input", link: "/chapters/elm/form-inputs" },
                { title: "React in Elmish", link: "/chapters/elm/react-in-elmish" },
                { title: "To-Do List Application", link: "/chapters/elm/todo-app" },
                { title: "To-Do List Application: Part 1", link: "/chapters/elm/todo-app-part1" },
                { title: "To-Do List Application: Part 2", link: "/chapters/elm/todo-app-part2" },
                { title: "To-Do List Application: Part 3", link: "/chapters/elm/todo-app-part3" },
                { title: "To-Do List Application: Exercises", link: "/chapters/elm/todo-app-exercises" },
                { title: "Basic Elmish Project Structure", link: "/chapters/elm/project-structure" }
            ]
        },
        {
            title: "Commands In Elmish",
            links: [
                { title: "Introduction", link: "/chapters/commands/" },
                { title: "Elmish Commands", link: "/chapters/commands/commands" },
                { title: "What Are Commands?", link: "/chapters/commands/definition" },
                { title: "Asynchronous Updates", link: "/chapters/commands/async-updates" },
                { title: "From Async<'t> to Cmd<'t>", link: "/chapters/commands/async-to-cmd" },
                //{ title: "Failing Asynchronous Operations", link: "/chapters/commands/failing-async" },
                { title: "Modelling Asynchronous State", link: "/chapters/commands/async-state" },
                { title: "Deferred Module Utilities", link: "/chapters/commands/deferred-module-utilities" },
                { title: "Recursive State Updates", link: "/chapters/commands/recursive-updates" },
                { title: "Asynchronous Recursive Updates", link: "/chapters/commands/async-recursive-updates" },
                { title: "Working with HTTP", link: "/chapters/commands/http" },
                { title: "Using XMLHttpRequest in Elmish", link: "/chapters/commands/xhr-elmish" },
                { title: "Asynchronous XMLHttpRequest", link: "/chapters/commands/async-xhr" },
                { title: "Working with JSON", link: "/chapters/commands/working-with-json" },
                { title: "Using Thoth.Json", link: "/chapters/commands/using-json" },
                { title: "Elmish Hackernews", link: "/chapters/commands/elmish-hackernews" },
                { title: "Elmish Hackernews: Part 1", link: "/chapters/commands/elmish-hackernews-part1" },
                { title: "Elmish Hackernews: Part 2", link: "/chapters/commands/elmish-hackernews-part2" },
                { title: "Elmish Hackernews: Part 3", link: "/chapters/commands/elmish-hackernews-part3" },
                { title: "Elmish Hackernews: Exercises", link: "/chapters/commands/elmish-hackernews-exercises" }
            ]
        },
        {
            title: "Composing Larger Applications",
            links: [
                { title: "Introduction", link: "/chapters/scaling/" },
                { title: "Web Pages As Programs", link: "/chapters/scaling/pages-as-programs" },
                { title: "Splitting Programs", link: "/chapters/scaling/splitting-programs" },
                { title: "Integrating Commands", link: "/chapters/scaling/integrating-commands" },
                { title: "Composition Forms", link: "/chapters/scaling/composition-forms" },
                { title: "Understanding Data Communication", link: "/chapters/scaling/understanding-data-communication" },
                { title: "The Intent Pattern", link: "/chapters/scaling/intent" },
                { title: "Routing And Navigation", link: "/chapters/scaling/routing" },
                { title: "Parsing Url Segments", link: "/chapters/scaling/parsing-url-segments" },
                { title: "Parsing Date Segments", link: "/chapters/scaling/parsing-date-segments" },
                { title: "Programmatic Navigation", link: "/chapters/scaling/programmatic-navigation" },
                { title: "Introducing Url Type", link: "/chapters/scaling/introducing-url-type" },
                { title: "Modelling Nested Routes", link: "/chapters/scaling/modelling-nested-routes" },
                { title: "Multi-Page Routing", link: "/chapters/scaling/multi-page-routing" }
            ]
        },
        {
            title: "Improving Development Workflow",
            links: [
                { title: "Introduction", link: "/chapters/dev-flow/" },
                { title: "Webpack Mode", link: "/chapters/dev-flow/webpack-mode" },
                { title: "Using Compiler Directives", link: "/chapters/dev-flow/compiler-directives" },
                { title: "Using Configuration Variables", link: "/chapters/dev-flow/configuration-variables"},
                { title: "Hot Module Replacement", link: "/chapters/dev-flow/hot-module-replacement" },
                { title: "Understanding Webpack Loaders", link: "/chapters/dev-flow/understanding-webpack-loaders" },
                { title: "Importing Static Images", link: "/chapters/dev-flow/static-images" },
                { title: "Styling With Sass", link: "/chapters/dev-flow/styling-with-sass" },
                { title: "Introducing Femto", link: "/chapters/dev-flow/introducing-femto" }
            ]
        }
    ]
});