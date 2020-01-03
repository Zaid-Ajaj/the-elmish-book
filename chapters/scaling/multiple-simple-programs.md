# Multiple Simple Programs

In this section, we will take a detailed look into splitting a program into multiple simple programs. The key is that in this example, we are working with *simple* programs: without commands in the definition of `init` and `update`. Splitting Elmish programs with commands will be tackled in the next section.

### Counter and Text Input

Consider the following application

<div style="margin-top: 40px; margin-bottom:40px; width:100%">
  <div style="margin: 0 auto; width:100%;">
    <resolved-image source="/images/scaling/multiple-simple-programs.gif" />
  </div>
</div>

This is an application that switches between two views: one for a counter with increment and decrement buttons and another view that shows an input text box which reflects the text onto a header below it when you start typing in that text input. Now, before I show you anything from the code, pause for a second and try to figure out the pieces of information that this program has to keep track of and which events are triggered from the user interface.

For the first view showing the counter, the application has to keep track of the count and have the associated "increment" and "decrement" events to change the count. As for the other input text view, the application keeps track of the text from the input and reacts when that text changes. There is also a checkbox that toggles the reflected text into uppercase mode and back. Finally, the application keeps track of information that is *irrelevant* to both the counter and input text: which view is currently shown on screen with the button that toggles the view from the counter to the input text and back.

Putting this together, we get the following `State` type that includes all these pieces in one place:
```fsharp
type Page =
  | Counter
  | TextInput

type State =
  { Count: int
    InputText: string
    IsUpperCase: bool
    CurrentPage : Page }
```