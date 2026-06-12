import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const configDir = join(rootDir, 'config');
const baseExamplePath = join(rootDir, 'deploy', 'config', 'base.json.example');
const basePath = join(configDir, 'base.json');
const productionPath = join(configDir, 'production.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseCorsOrigins(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function ensureBaseConfig() {
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  if (!existsSync(basePath)) {
    if (!existsSync(baseExamplePath)) {
      throw new Error(`Missing config template at ${baseExamplePath}`);
    }
    writeFileSync(basePath, readFileSync(baseExamplePath, 'utf8'), 'utf8');
  }
}

function buildProductionConfig(baseConfig) {
  const cors = parseCorsOrigins(process.env.CORS_ORIGINS);
  const frontendUrl = process.env.FRONTEND_URL || baseConfig.general?.frontendUrl;

  return {
    mongodb: {
      type: 'mongodb',
      url: process.env.DATABASE_URL,
      database: process.env.MONGODB_DATABASE || 'event_booking',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    cors: cors.length > 0 ? cors : baseConfig.cors,
    jwt: {
      secret: process.env.JWT_SECRET || baseConfig.jwt?.secret,
      expireTime: process.env.JWT_EXPIRY || baseConfig.jwt?.expireTime || '2d',
      jwtIssuer: process.env.JWT_ISSUER || baseConfig.jwt?.jwtIssuer,
    },
    auth: {
      ...baseConfig.auth,
      googleClientId:
        process.env.GOOGLE_CLIENT_ID || baseConfig.auth?.googleClientId || '',
    },
    general: {
      ...baseConfig.general,
      frontendUrl,
    },
    email: {
      ...baseConfig.email,
      SMTP_HOST: process.env.SMTP_HOST || baseConfig.email?.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT || baseConfig.email?.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE || baseConfig.email?.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER || baseConfig.email?.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS || baseConfig.email?.SMTP_PASS,
      SMTP_FROM: process.env.SMTP_FROM || baseConfig.email?.SMTP_FROM,
      supportEmail:
        process.env.SMTP_FROM ||
        baseConfig.email?.supportEmail ||
        baseConfig.email?.SMTP_FROM,
    },
    sendGrid: {
      apiKey: process.env.SENDGRID_API_KEY || baseConfig.sendGrid?.apiKey || '',
      fromEmail:
        process.env.SENDGRID_FROM_EMAIL || baseConfig.sendGrid?.fromEmail || '',
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY || baseConfig.resend?.apiKey || '',
      fromEmail:
        process.env.RESEND_FROM_EMAIL || baseConfig.resend?.fromEmail || '',
    },
    aws: {
      ...baseConfig.aws,
      regionName: process.env.AWS_REGION || baseConfig.aws?.regionName,
      secretname: process.env.AWS_SECRET_NAME || baseConfig.aws?.secretname,
      bucketName: process.env.AWS_BUCKET_NAME || baseConfig.aws?.bucketName,
      bucketFolderName:
        process.env.AWS_BUCKET_FOLDER || baseConfig.aws?.bucketFolderName,
      bucketTempFolderName:
        process.env.AWS_BUCKET_TEMP_FOLDER ||
        baseConfig.aws?.bucketTempFolderName,
      accessKeyId:
        process.env.AWS_ACCESS_KEY_ID || baseConfig.aws?.accessKeyId || '',
      secretAccessKey:
        process.env.AWS_SECRET_ACCESS_KEY ||
        baseConfig.aws?.secretAccessKey ||
        '',
    },
    supabase: {
      url: process.env.SUPABASE_URL || baseConfig.supabase?.url || '',
      serviceKey:
        process.env.SUPABASE_SERVICE_KEY ||
        baseConfig.supabase?.serviceKey ||
        '',
      storageBucket:
        process.env.SUPABASE_STORAGE_BUCKET ||
        baseConfig.supabase?.storageBucket ||
        'uploads',
    },
    baseUrl: {
      ...baseConfig.baseUrl,
      headerImageUrl: frontendUrl || baseConfig.baseUrl?.headerImageUrl,
      cmsBaseUrl: frontendUrl || baseConfig.baseUrl?.cmsBaseUrl,
    },
  };
}

export function generateProductionConfig() {
  ensureBaseConfig();

  const baseConfig = readJson(basePath);
  const productionConfig = buildProductionConfig(baseConfig);

  if (!productionConfig.mongodb.url) {
    throw new Error('DATABASE_URL is required for production deployment');
  }

  if (!productionConfig.jwt.secret) {
    throw new Error('JWT_SECRET is required for production deployment');
  }

  writeFileSync(
    productionPath,
    `${JSON.stringify(productionConfig, null, 2)}\n`,
    'utf8',
  );

  return productionPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputPath = generateProductionConfig();
  console.log(`Generated production config at ${outputPath}`);
}
