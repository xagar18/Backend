import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../model/User.model.js';

// register user
const registerUser = async (req, res) => {
  //get data
  const { name, email, password } = req.body;

  //validate
  if (!name || !email || !password) {
    return res.status(400).json({
      message: 'All fields are required',
    });
  }

  //check if user already exist
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    //create a user in database
    const newUser = await User.create({
      name,
      email,
      password,
    });
    console.log(newUser);

    if (!newUser) {
      return res.status(400).json({
        message: 'User not registered',
      });
    }

    //create verification token
    const token = crypto.randomBytes(32).toString('hex');
    console.log(token);

    //save token in database
    newUser.verificationToken = token;
    await newUser.save();

    //send token as email to user
    var transport = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: newUser.email,
      subject: 'Verify your email',
      text: `please on following link:
      ${process.env.BASEURL}/api/v1/user/verify/${token}
      `,
    };
    await transport.sendMail(mailOptions);

    //send success status to user
    res.status(201).json({
      message: 'User registered successfully',
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: 'User not registered',
      success: false,
    });
  }
};

// verify user
const verifyUser = async (req, res) => {
  //get token from url
  const { token } = req.params;
  console.log(token);

  //validate
  if (!token) {
    return res.status(400).json({
      message: 'token not found',
    });
  }

  //find user by token
  const userCheck = await User.findOne({
    verificationToken: token,
  });
  console.log(userCheck);

  if (!userCheck) {
    return res.status(400).json({
      message: 'Invalid token',
    });
  }

  //set isVerified field to true
  userCheck.isVerified = true;

  // remove verification token
  userCheck.verificationToken = undefined;

  //save
  await userCheck.save();

  //return response

  return res.status(200).json({
    message: 'User verified successfully',
  });
};

//login user
const login = async (req, res) => {
  //get data
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: 'All fields are required',
    });
  }
  try {
    //check if user already exist
    const userFound = await User.findOne({ email });
    if (!userFound) {
      return res.status(400).json({
        message: 'Invalid email or password',
      });
    }
    // password check
    const isMatched = await bcrypt.compare(password, userFound.password);
    console.log(isMatched);

    if (!isMatched) {
      return res.status(400).json({
        message: 'Invalid email or password',
      });
    }

    // create token
    const token = jwt.sign({ id: userFound._id, role: userFound.role }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    //storing token in cookie
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 600 * 1000,
    };
    res.cookie('test', token, cookieOptions);
    res.status(200).json({
      success: true,
      message: 'Login Successful',
      token,
      user: {
        id: userFound._id,
        name: userFound.name,
        role: userFound.role,
      },
    });
  } catch (error) {
    return res.status(400).json({
      message: 'User not found',
    });
  }
};

// get user details
const getMe = async (req, res) => {
  try {
    // check if user is logged in
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(400).json({
        message: 'User not found',
        success: false,
      });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(400).json({
      message: 'User not found',
    });
  }
};

// logout user
const logoutUser = async (req, res) => {
  console.log('logout called');
  try {
    //clear cookie
    res.clearCookie('test', {
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now()),
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    return res.status(400).json({
      message: 'User not found (logout failed)',
    });
  }
};

// forgot password
const forgotPassword = async (req, res) => {
  console.log('forgot password called');
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      message: 'Email is required',
    });
  }
  try {
    //check if user exist
    const userFound = await User.findOne({ email });
    if (!userFound) {
      return res.status(400).json({
        message: 'User not found',
      });
    }
    console.log(userFound);

    //create reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log(resetToken);

    //save token in database
    userFound.resetPasswordToken = resetToken;
    userFound.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await userFound.save();

    // send token as email to user
    var transport = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: userFound.email,
      subject: 'Reset your password',
      text: `please on following link:
      ${process.env.BASEURL}/api/v1/user/reset/${resetToken}
      `,
    };
    await transport.sendMail(mailOptions);

    //send success status to user
    res.status(200).json({
      message: 'Reset password link sent to your email',
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: 'User not found',
    });
  }
};

// reset password
const resetPassword = async (req, res) => {
  try {
    // get token from url
    const { token } = req.params;
    const { password } = req.body;
    console.log(token, password);

    // validate
    if (!token || !password) {
      return res.status(400).json({
        message: 'Token and password are required',
      });
    }

    // find user by token
    const userFound = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    console.log(userFound);
    if (!userFound) {
      return res.status(400).json({
        message: 'Invalid token or token expired',
      });
    }

    // save password in database
    userFound.password = password;
    userFound.resetPasswordToken = undefined;
    userFound.resetPasswordExpires = undefined;
    await userFound.save();

    // send success status to user
    res.status(200).json({
      message: 'Password reset successfully',
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: 'User not found',
    });
  }
};

export { forgotPassword, getMe, login, logoutUser, registerUser, resetPassword, verifyUser };
