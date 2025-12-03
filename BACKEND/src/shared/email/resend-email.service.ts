import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendEmailService {
  private resendClient?: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = process.env.RESEND_API_KEY || this.configService.get('resend.apiKey');
    if (apiKey) {
      this.resendClient = new Resend(apiKey);
    }
  }

  async sendEmail(to: string, subject: string, text: string): Promise<boolean> {
    try {

      // Get Resend API key from environment variables
      const resendApiKey = process.env.RESEND_API_KEY || this.configService.get('resend.apiKey');
      const fromEmail = process.env.RESEND_FROM_EMAIL || this.configService.get('resend.fromEmail') || 'noreply@yourdomain.com';
      
      console.log('📧 Resend Config:', {
        apiKey: resendApiKey ? `${resendApiKey.substring(0, 10)}...` : 'NOT_SET',
        fromEmail: fromEmail,
        source: process.env.RESEND_API_KEY ? 'ENV_VAR' : 'CONFIG_FILE'
      });
      
      if (!resendApiKey || !this.resendClient) {

        return await this.logEmailFallback(to, subject, text);
      }

      const { data, error } = await this.resendClient.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f6f6f6;">
          <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
            <h2 style=\"color: #333;\">${subject}</h2>
            <div style=\"font-size: 16px; color: #555; line-height: 1.6;\">${text.replace(/\n/g, '<br>')}</div>
          </div>
        </div>`
      });

      if (error) {

        return await this.logEmailFallback(to, subject, text);
      }

      return true;
      
    } catch (error) {

      return await this.logEmailFallback(to, subject, text);
    }
  }

  private async logEmailFallback(to: string, subject: string, text: string): Promise<boolean> {
    try {
      const emailData = {
        to,
        subject,
        text,
        timestamp: new Date().toISOString(),
        status: 'logged',
        id: `resend_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        service: 'RESEND_FALLBACK',
        priority: 'high',
        source: 'NESTJS_BACKEND'
      };

      console.log('='.repeat(70));
      console.log('📧 RESEND EMAIL FALLBACK (NO API KEY)');
      console.log('='.repeat(70));









      console.log('='.repeat(70));

      console.log('📧 RESEND_FALLBACK_EMAIL_JSON:', JSON.stringify(emailData, null, 2));



      return true;
    } catch (error) {

      return false;
    }
  }
}
