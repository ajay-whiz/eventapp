import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

function entityPaths(entitiesDir: string): string[] {
  return [
    `${entitiesDir}/**/*.mongo.entity{.ts,.js}`,
    `${entitiesDir}/**/*.entity{.ts,.js}`,
  ];
}

function shouldUseTls(
  databaseUrl: string | undefined,
  mongoConfig: Record<string, unknown>,
): boolean {
  if (mongoConfig.tls === true) {
    return true;
  }
  if (mongoConfig.tls === false) {
    return false;
  }
  if (databaseUrl?.startsWith('mongodb+srv://')) {
    return true;
  }
  return process.env.MONGODB_TLS === 'true';
}

export function normalizeMongoDatabaseUrl(
  url: string,
  defaults?: { authSource?: string; database?: string },
): string {
  const authSource =
    defaults?.authSource ||
    process.env.MONGODB_AUTH_SOURCE ||
    'admin';
  const database =
    defaults?.database || process.env.MONGODB_DATABASE;

  try {
    const parsed = new URL(url);

    if (!parsed.searchParams.get('authSource') && authSource) {
      parsed.searchParams.set('authSource', authSource);
    }

    const pathDb = parsed.pathname.replace(/^\//, '');
    if (!pathDb && database) {
      parsed.pathname = `/${database}`;
    }

    return parsed.toString();
  } catch {
    if (!url.includes('authSource=') && authSource) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}authSource=${encodeURIComponent(authSource)}`;
    }
    return url;
  }
}

export function redactMongoUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return url.replace(/:([^:@/]+)@/, ':***@');
  }
}

export interface MongoConnectionSummary {
  source: string;
  host?: string;
  port?: number;
  username?: string;
  database?: string;
  authSource?: string;
  tls?: boolean;
  directConnection?: boolean;
  connectionUrl?: string;
}

export function summarizeMongoConnection(
  options: TypeOrmModuleOptions,
  source: string,
): MongoConnectionSummary {
  const url = (options as { url?: string }).url;

  if (url) {
    try {
      const parsed = new URL(url);
      return {
        source,
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 27017,
        username: parsed.username || undefined,
        database:
          parsed.pathname.replace(/^\//, '') ||
          (options as { database?: string }).database,
        authSource: parsed.searchParams.get('authSource') || undefined,
        tls: (options as { tls?: boolean }).tls,
        directConnection:
          parsed.searchParams.get('directConnection') === 'true' ||
          (options as { directConnection?: boolean }).directConnection,
        connectionUrl: redactMongoUrl(url),
      };
    } catch {
      return {
        source,
        database: (options as { database?: string }).database,
        connectionUrl: redactMongoUrl(url),
      };
    }
  }

  return {
    source,
    host: (options as { host?: string }).host,
    port: (options as { port?: number }).port,
    username: (options as { username?: string }).username,
    database: (options as { database?: string }).database,
    authSource: (options as { authSource?: string }).authSource,
    tls: (options as { tls?: boolean }).tls,
    directConnection: (options as { directConnection?: boolean }).directConnection,
  };
}

export function logMongoConnectionConfig(summary: MongoConnectionSummary): void {
  console.log(
    '[MongoDB] Using connection settings:',
    JSON.stringify(summary, null, 2),
  );
}

export function buildMongoTypeOrmOptions(
  config: ConfigService,
  entitiesDir: string,
): TypeOrmModuleOptions {
  const mongoConfig = config.get<Record<string, unknown>>('mongodb') || {};
  const rawDatabaseUrl =
    process.env.DATABASE_URL || (mongoConfig.url as string | undefined);
  const database =
    process.env.MONGODB_DATABASE ||
    (mongoConfig.database as string | undefined) ||
    'event_booking';
  const authSource =
    process.env.MONGODB_AUTH_SOURCE ||
    (mongoConfig.authSource as string | undefined) ||
    'admin';

  const base: TypeOrmModuleOptions = {
    type: 'mongodb',
    database,
    entities: entityPaths(entitiesDir),
    entityPrefix: '',
    synchronize: false,
    autoLoadEntities: true,
    logging: ['query', 'error'],
  };

  if (rawDatabaseUrl) {
    const databaseUrl = normalizeMongoDatabaseUrl(rawDatabaseUrl, {
      authSource,
      database,
    });
    const useTls = shouldUseTls(databaseUrl, mongoConfig);
    const connectionSource = process.env.DATABASE_URL
      ? 'DATABASE_URL env'
      : 'mongodb.url in config';

    const options = {
      ...base,
      url: databaseUrl,
      authSource,
      ...(useTls
        ? {
            tls: true,
            tlsAllowInvalidCertificates: false,
            minTLSVersion: 'TLSv1.2',
            retryWrites: true,
            w: 'majority',
          }
        : {
            directConnection:
              mongoConfig.directConnection === true ||
              process.env.MONGODB_DIRECT_CONNECTION === 'true' ||
              databaseUrl.includes('directConnection=true'),
          }),
    } as TypeOrmModuleOptions;

    logMongoConnectionConfig(summarizeMongoConnection(options, connectionSource));
    return options;
  }

  const host =
    process.env.MONGODB_HOST || (mongoConfig.host as string | undefined);
  if (!host) {
    throw new Error(
      'MongoDB config required: set DATABASE_URL or MONGODB_HOST (with credentials)',
    );
  }

  const useTls = shouldUseTls(undefined, mongoConfig);
  const connectionSource = process.env.MONGODB_HOST
    ? 'MONGODB_HOST env'
    : 'mongodb host fields in config';

  const options = {
    ...base,
    host,
    port: Number(process.env.MONGODB_PORT || mongoConfig.port || 27017),
    username:
      process.env.MONGODB_USERNAME ||
      (mongoConfig.username as string | undefined),
    password:
      process.env.MONGODB_PASSWORD ||
      (mongoConfig.password as string | undefined),
    authSource,
    directConnection:
      mongoConfig.directConnection === true ||
      process.env.MONGODB_DIRECT_CONNECTION !== 'false',
    ...(useTls
      ? {
          tls: true,
          tlsAllowInvalidCertificates: false,
          minTLSVersion: 'TLSv1.2',
        }
      : {}),
  } as TypeOrmModuleOptions;

  logMongoConnectionConfig(summarizeMongoConnection(options, connectionSource));
  return options;
}
