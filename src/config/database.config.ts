import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get('DB_HOST', 'localhost'),
  port: config.get<number>('DB_PORT', 5432),
  username: config.get('DB_USERNAME', 'postgres'),
  password: config.get('DB_PASSWORD', 'postgres'),
  database: config.get('DB_NAME', 'microvault'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: config.get('DB_SYNC', 'false') === 'true',
  logging: config.get('DB_LOGGING', 'false') === 'true',
});
