const add = function (a, b) {
  return a + b;
};
const subtract = function (a, b) {
  return a - b;
};

// Exporting the functions using CommonJS module syntax
// This allows other files to import these functions using require
module.exports = {
  add,
  subtract
};
