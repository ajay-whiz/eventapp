import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to get Resend API key from multiple sources
function getResendApiKey(): string | null {
  // First try environment variable
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
    return process.env.RESEND_API_KEY.trim();
  }

  // Fallback: Try reading from config file
  try {
    // Try multiple possible paths (for both source and compiled code)
    const possiblePaths = [
      path.resolve(__dirname, '../../config/base.json'), // From dist/src
      path.resolve(__dirname, '../config/base.json'),    // From src (dev)
      path.resolve(process.cwd(), 'config/base.json'),   // From project root
    ];
    
    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.resend && config.resend.apiKey) {
          return config.resend.apiKey;
        }
        break;
      }
    }
  } catch (error) {

  }

  return null;
}

// Only initialize Resend if API key is available
let resend: Resend | null = null;
const resendApiKey = getResendApiKey();

if (resendApiKey && resendApiKey.trim() !== '') {
  try {
    resend = new Resend(resendApiKey);

  } catch (error) {

    resend = null;
  }
} else {

}

// Helper function to get Resend FROM email from multiple sources
function getResendFromEmail(): string {
  // First try environment variable
  if (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.trim() !== '') {
    return process.env.RESEND_FROM_EMAIL.trim();
  }

  // Fallback: Try reading from config file
  try {
    // Try multiple possible paths (for both source and compiled code)
    const possiblePaths = [
      path.resolve(__dirname, '../../config/base.json'), // From dist/src
      path.resolve(__dirname, '../config/base.json'),    // From src (dev)
      path.resolve(process.cwd(), 'config/base.json'),   // From project root
    ];
    
    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.resend && config.resend.fromEmail) {
          return config.resend.fromEmail;
        }
        break;
      }
    }
  } catch (error) {
    // Ignore config read errors for fromEmail
  }

  // Final fallback
  return 'noreply@yourdomain.com';
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (!resend) {

      return { error: 'Resend API key not configured' };
    }

    const fromEmail = getResendFromEmail();
    const response = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    return response;
  } catch (error) {

    throw error;
  }
}
