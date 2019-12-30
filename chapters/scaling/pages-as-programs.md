# Web Pages As Programs

When we talk about breaking down an Elmish program into smaller programs, we speak of these programs as the *logical compartments* of the main root program. In the context of a web application, these compartments would be represented by the different pages that make up that application.

In this chapter, we will restrict ourselves to implementing multiple *pages* of a web application as separate programs. In case a web page itself has nested pages of "sufficient complexity", then it becomes the root program of these pages.

You might have an application with a login page, after a user logs in, he or she is redirected to the administration page of your application which itself could be made out of multiple pages

<div style="margin-top: 40px; margin-bottom:40px;">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/example-app.png" />
  </div>
</div>

In the diagram above, every block represents a web page which is implemented as a separate program with its own state and events. Some of these web pages have nested pages in which case we speak the notion of a "parent" program (for example Admin) and "child" programs (Dashboard, Users and Settings)

<div style="margin-top: 40px; margin-bottom:40px;">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/parent-child.png" />
  </div>
</div>

> Admin is a child of the top-level root program.

Parent programs are special kinds of programs. They manage the state of their data and events but are also resposible for the state of their child programs. When a parent program primarily manages the state of its children (even if itself has some state) it can be reduced away: the parent state and the child programs move one level up. This helps reduce the complexity of the application as parent programs usually introduce some syntactic overhead. We will talk about this in great detail later on in the chapter.

<div style="margin-top: 40px; margin-bottom:40px;">
  <div style="margin: 0 auto; width:60%;">
    <resolved-image source="/images/scaling/simplified-app.png" />
  </div>
</div>
