import nodemailer from "nodemailer";
import { config } from "../config/env";
import { logger } from "./logger";

let transporter: nodemailer.Transporter | null = null;

const createTranseorter = () => {
  if (
    !config.email.host ||
    !config.email.port ||
    !config.email.user ||
    !config.email.pass
  ) {
    logger.warn("Email configuration is missing. Skipping email setup.");
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
      logger.warn("Email configuration is missing. Skipping email setup.");
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
    logger.error("Failed to send email:", error);
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

  return sendEmail(email, "Verify your EndpointHub account", html, text);
};
