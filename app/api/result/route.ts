import { boardSlug, getSql } from '@/db';
import { databaseFailure } from '@/db/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Intentionally URL-only access, as requested. This endpoint is not authenticated.
export async function GET() {
  try {
    const sql=getSql();
    const rows=await sql`
      SELECT l.id, l.author_name AS name, l.body, l.paper_color AS color, l.created_at AS date
      FROM letters l JOIN boards b ON b.id=l.board_id WHERE b.slug=${boardSlug()}
      ORDER BY l.created_at DESC,l.id DESC
    `;
    return Response.json(rows,{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
  } catch(error){return databaseFailure(error,'load')}
}
