import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { readFilesRecursively } from './utility/readfile.utility';
import * as hbs from 'handlebars';
import { buildMailerTransportOptions } from './mailer-transport.util';
import { SmtpOnlyEmailService } from './smtp-only-email.service';
import { RobustEmailService } from './robust-email.service';
import { WebhookEmailService } from './webhook-email.service';
import { HttpEmailService } from './http-email.service';
import { RailwayEmailService } from './railway-email.service';
import { RailwayDirectEmailService } from './railway-direct-email.service';
import { ResendEmailService } from './resend-email.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mailerOptions = buildMailerTransportOptions(configService);

        // Try to find templates in dist folder first (production), then fall back to src (development)
        let partialsDir = path.join(__dirname, 'templates');
        let templatesDir = path.join(__dirname, 'templates', 'emails');
        
        // If templates don't exist in dist, try src folder (for development)
        if (!fs.existsSync(partialsDir)) {
          const srcPartialsDir = path.join(process.cwd(), 'src', 'shared', 'email', 'templates');
          if (fs.existsSync(srcPartialsDir)) {
            partialsDir = srcPartialsDir;
            templatesDir = path.join(partialsDir, 'emails');
          } else {
            const relativePath = path.join(process.cwd(), 'dist', 'shared', 'email', 'templates');
            if (fs.existsSync(relativePath)) {
              partialsDir = relativePath;
              templatesDir = path.join(partialsDir, 'emails');
            }
          }
        }

        if (fs.existsSync(partialsDir)) {
          try {
            const partials = readFilesRecursively(partialsDir);
            partials.forEach(({ name, content }) => {
              hbs.registerPartial(name, content);
            });
          } catch (error) {
            // Template partial registration is optional
          }
        }

        return {
          ...mailerOptions,
          template: {
            dir: templatesDir,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [
    EmailService,
    SmtpOnlyEmailService,
    RobustEmailService,
    WebhookEmailService,
    HttpEmailService,
    RailwayEmailService,
    RailwayDirectEmailService,
    ResendEmailService,
  ],
  exports: [
    EmailService,
    SmtpOnlyEmailService,
    RobustEmailService,
  ],
})
export class EmailModule { }
