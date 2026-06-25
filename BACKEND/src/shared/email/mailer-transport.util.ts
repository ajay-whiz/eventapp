import { ConfigService } from '@nestjs/config';

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  return String(value ?? 'false').toLowerCase() === 'true';
};

export const buildMailerTransportOptions = (configService: ConfigService) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sendGridApiKey =
    process.env.SENDGRID_API_KEY || configService.get<string>('sendGrid.apiKey');

  if (isProduction && sendGridApiKey && sendGridApiKey.length > 10) {
    return {
      transport: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: sendGridApiKey,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
      },
      defaults: {
        from:
          process.env.SENDGRID_FROM_EMAIL ||
          configService.get<string>('sendGrid.fromEmail'),
      },
    };
  }

  const smtpUser =
    process.env.SMTP_USER || configService.get<string>('email.SMTP_USER');
  const smtpPass =
    process.env.SMTP_PASS || configService.get<string>('email.SMTP_PASS');
  const smtpFrom =
    process.env.SMTP_FROM ||
    configService.get<string>('email.SMTP_FROM') ||
    smtpUser;

  return {
    transport: {
      host:
        process.env.SMTP_HOST ||
        configService.get<string>('email.SMTP_HOST') ||
        'smtp.gmail.com',
      port: parseInt(
        String(
          process.env.SMTP_PORT ||
            configService.get('email.SMTP_PORT') ||
            '587',
        ),
        10,
      ),
      secure: parseBoolean(
        process.env.SMTP_SECURE ?? configService.get('email.SMTP_SECURE'),
      ),
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 20000,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    },
    defaults: {
      from: `"No Reply" <${smtpFrom}>`,
    },
  };
};
