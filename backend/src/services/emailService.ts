import { Resend } from 'resend';
import { logger } from '../observability/logger';

// Initialize Resend with the API key from environment variables.
// It will gracefully fail later if the key isn't provided.
const resend = new Resend(process.env.RESEND_API_KEY || 'missing_key');

export const sendEmail = async (to: string, subject: string, text: string) => {
  if (!to) {
    logger.warn('Email send skipped: No recipient provided.');
    return;
  }
  
  if (!process.env.RESEND_API_KEY) {
    logger.warn(`Email send skipped: RESEND_API_KEY is not configured in .env. Would have sent: [${subject}] to ${to}`);
    return;
  }
  
  try {
    // Resend requires the sender email to be verified on their platform, 
    // but they allow testing via 'onboarding@resend.dev'
    const sender = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    const { data, error } = await resend.emails.send({
      from: `Parcel Router <${sender}>`,
      to,
      subject,
      text, // Sending plain text, Resend also supports 'html' seamlessly
    });

    if (error) {
      logger.error({ error, to, subject }, 'Resend API returned an error');
      return;
    }
    
    logger.info(`Email successfully sent via Resend to ${to}: ${subject} (MessageId: ${data?.id})`);
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to send email via Resend SDK');
  }
};
