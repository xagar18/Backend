import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }
    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    // create the user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        verificationToken,
      },
    });
    console.log(newUser);

    // send verification email

    // response
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    }); 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error 1',
    });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  try {
    // find the user
    const userFound = await prisma.user.findUnique({
      where: { email },
    });

    if (!userFound) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // check if the password is correct
    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // create a JWT token
    const jwtToken = jwt.sign({ id: userFound.id, role: userFound.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const cookieOptions = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      httpOnly: true,
    };
    res.cookie('jwt', jwtToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: userFound.id,
        name: userFound.name,
        email: userFound.email,
        phone: userFound.phone,
        role: userFound.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
