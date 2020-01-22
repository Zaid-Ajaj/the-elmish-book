# Understanding Data Communication

What happens within a child program is often of interest for other child programs to know about. Sometimes it is even necessary to communicate information that was gathered in one child program to another. Since child programs do now know about the existence of their siblings (nor they shouldn't because that is not of their concern), communicating information between child programs has to go through the parent program. Parent programs receive events that are triggered from the child program before passing them down into the `update` function (see [Flow Of Messages](splitting-programs.md#flow-of-messages) for a refresher in Splitting Programs).

Since all events of child programs has to go through the parent, it can decide whether to just pass down these events to the child programs for further processing or it can initiate different events in other programs after initializing them. To better understand what I am talking about, let us go through an example.

Consider the following application that consists only of a login page:
