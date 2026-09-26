import nodemailer from 'nodemailer';
import { logger } from '../observability/logger';

let transporter: any = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    const isSecure = process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  }

  // Create a real testing account on the fly for Ethereal
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  logger.info('Ethereal Email test account created automatically.');
  return transporter;
};

export const sendEmail = async (to: string, subject: string, text: string) => {
  if (!to) {
    logger.warn('Email send skipped: No recipient provided.');
    return;
  }
  
  try {
    const activeTransporter = await getTransporter();
    
    const sender = process.env.SMTP_FROM || '"Parcel Routing System" <noreply@parcelrouter.local>';
    
    const info = await activeTransporter.sendMail({
      from: sender,
      to,
      subject,
      text,
    });
    
    logger.info(`Email sent to ${to}: ${subject} (MessageId: ${info.messageId})`);
    
    if (!process.env.SMTP_HOST) {
      logger.info(`Email Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to send email');
  }
};
