import { boardSlug, getSql } from '@/db';
import { databaseFailure } from '@/db/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT l.id, l.author_name AS name, l.body, l.paper_color AS color, l.created_at AS date
      FROM letters l JOIN boards b ON b.id = l.board_id
      WHERE b.slug = ${boardSlug()}
      ORDER BY l.created_at DESC, l.id DESC
    `;
    return Response.json(rows, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return databaseFailure(error, 'load'); }
}

export async function POST(request: Request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({error:'이 페이지에서 다시 작성해 주세요.'}, {status:403});
  let data: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 64000)
      return Response.json({error:'편지 내용이 너무 길어요.'}, {status:413});
    data = JSON.parse(text);
  } catch { return Response.json({error:'올바른 편지 내용을 보내 주세요.'}, {status:400}); }
  if (!data || typeof data !== 'object')
    return Response.json({error:'이름과 내용을 확인해 주세요.'}, {status:400});
  const {name, body, color} = data as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || name.length > 40 ||
      typeof body !== 'string' || !body.trim() || body.length > 10000 ||
      (color !== undefined && (typeof color !== 'string' || !['cream','pink','sage'].includes(color))))
    return Response.json({error:'이름은 40자, 편지는 1만 자 이내로 작성해 주세요.'}, {status:400});
  try {
    const sql = getSql();
    // Check writing status and insert in one database statement.
    const rows = await sql`
      INSERT INTO letters (board_id, author_name, body, paper_color)
      SELECT id, ${name.trim()}, ${body.trim()}, ${color || 'cream'}
      FROM boards WHERE slug = ${boardSlug()} AND accepting_letters = true
      RETURNING id, author_name AS name, body, paper_color AS color, created_at AS date
    `;
    if (!rows.length) return Response.json({error:'편지 작성이 마감되었거나 롤링페이퍼가 없어요.'}, {status:409});
    return Response.json(rows[0], {status:201});
  } catch (error) { return databaseFailure(error, 'save'); }
}
