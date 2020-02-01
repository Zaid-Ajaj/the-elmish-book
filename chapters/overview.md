# Chapters Overview

The book is divided into the following chapters. It is recommended that you read them in chronological order. Here is a brief overview of the content of each section:

### Chapter 1: Understanding Fable
This chapter is devoted to getting started and understanding the development workflow around Fable projects. Starting with small examples that run in the browser, we will examine the different tools that we will be using and discuss the role they play within a Fable project.

### Chapter 2: The Elm Architecture
This chapter is concerned with understanding the basics of the Elm architecture like application state, rendering HTML from the state, messages, event handlers, using CSS, conditional rendering, the dispatch loop and how it all fits in F# with the Elmish library. The different concepts are applied using small applications.

### Chapter 3: Commands In Elmish
This chapter dives deeper into Elmish introducing an essential piece of Elm Architecture which is the commands. Using commands, we will be able to utilise asynchronous updates and asynchronous operations in Elmish applications and apply the techniques learnt to understand and implement HTTP operations from scratch. Once we know about HTTP and data communication, we can move forward to learning how to manipulate and work with the data as JSON in our applications.

### Chapter 4: Composing Larger Applications
This chapter expands upon the concept of an Elmish program that was first introduced in chapter 2 and delves into the systematic techniques of composing larger Elmish applications by means of composing multiple smaller (child) programs into larger (parent) programs and managing the data flow around these programs. Navigation and routing are introduced in this chapter as well.

### Chapter 5: Improving Development Workflow
In this chapter, we will take a step back from The Elm Architecture and focus the project structure and leveraging the available tools to make our development flow much better. We will learn how to enable Hot Module Replacements in Elmish applications to avoid page reloads while editing the code. We will learn how to debug Elmish applications with Visual Studio Code, how to integrate various Webpack loaders for working with modular CSS and static assets and finally learn how optimize the build for production.