const wait = timeout => {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), timeout);
    })
}

wait(1000)
  .then(() => {
    console.log("One")
    return wait(1000)
  })
  .then(() => {
    console.log("Two")
    return wait(1000)
  })
  .then(() => {
    console.log("Three")
    return wait(1000);
  })
  .then(() => {
    console.log("Four");
    return wait(1000);
  })
  .then(() => {
      console.log("Five");
  });