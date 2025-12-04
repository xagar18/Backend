import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import dotenv from 'dotenv';
import sendEmail from './mailService.js';
dotenv.config();

const prisma = new PrismaClient();

export async function verification(user) {
  try {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    });
    sendEmail(
      user.email,
      'Verify your email',
      `Please click on the following link to verify your email: ${process.env.BASEURL}/api/v1/user/verify/${verificationToken}`,
    );
    // console.log(user);
  } catch (error) {
    console.error('Error generating verification token:', error);
    return {
      success: false,
      message: 'Error generating verification token',
    };
  }
}
