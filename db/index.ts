import { neon } from '@neondatabase/serverless';

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  return neon(url);
}
export function boardSlug() {
  return process.env.BOARD_SLUG || 'jeonghui';
}
