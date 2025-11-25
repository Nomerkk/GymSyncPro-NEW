import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../../shared/schema";
import { env } from "../config/index";

const hasDatabaseUrl = !!env.databaseUrl;

function createDbNotConfiguredStub() {
  const err: any = new Error("Database not configured. Set DATABASE_URL in .env");
  err.status = 503;

  const builder: any = {
    from() { return builder; },
    where() { return builder; },
    orderBy() { return builder; },
    limit() { return builder; },
    innerJoin() { return builder; },
    leftJoin() { return builder; },
    set() { return builder; },
    returning() { return builder; },
    values() { return builder; },
    onConflictDoNothing() { return builder; },
    then(onFulfilled: any, onRejected: any) {
      return Promise.reject(err).then(onFulfilled, onRejected);
    },
    catch(onRejected: any) {
      return Promise.reject(err).catch(onRejected);
    },
    finally(onFinally: any) {
      return Promise.reject(err).finally(onFinally);
    },
  };

  const root: any = {
    select() { return builder; },
    insert() { return builder; },
    update() { return builder; },
    delete() { return builder; },
    query() { return Promise.reject(err); },
  };

  return root as any;
}

const sql = hasDatabaseUrl ? neon(env.databaseUrl as string) : undefined;

export const db = hasDatabaseUrl && sql ? drizzle(sql, { schema }) : createDbNotConfiguredStub();

export * from "./repositories/index";

export * as databaseSchema from "../../shared/schema";

if (!hasDatabaseUrl) {
  console.warn("[startup] DATABASE_URL not set. API will run in 'no-database' mode and return 503 for DB-backed routes.");
}
