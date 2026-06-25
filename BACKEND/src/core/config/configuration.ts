import { Helpers } from '@common/helper/helper';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

const ENV = process.env.NODE_ENV || 'local';

const applyEnvOverrides = (config: Record<string, any>) => {
  config.email = config.email ?? {};
  config.sendGrid = config.sendGrid ?? {};
  config.resend = config.resend ?? {};
  config.server = config.server ?? {};

  if (process.env.SMTP_HOST) config.email.SMTP_HOST = process.env.SMTP_HOST;
  if (process.env.SMTP_PORT) config.email.SMTP_PORT = process.env.SMTP_PORT;
  if (process.env.SMTP_SECURE !== undefined) {
    config.email.SMTP_SECURE = process.env.SMTP_SECURE;
  }
  if (process.env.SMTP_USER) config.email.SMTP_USER = process.env.SMTP_USER;
  if (process.env.SMTP_PASS) config.email.SMTP_PASS = process.env.SMTP_PASS;
  if (process.env.SMTP_FROM) config.email.SMTP_FROM = process.env.SMTP_FROM;

  if (process.env.SENDGRID_API_KEY) {
    config.sendGrid.apiKey = process.env.SENDGRID_API_KEY;
  }
  if (process.env.SENDGRID_FROM_EMAIL) {
    config.sendGrid.fromEmail = process.env.SENDGRID_FROM_EMAIL;
  }
  if (process.env.RESEND_API_KEY) config.resend.apiKey = process.env.RESEND_API_KEY;
  if (process.env.RESEND_FROM_EMAIL) {
    config.resend.fromEmail = process.env.RESEND_FROM_EMAIL;
  }
  if (process.env.PORT) config.server.port = parseInt(process.env.PORT, 10);

  return config;
};

export default () => {
    const baseSettings = JSON.parse(readFileSync(path.resolve(__dirname, '../../../config', 'base.json'), 'utf8'));
    const envSettings = JSON.parse(readFileSync(path.resolve(__dirname, '../../../config', `${ENV}.json`), 'utf8'));
    const final = Helpers.MergeDeep(baseSettings, envSettings);
    return applyEnvOverrides(yaml.load(JSON.stringify(final)) as Record<string, any>);
};