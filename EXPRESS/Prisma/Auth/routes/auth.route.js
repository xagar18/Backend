import express from 'express';
import {
  forgotPassword,
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  resetPasword,
  verifyUser,
} from '../controllers/app.controller.js';
import { isLoggedIn } from '../middleware/auth.middleware.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.get('/login', loginUser);
userRouter.post('/verify/:verificationToken', verifyUser);
userRouter.get('/profile', isLoggedIn, getMe);
userRouter.get('/logout', isLoggedIn, logoutUser);
userRouter.post('/f', forgotPassword);
userRouter.get('/reset/:token', resetPasword);

export default userRouter;
