import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../users/users.schema'; // Importáljuk az összes sémánkat

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  public readonly db: NodePgDatabase<typeof schema>;
  private readonly pool: Pool;

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');

    this.pool = new Pool({
      connectionString,
    });

    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
