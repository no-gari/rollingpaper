import { boardSlug, getSql } from '@/db';
import { databaseFailure } from '@/db/errors';
export { GET } from '../result/route';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function mutate(request:Request, method:'POST'|'PATCH'|'DELETE') {
  const origin=request.headers.get('origin');
  if(origin && origin!==new URL(request.url).origin)
    return Response.json({error:'관리 화면에서 다시 시도해 주세요.'},{status:403});
  let data:Record<string,unknown>;
  try {
    const text=await request.text();
    if(new TextEncoder().encode(text).byteLength>64000)return Response.json({error:'내용이 너무 길어요.'},{status:413});
    const parsed=JSON.parse(text);
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error();
    data=parsed;
  } catch{return Response.json({error:'요청 내용을 확인해 주세요.'},{status:400})}
  const {id,name,body,color}=data;
  if(method!=='POST'&&(typeof id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))
    return Response.json({error:'쪽지 ID를 확인해 주세요.'},{status:400});
  if(method!=='DELETE'&&(typeof name!=='string'||!name.trim()||name.length>40||typeof body!=='string'||!body.trim()||body.length>10000||typeof color!=='string'||!['cream','pink','sage'].includes(color)))
    return Response.json({error:'이름은 40자, 내용은 1만 자 이내이며 편지지 색상을 선택해야 해요.'},{status:400});
  try{
    const sql=getSql();
    if(method==='POST'){
      // Management can add letters even when public collection is closed.
      const rows=await sql`
        INSERT INTO letters(board_id,author_name,body,paper_color)
        SELECT id,${(name as string).trim()},${(body as string).trim()},${color}
        FROM boards WHERE slug=${boardSlug()}
        RETURNING id,author_name AS name,body,paper_color AS color,created_at AS date
      `;
      if(!rows.length)return Response.json({error:'롤링페이퍼를 찾지 못했어요.'},{status:404});
      return Response.json(rows[0],{status:201,headers:{'Cache-Control':'no-store'}});
    }
    if(method==='PATCH'){
      const rows=await sql`
        UPDATE letters SET author_name=${(name as string).trim()},body=${(body as string).trim()},paper_color=${color}
        WHERE id=${id} AND board_id IN(SELECT id FROM boards WHERE slug=${boardSlug()})
        RETURNING id,author_name AS name,body,paper_color AS color,created_at AS date
      `;
      if(!rows.length)return Response.json({error:'쪽지가 없거나 이미 삭제되었어요.'},{status:404});
      return Response.json(rows[0],{headers:{'Cache-Control':'no-store'}});
    }
    const rows=await sql`
      DELETE FROM letters WHERE id=${id} AND board_id IN(SELECT id FROM boards WHERE slug=${boardSlug()}) RETURNING id
    `;
    if(!rows.length)return Response.json({error:'쪽지가 없거나 이미 삭제되었어요.'},{status:404});
    return Response.json({id:rows[0].id},{headers:{'Cache-Control':'no-store'}});
  }catch(error){return databaseFailure(error,'save')}
}
export async function POST(request:Request){return mutate(request,'POST')}
export async function PATCH(request:Request){return mutate(request,'PATCH')}
export async function DELETE(request:Request){return mutate(request,'DELETE')}
