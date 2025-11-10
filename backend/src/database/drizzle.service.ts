import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import * as userSchema from '../users/users.schema'; // Importáljuk az összes sémánkat
import * as tokenSchema from '../auth/auth.schema';

type DatabaseSchema = typeof userSchema & typeof tokenSchema;

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  public readonly db: NodePgDatabase<DatabaseSchema>;
  private readonly pool: Pool;

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');

    this.pool = new Pool({
      connectionString,
    });

    this.db = drizzle(this.pool, { schema: { ...userSchema, ...tokenSchema } });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
