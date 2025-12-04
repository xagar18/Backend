const fs = require('fs');

function old() {
  const setImme = () => {
    setTimeout(() => console.log('hello'), 0); // second
    setImmediate(() => console.log('hello1')); // first
  };

  const setImme1 = () => {
    setTimeout(() => console.log('hello'), 0); // third
    setImmediate(() => console.log('hello1')); // second
    console.log('log'); // first
  };
  // setImme();
  // setImme1();
}
function neww() {
  setTimeout(() => console.log('timeout'), 0); 
  setImmediate(() => console.log('immediate')); 
  fs.readFile('sample.txt', 'utf-8', function (err, data) {
    setTimeout(() => console.log('Set timeout inside FS'), 0);
    setImmediate(() => console.log('Set immediate inside FS'));
  });
  console.log('hello');
}
neww();
