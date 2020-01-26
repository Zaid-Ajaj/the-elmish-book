# The Intent Pattern

In the previous section when we were [wiring up the pages](understanding-data-communication#wiring-up-the-pages) with the `App` module, we talked about how the parent program can *inspect* and *intercept* events coming from child programs. Here, the parent program has two options:
- Intercept the event without propagating it further down to child programs.
- Inspect the event and propagate it to the child program for further processing.

The App program intercepted the event from the Login page when a user has succesfully logged in and decided not to propagate that event further down to the Login program. It makes to do so because we switched the currently active page to Home when that event occured so there is no point from having Login process the event any further. We can take this as a high-level guideline: when intercepting events from child programs, we do not have to propagate these events down if we are switching the currently active page.

Although this makes sense from the parent program perspective, it feels weird from the child program point of view where it expects that the events will be processed no matter which event that is.

It might also lead to bugs where a programmer is staring at the `update` function of a child program for an hour wondering why an event isn't being processed, only to realize that the event was being intercepted from a parent program when it should have only been inspected and propagated down further. This is a typical case where a bug is introduced due to miscommunication: it was not the **intention** of the child program to have one of its events being intercepted.