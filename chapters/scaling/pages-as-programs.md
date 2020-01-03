# Web Pages As Programs

When we talk about breaking down an Elmish program into smaller programs, we speak of these programs as the *logical compartments* of the main root program. In the context of a web application, these compartments would be represented by the different pages that make up that application.

In this chapter, we will learn how to implement multiple *pages* of a web application as separate programs.

You might have an application with a login page, after a user logs in, he or she is redirected to the administration page of your application which itself could be made out of multiple pages

<div style="margin-top: 40px; margin-bottom:40px;">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/example-app.png" />
  </div>
</div>

In the diagram above, every block represents a web page which is implemented as a separate program with its own state and events. Some of these web pages have nested pages in which case we speak the notion of a "parent" program (for example Admin) and "child" programs (Dashboard, Users and Settings) where each program is a web page.

<div style="margin-top: 40px; margin-bottom:40px;">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/parent-child.png" />
  </div>
</div>

> Admin is a child of the top-level root program.

Parent programs are special kinds of programs. They manage the state of their data and events but are also resposible for explicitly managing the data and events of their child programs. When a parent program primarily manages the state of its children (even if itself has some state) it can be reduced away: the parent state and the child programs move one level up. This helps reduce the complexity of the application as parent programs usually introduce some syntactic overhead. We will talk about this in great detail later on in the chapter.

<div style="margin-top: 40px; margin-bottom:40px;">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/simplified-app.png" />
  </div>
</div>

Even though the programs operate independantly, they need to have a way to exchange data with the other programs (i.e. web pages). For example, while you are in the Dashboard page, you need to know the username of the user who is currently logged in order to show it in the header of the page, but the information related to the user such as the username and current session are first obtained from the Login page after a user is able to successfully login with proper credentials. This means that after logging in, the Login page should somehow *propagate* the user information to the dashboard. We will be looking data communication between these programs in this chapter:

<div style="margin-top: 40px; margin-bottom:40px;">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/fable-pages-overview.png" />
  </div>
</div>

### What About Complex Pages

What do we do when a web page has really complex<sup>*</sup> parts and these parts aren't necessarily nested pages? You might say, let's break up that page again in smaller programs and have the page manage these parts like a parent program. That would be one solution. However, as mentioned before, introducing a parent program itself increases the complexity of the page because of the overhead of having to communicate the data between the different parts as opposed to having the data in one place as a single program.

Unfortunately, the tipping-point is not really obvious as to where you should break down programs into smallers ones. It really depends on the concerns of said program and what you think of "too complex to be included in a single place". That is why we start with the *simple* and *concrete* form of separation: **different web pages implemented with separate programs** as a guideline for breaking down web applications.

### Components As Building Blocks: A Hybrid Approach

An Elmish application is made out of an Elmish program where this root program can be broken down into multiple smaller programs. This suggests that a program is the main building block in an Elmish application but that is not quite the case. This where Elmish starts to diverge from the classic Elm architecture because it can make use of a different building block to compose complex programs: enter React components. Since the beginning of the book, we have been using the Elmish library with a React renderer to build the user interface. In the React world of things, Components are the standard building blocks for building entire applications. React Components are just like functions that return `ReactElement` but they can have their own internal state and events: they manage their own life-cycle. In Elmish application, we can freely use React Components to encapsulate a piece of logic and make it re-usable aside from making plain old functions that return `ReactElement`. Since React Components can encapsulate their state and life-cycle regardless of how they are consumed, I believe this "hybrid" approach where we combine Elmish and React patterns opens up a whole new world of possibities for simplifying Elmish patterns that are otherwise tedious to implement using the classic approach following The Elm Architecture. We will dive into React Components are their patterns in a later chapter because right now, I want us to tackle pure "classic" Elm program composition.