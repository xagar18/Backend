import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import logger from './loggers.js';

const app = express();
const port = 3000;
app.use(express.json());

const morganFormat = ':method :url :status :response-time ms';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(' ')[0],
          url: message.split(' ')[1],
          status: message.split(' ')[2],
          responseTime: message.split(' ')[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  }),
);

// app.get('/', (req, res) => {
//   res.send('Hello World!!');
// });
// app.get('/test1', (req, res) => {
//   res.send('test1');
// });

let cityData = [];
let nextId = 1;

//adding a city
app.post('/city', (req, res) => {
  const { name, population } = req.body;
  const newCity = { id: nextId++, name, population };
  cityData.push(newCity);
  res.status(201).send(newCity);
});

//get all city
app.get('/city', (req, res) => {
  res.status(200).send(cityData);
});

//get a city with id
app.get('/city/:id', (req, res) => {
  const city = cityData.find((t) => t.id == parseInt(req.params.id));
  if (!city) {
    return res.status(404).send('City Not Found');
  }
  res.status(200).send(city);
});

//update city
app.put('/city/:id', (req, res) => {
  const cityId = req.params.id;
  const city = cityData.find((t) => t.id == parseInt(cityId));
  if (!city) {
    return res.status(404).send('City Not Found');
  }
  const { name, population } = req.body;
  city.name = name;
  city.population = population;
  res.status(200).send(city);
});

//delete city
app.delete('/city/:id', (req, res) => {
  const index = cityData.findIndex((t) => t.id == parseInt(req.params.id));
  if (index == -1) {
    return req.status(404).send('City not found');
  }
  cityData.splice(index, 1);
  res.status(204).send(city);
});

app.listen(port, () => {
  console.log(`Server is running at ${port}..`);
});
