const http = require('http');
const express = require('express');

// function handlerFunction(req, res) {
//   console.log('request sent');
//   console.log(req.method);
//   console.log(req.url);

//   switch (req.method) {
//     case 'GET':
//       {
//         if (req.url === '/') return res.end('Welcome to the Home Page!');

//         if (req.url === '/about') return res.end('Welcome to the About Page!');

//         if (req.url === '/contact') return res.end('Welcome to the Contact Page!');
//       }
//       break;
//     case 'POST':
//       {
//         if (req.url === '/submit') return res.end('Form submitted successfully!');
//       }

//       break;
//   }

//   res.end('Hello, World!');
// }

const handlerFunctionV2 = express();

handlerFunctionV2.get('/', (req, res) => res.end('HomePage'));
handlerFunctionV2.get('/about', (req, res) => res.end('about'));
handlerFunctionV2.get('/contact', (req, res) => res.end('Contact'));

const server = http.createServer(handlerFunctionV2);

server.listen(3000, () => {
  console.log('Server is running at http://localhost:3000/');
});
