import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env.local or the shell environment.');
const sql = neon(process.env.DATABASE_URL);
await sql.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
for (const name of (await readdir(new URL('../db/migrations/', import.meta.url))).filter(n=>n.endsWith('.sql')).sort()) {
  const source = (await readFile(new URL('../db/migrations/'+name, import.meta.url), 'utf8')).replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');
  const checksum = createHash('sha256').update(source).digest('hex');
  const rows = await sql.query('SELECT checksum FROM schema_migrations WHERE name = $1', [name]);
  if (rows.length) { if (rows[0].checksum !== checksum) throw new Error('Applied migration changed: '+name); continue; }
  // These maintained migrations contain simple SQL only (no procedural blocks).
  const statements = source.replace(/^--.*$/gm, '').split(';').map(s=>s.trim()).filter(Boolean);
  await sql.transaction([
    ...statements.map(statement=>sql.query(statement)),
    sql.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum])
  ]);
  console.log('Applied '+name);
}
console.log('Database is up to date.');
