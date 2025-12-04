import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import sendEmail from "../Services/mailService.js";
import { verification } from "../Services/verificationService.js";

dotenv.config();

const prisma = new PrismaClient();

export const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create the user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        // verificationToken,
      },
    });

    // sending verification mail
    verification(newUser);

    // console.log('aftersending mail');

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      newUser,
    });
  } catch (error) {
    console.log("error : ", error);
    return res.status(500).json({
      success: false,
      message: "login API error",
    });
  }
};

export const verifyUser = async (req, res) => {
  const { verificationToken } = req.params;
  if (!verificationToken) {
    return res.status(401).json({
      message: "Invalid url",
    });
  }
  try {
    console.log("verification function called");
    const userFound = await prisma.user.findFirst({
      where: { verificationToken },
    });
    // if user not found, return error
    if (!userFound) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }
    // update the user
    const updatedUser = await prisma.user.update({
      where: { id: userFound.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });
    return res.status(201).json({
      success: true,
      message: "User verified successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error verifying user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const loginUser = async (req, res) => {
  //console.log("Login Called")
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    // find the user
    const userFound = await prisma.user.findUnique({
      where: { email },
    });
    // console.log('user found');

    if (!userFound) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    // check verfication status
    const userVerifcation = await prisma.user.findFirst({
      where: { email, isVerified: true },
    });

    if (!userVerifcation) {
      verification(userFound);
      return res.status(401).json({
        success: false,
        message: "user is not verified pls verify user",
      });
    }

    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    // console.log('password matched');

    // create a JWT token
    const jwtToken = jwt.sign(
      { id: userFound.id, role: userFound.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    //console.log("jwt token created")

    const cookieOptions = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      httpOnly: true,
    };
    res.cookie("tok", jwtToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
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
      message: "Server error",
    });
  }
};

export const getMe = async (req, res) => {
  console.log("getMe Called");
  try {
    const userFound = prisma.user.findFirst({ where: { user: req.user } });
    if (!userFound) {
      return res.status(401).json({
        success: false,
        message: "UnAuthorise access",
      });
    }
    return res.status(200).json({
      success: true,
      userFound,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Unauthorise access",
    });
  }
};

export const logoutUser = async (req, res) => {
  console.log("logoutUser Called");
  try {
    console.log("entered in try catch");
    res.clearCookie("tok", {
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now()),
    });
    console.log("cleared cokkoies");

    return res.status(200).json({
      message: "logout Successful",
    });
  } catch (error) {
    return res.status(400).json({
      message: "logout error ",
    });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(401).json({
      message: "Email is required",
    });
  }
  try {
    console.log("forgot password called");
    const userFound = await prisma.user.findFirst({ where: { email } });
    if (!userFound) {
      return res.status(401).json({
        message: "email is not registered",
      });
    }
    console.log("user : ", userFound);
    const token = crypto.randomBytes(32).toString("hex");
    console.log(token);

    // save in db
    const userSave = await prisma.user.update({
      where: { id: userFound.id },
      data: {
        passwordResetToken: token,
        passwordResetTokenExpiry: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ),
      },
    });
    if (!userSave) {
      return res.status(404).json({
        message: "internal server error",
      });
    }
    sendEmail(
      userSave.email,
      "Reset your password",
      `Please click on the following link to reset your password: ${process.env.BASEURL}/api/v1/user/reset/${token}`
    );
    return res.status(200).json({
      message: "reset link sent successfully",
      success: true,
    });
  } catch (error) {}
};

export const resetPasword = async (req, res) => {
  console.log("reset pass called");
  const { password } = req.body;
  const { token } = req.params;
  if (!password) {
    return res.status(401).json({
      message: "password is required",
    });
  }

  try {
    const userFound = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!userFound) {
      return res.status(401).json({
        message: "invalid token",
        success: false,
      });
    }
    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // update the user

    const updatedUser = await prisma.user.update({
      where: { id: userFound.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      },
    });

    if (!updatedUser) {
      return res.status(404).json({
        message: "db error",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Password reset successfully",
      success: true,
      updatedUser,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
