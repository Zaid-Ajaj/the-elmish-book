# Hot Module Replacement

Very early on in chapter 1, we learnt about [Development Mode](../fable/development-mode) via the webpack development server. This server runs our front-end application and watches for changes in source files. Once any change is detected, only that part of the application and its dependencies are recompiled really fast and the page is refreshed automatically. However, this automatic refresh of the page is not optimal because it is a full-refresh: the application loses its state and data when the page refreshes itself.

Image you have an application where you first have to login to get to the page you are currently working on. Everytime you make a change in the source code like changing the font size of some element, the page is refreshed and you are reset back to the login page where you have to login again to see your changes.

Here is where *hot module replacement* (HMR for short) comes into play. Instead of refreshing the entire page when some piece of code changes, only that piece is recompiled and *re-executed seperately* to reflect the changes without needing a full page refresh.

