# Thoth.Json and SimpleJson

Previously on [Asynchronous XMLHttpRequest](async-xhr.md), we looked at how to retrieve data from a static file server, now we will *process* the data and show it to the user in a meaningful manner. To do that, we will be using both [Thoth.Json](https://mangelmaxime.github.io/Thoth/json/v3.html) and [Fable.SimpleJson](https://github.com/Zaid-Ajaj/Fable.SimpleJson) to decode the JSON text into user defined types, of course we will use them separately so that we can compare both approaches to JSON decoding.

To get started, I have set up a small application in the [elmish-with-json](https://github.com/Zaid-Ajaj/elmish-with-json) repository that loads JSON from the server and after a delay, shows it *as is* on screen:

<div style="width:100%">
  <div style="margin: 0 auto; width:75%;">
    <resolved-image source="/images/commands/elmish-json.gif" />
  </div>
</div>

