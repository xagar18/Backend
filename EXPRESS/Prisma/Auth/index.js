import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import userRouter from './routes/auth.route.js';
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }),
);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Express CRUD API!' });
});

// import authRoutes from './routes/auth.route.js';
app.use('/api/v1/user', userRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
