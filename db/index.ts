import { neon } from '@neondatabase/serverless';

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw Object.assign(new Error('DATABASE_URL is required'), {code:'DATABASE_URL_MISSING'});
  return neon(url);
}
export function boardSlug() {
  return process.env.BOARD_SLUG || 'jeonghui';
}
