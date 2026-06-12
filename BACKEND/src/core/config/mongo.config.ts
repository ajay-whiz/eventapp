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

export function buildMongoTypeOrmOptions(
  config: ConfigService,
  entitiesDir: string,
): TypeOrmModuleOptions {
  const mongoConfig = config.get<Record<string, unknown>>('mongodb') || {};
  const databaseUrl =
    process.env.DATABASE_URL || (mongoConfig.url as string | undefined);
  const database =
    process.env.MONGODB_DATABASE ||
    (mongoConfig.database as string | undefined) ||
    'event_booking';

  const base: TypeOrmModuleOptions = {
    type: 'mongodb',
    database,
    entities: entityPaths(entitiesDir),
    entityPrefix: '',
    synchronize: false,
    autoLoadEntities: true,
    logging: ['query', 'error'],
  };

  if (databaseUrl) {
    const useTls = shouldUseTls(databaseUrl, mongoConfig);

    return {
      ...base,
      url: databaseUrl,
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
              process.env.MONGODB_DIRECT_CONNECTION === 'true',
          }),
    };
  }

  const host =
    process.env.MONGODB_HOST || (mongoConfig.host as string | undefined);
  if (!host) {
    throw new Error(
      'MongoDB config required: set DATABASE_URL or MONGODB_HOST (with credentials)',
    );
  }

  const useTls = shouldUseTls(undefined, mongoConfig);

  return {
    ...base,
    host,
    port: Number(process.env.MONGODB_PORT || mongoConfig.port || 27017),
    username:
      process.env.MONGODB_USERNAME ||
      (mongoConfig.username as string | undefined),
    password:
      process.env.MONGODB_PASSWORD ||
      (mongoConfig.password as string | undefined),
    authSource:
      process.env.MONGODB_AUTH_SOURCE ||
      (mongoConfig.authSource as string | undefined) ||
      'admin',
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
  };
}
