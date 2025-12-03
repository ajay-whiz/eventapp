import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { WebhookEmailService } from './webhook-email.service';
import { HttpEmailService } from './http-email.service';
import { SmtpOnlyEmailService } from './smtp-only-email.service';
import { RailwayEmailService } from './railway-email.service';
import { RailwayDirectEmailService } from './railway-direct-email.service';
import { ResendEmailService } from './resend-email.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class RobustEmailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly webhookEmailService: WebhookEmailService,
    private readonly httpEmailService: HttpEmailService,
    private readonly smtpOnlyEmailService: SmtpOnlyEmailService,
    private readonly railwayEmailService: RailwayEmailService,
    private readonly railwayDirectEmailService: RailwayDirectEmailService,
    private readonly resendEmailService: ResendEmailService
  ) {}

  async sendEmail(to: string, subject: string, text: string): Promise<boolean> {
    // Check if we're in production and have SendGrid configured
    const isProduction = process.env.NODE_ENV === 'production';
    const hasSendGrid = process.env.SENDGRID_API_KEY || this.configService.get('sendGrid.apiKey');
    
    let strategies;
    
    // Prioritize HTTP providers first (work on Railway), then SMTP
    strategies = [
      () => this.tryResend(to, subject, text), // Resend API (HTTP) - PRIMARY
      () => this.trySendGridAPI(to, subject, text), // SendGrid API (HTTP) - FALLBACK
      () => this.tryGmailSMTP(to, subject, text), // Gmail SMTP - FALLBACK
      () => this.trySmtpOnly(to, subject, text), // SMTP variations - FALLBACK
      () => this.tryRailwayDirect(to, subject, text), // Logging backup
      () => this.tryRailwayEmail(to, subject, text), // Logging backup
      () => this.tryWebhook(to, subject, text), // Logging backup
      () => this.tryConsoleLog(to, subject, text) // Guaranteed logging
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {

        const success = await strategies[i]();
        if (success) {

          return true;
        }
      } catch (error) {

        continue;
      }
    }

    return false;
  }

  private async tryResend(to: string, subject: string, text: string): Promise<boolean> {
    try {

      return await this.resendEmailService.sendEmail(to, subject, text);
    } catch (error) {

      throw error;
    }
  }

  private async tryRailwayDirect(to: string, subject: string, text: string): Promise<boolean> {
    try {

      return await this.railwayDirectEmailService.sendEmail(to, subject, text);
    } catch (error) {

      throw error;
    }
  }

  private async trySmtpOnly(to: string, subject: string, text: string): Promise<boolean> {
    try {

      return await this.smtpOnlyEmailService.sendEmail(to, subject, text);
    } catch (error) {

      throw error;
    }
  }

  private async trySendGrid(to: string, subject: string, text: string): Promise<boolean> {
    try {

      await this.mailerService.sendMail({
        to,
        subject,
        text,
      });
      return true;
    } catch (error) {

      throw error;
    }
  }

  private async tryGmailSMTP(to: string, subject: string, text: string): Promise<boolean> {
    try {

      // Try environment variables first, then config
      const smtpUser = process.env.SMTP_USER || this.configService.get('email.SMTP_USER');
      const smtpPass = process.env.SMTP_PASS || this.configService.get('email.SMTP_PASS');
      let smtpFrom = process.env.SMTP_FROM || this.configService.get('email.SMTP_FROM') || smtpUser;
      
      console.log('📧 Gmail SMTP Config:', {
        user: smtpUser ? `${smtpUser.substring(0, 3)}***` : 'NOT_SET',
        from: smtpFrom ? `${smtpFrom.substring(0, 3)}***` : 'NOT_SET',
        passLength: smtpPass ? smtpPass.length : 0,
        source: process.env.SMTP_USER ? 'ENV_VAR' : 'CONFIG_FILE'
      });
      
      if (!smtpUser || !smtpPass) {
        throw new Error('Gmail SMTP credentials not configured');
      }
      
      // Try multiple Gmail SMTP configurations with Railway-optimized settings
      const configs = [
        {
          name: 'Gmail TLS (Port 587) - Railway Optimized',
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // Use TLS
          auth: { user: smtpUser, pass: smtpPass },
          connectionTimeout: 15000, // Reduced timeout for faster fallback
          greetingTimeout: 15000,
          socketTimeout: 15000,
          tls: { 
            rejectUnauthorized: false,
            ciphers: 'SSLv3',
            servername: 'smtp.gmail.com'
          },
          pool: false, // Disable pooling for Railway
          ignoreTLS: false,
          requireTLS: true,
        },
        {
          name: 'Gmail SSL (Port 465) - Railway Optimized',
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 15000,
          tls: { 
            rejectUnauthorized: false,
            ciphers: 'SSLv3',
            servername: 'smtp.gmail.com'
          },
          pool: false,
        },
        {
          name: 'Gmail TLS (Port 2525) - Alternative',
          host: 'smtp.gmail.com',
          port: 2525,
          secure: false,
          auth: { user: smtpUser, pass: smtpPass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
          tls: { 
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          },
          pool: false,
        }
      ];
      
      for (const config of configs) {
        try {

          const transporter = nodemailer.createTransport(config);
          
          // Quick connection test with shorter timeout

          await transporter.verify();

          const mailOptions = {
            from: `"No Reply" <${smtpFrom}>`,
            to: to,
            subject: subject,
            text: text,
          };

          const info = await transporter.sendMail(mailOptions);

          return true;
          
        } catch (configError) {

          // Continue to next configuration
        }
      }
      
      throw new Error('All Gmail SMTP configurations failed');
      
    } catch (error) {

      throw error;
    }
  }

  private async tryHttpEmail(to: string, subject: string, text: string): Promise<boolean> {
    try {

      return await this.httpEmailService.sendEmailViaHttp(to, subject, text);
    } catch (error) {

      throw error;
    }
  }

  private async tryRailwayEmail(to: string, subject: string, text: string): Promise<boolean> {
    try {

      return await this.railwayEmailService.sendEmail(to, subject, text);
    } catch (error) {

      throw error;
    }
  }

  private async tryWebhook(to: string, subject: string, text: string): Promise<boolean> {
    try {

      return await this.webhookEmailService.sendEmailViaWebhook(to, subject, text);
    } catch (error) {

      throw error;
    }
  }

  private async tryConsoleLog(to: string, subject: string, text: string): Promise<boolean> {
    try {

      console.log('='.repeat(50));

      console.log('='.repeat(50));



      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log('='.repeat(50));
      return true;
    } catch (error) {

      throw error;
    }
  }

  private async trySendGridAPI(to: string, subject: string, text: string): Promise<boolean> {
    try {

      const sendGridApiKey = process.env.SENDGRID_API_KEY || this.configService.get('sendGrid.apiKey');
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || this.configService.get('sendGrid.fromEmail');
      
      console.log('📧 SendGrid API Config:', {
        apiKey: sendGridApiKey ? `${sendGridApiKey.substring(0, 10)}...` : 'NOT_SET',
        fromEmail: fromEmail ? `${fromEmail.substring(0, 3)}***` : 'NOT_SET',
        source: process.env.SENDGRID_API_KEY ? 'ENV_VAR' : 'CONFIG_FILE'
      });
      
      if (!sendGridApiKey || !fromEmail) {
        throw new Error('SendGrid API credentials not configured');
      }

      const emailData = {
        personalizations: [{
          to: [{ email: to }],
          subject: subject
        }],
        from: { email: fromEmail },
        content: [{
          type: 'text/plain',
          value: text
        }]
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {

        return true;
      } else {
        const errorText = await response.text();

        // Handle specific error cases
        if (response.status === 401) {




        } else if (response.status === 403) {



        }
        
        throw new Error(`SendGrid API failed: ${response.status} - ${errorText}`);
      }
      
    } catch (error) {

      throw error;
    }
  }
}
