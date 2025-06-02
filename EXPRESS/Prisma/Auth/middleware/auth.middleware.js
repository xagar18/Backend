import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export const isLoggedIn = async (req, res, next) => {
  console.log('isLoggedIn Called');

  try {
    console.log('try catch');
    const jwtToken = req.cookies.tok;
    console.log('jet token : ', jwtToken);
    if (!jwtToken) {
      return res.status(401).json({
        messsage: 'Unauthorise Access',
        success: false,
      });
    }
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('req user : ', req.user);

    next();
  } catch (error) {
    return res.status(404).json({
      messsage: 'Middleware failure',
      success: false,
    });
  }
};
