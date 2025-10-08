import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

const createTranseorter = () => {
    if (
        !config.email.host ||
        !config.email.port ||
        !config.email.user ||
        !config.email.pass
    ) {
        logger.warn('Email configuration is missing. Skipping email setup.');
        return null;
    }

    return nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port || 587,
        secure: false,
        auth: {
            user: config.email.user,
            pass: config.email.pass,
        },
    });
};

export const sendEmail = async (
    to: string,
    subject: string,
    html: string,
    text?: string
) => {
    try {
        if (!transporter) {
            transporter = createTranseorter();
        }

        if (!transporter) {
            logger.warn(
                'Email configuration is missing. Skipping email setup.'
            );
            return false;
        }

        const info = await transporter.sendMail({
            from: `"EndpointHub" <${config.email.user}>`,
            to,
            subject,
            text,
            html,
        });
        logger.info(`Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        logger.error('Failed to send email:', error);
        return false;
    }
};

export const sendVerificationEmail = async (email: string, token: string) => {
    const verificationUrl = `${config.nextAuth.url}/verify-email?token=${token}`;

    const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h1 style="color: #2563eb;">Welcome to EndpointHub!</h1>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
      <p>This verification link will expire in 24 hours.</p>
    </div>
  `;

    const text = `
    Welcome to EndpointHub!
    
    Please verify your email address by visiting: ${verificationUrl}
    
    This verification link will expire in 24 hours.
  `;

    return sendEmail(email, 'Verify your EndpointHub account', html, text);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetUrl = `${config.nextAuth.url}/reset-password?token=${token}`;

    const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h1 style="color: #dc2626;">Reset Your Password</h1>
      <p>We received a request to reset your password. If you made this request, click the button below to reset it:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
      <p>This link will expire in 24 hours. If you didn’t request a password reset, you can safely ignore this email.</p>
    </div>
  `;

    const text = `
    Reset Your Password
    
    We received a request to reset your password.
    If you made this request, use the link below:
    ${resetUrl}
    
    This link will expire in 24 hours.
    If you didn’t request this, ignore this email.
  `;

    return sendEmail(email, 'Reset your EndpointHub password', html, text);
};
