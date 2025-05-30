const fs  = require('fs');
// const {math} = require('./math');
const {add, subtract} = require('./math');

fs.writeFile('hello.txt', 'Hello, World!', (err) => {})

console.log(add(1, 2)); 
// console.log(math);

function __require(id){
  // This function is a placeholder for the require function in Node.js
  // In a real Node.js environment, this would load the module with the given id

}
