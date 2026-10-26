import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const migration = await readFile(new URL('../db/migrations/0001_initial.sql',import.meta.url),'utf8');
test('PostgreSQL schema, long letters, constraints, board isolation and closed collection', async()=>{
 const db=new PGlite();
 try {
 await db.exec(migration);
 const board=(await db.query("SELECT id FROM boards WHERE slug='jeonghui'")).rows[0].id;
 const insert=(name,body,color='cream',id=board)=>db.query('INSERT INTO letters (board_id,author_name,body,paper_color) VALUES ($1,$2,$3,$4) RETURNING id',[id,name,body,color]);
 await insert('팀원','가'.repeat(10000),'sage');
 assert.equal((await db.query('SELECT char_length(body) AS size FROM letters')).rows[0].size,10000);
 await assert.rejects(()=>insert('팀원','가'.repeat(10001)));
 await assert.rejects(()=>insert(' ','편지'));
 await assert.rejects(()=>insert('팀원',' '));
 await assert.rejects(()=>insert('팀원','내용','blue'));
 await assert.rejects(()=>insert('팀원','내용','cream','00000000-0000-4000-8000-000000000000'));
 const other=(await db.query("INSERT INTO boards(slug,recipient_name,title) VALUES('another','다른 분','다른 편지') RETURNING id")).rows[0].id;
 await insert('다른 팀원','다른 롤링페이퍼','pink',other);
 assert.equal((await db.query('SELECT count(*)::int AS count FROM letters WHERE board_id=$1',[board])).rows[0].count,1);
 const attack="Robert'); DROP TABLE letters; --";
 await insert(attack,'따옴표도 안전하게 저장');
 assert.equal((await db.query('SELECT author_name FROM letters WHERE author_name=$1',[attack])).rows[0].author_name,attack);
 await db.query('UPDATE boards SET accepting_letters=false WHERE id=$1',[board]);
 const closed=await db.query("INSERT INTO letters(board_id,author_name,body) SELECT id,$1,$2 FROM boards WHERE slug=$3 AND accepting_letters=true RETURNING id",['팀원','추가 편지','jeonghui']);
 assert.equal(closed.rows.length,0);
 await assert.rejects(()=>db.query('DELETE FROM boards WHERE id=$1',[board]));
 } finally { await db.close(); }
});
