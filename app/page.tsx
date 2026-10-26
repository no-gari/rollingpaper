'use client';

import { useEffect, useRef, useState } from 'react';

type Letter = { id: string; name: string; body: string; color: string; date: string };
const colors = [{id:'cream',name:'노란 편지지'},{id:'pink',name:'분홍 편지지'},{id:'sage',name:'초록 편지지'}];
const date = (value:string) => new Date(value).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'});

export default function Page() {
  const [letters,setLetters] = useState<Letter[]>([]);
  const [mode,setMode] = useState<'write'|'read'|null>(null);
  const [selected,setSelected] = useState<Letter|null>(null);
  const [name,setName] = useState('');
  const [body,setBody] = useState('');
  const [color,setColor] = useState('cream');
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [query,setQuery] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const writer = useRef<HTMLTextAreaElement>(null);

  async function load() {
    setLoading(true);setError('');
    try {
      const r=await fetch('/api/letters');
      const data=await r.json();
      if(!r.ok) throw new Error(data.error);
      setLetters(data);
    } catch(e) {setError(e instanceof Error?e.message:'쪽지를 불러오지 못했어요. 다시 시도해 주세요.')}
    finally {setLoading(false)}
  }
  useEffect(()=>{
    load();
    try {
      const d=JSON.parse(localStorage.getItem('jh-draft')||'{}');
      setName(d.name||'');setBody(d.body||'');
      if(colors.some(c=>c.id===d.color))setColor(d.color);
    } catch {}
  },[]);
  useEffect(()=>{
    if(mode) {dialog.current?.showModal();if(mode==='write')writer.current?.focus()}
    else dialog.current?.close();
  },[mode]);
  function draft(n:string,b:string,c:string) {
    try{localStorage.setItem('jh-draft',JSON.stringify({name:n,body:b,color:c}))}catch{}
  }
  async function save(e:React.FormEvent) {
    e.preventDefault();setBusy(true);
    try {
      const r=await fetch('/api/letters',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,body,color})});
      const data=await r.json();if(!r.ok)throw new Error(data.error);
      setLetters(v=>[data,...v]);setBody('');draft(name,'',color);setMode(null);
      setNotice('정희님께 전할 쪽지를 붙였어요 ♡');
    } catch(e){setNotice(e instanceof Error?e.message:'저장하지 못했어요. 다시 시도해 주세요.')}
    finally{setBusy(false)}
  }
  async function share() {
    try{await navigator.clipboard.writeText(location.origin);setNotice('링크를 복사했어요. 팀원들에게 보내 주세요.')}
    catch{setNotice('주소창의 링크를 복사해 주세요.')}
  }
  const visible=letters.filter(l=>(l.name+' '+l.body).includes(query));
  return <>
    <header className="topbar">
      <a href="/" className="brand"><span>✿</span> 우리의 롤링페이퍼</a>
      <div className="top-actions"><button onClick={share}>↗ 링크 공유</button><button onClick={()=>window.print()}>▤ 인쇄 · PDF</button></div>
    </header>
    <main>
      <div className="board-toolbar">
        <div className="people"><span>♡</span> 함께 쓴 마음 <b>{letters.length}</b></div>
        <label className="search"><span>⌕</span><input aria-label="쪽지 검색" placeholder="이름 · 내용 찾기" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="검색 지우기" onClick={()=>setQuery('')}>×</button>}</label>
      </div>
      <section className="rolling-board" aria-label="김정희 책임님 롤링페이퍼">
        <div className="board-heading">
          <span className="heading-sticker" aria-hidden="true">✿</span>
          <span className="occasion">우리 팀이 함께 쓰는 응원의 한 장</span>
          <h1><span>To.</span> 김정희 책임님</h1>
          <p>새로운 일상도, 반짝이는 매일도 응원해요!</p>
          <div className="heading-doodle" aria-hidden="true">♡</div>
        </div>
        {loading?<div className="board-state">쪽지를 모으는 중이에요…</div>:error?
          <div className="board-state error"><p>{error}</p><button onClick={load}>다시 불러오기 ↻</button><small>작성 중인 쪽지는 이 기기에 임시 저장돼요.</small></div>:
          <div className="notes">
            {visible.map((letter,i)=><article key={letter.id} className={'note '+letter.color}>
              <span className="tape" aria-hidden="true"/>
              <button className="note-open" aria-label={letter.name+'님의 쪽지 전체 읽기'} onClick={()=>{setSelected(letter);setMode('read')}}>
                <span className="note-to">정희님께 <span aria-hidden="true">{['♡','✿','✧'][i%3]}</span></span>
                <span className="note-body">{letter.body}</span>
                <span className="note-bottom"><span>From. <b>{letter.name}</b></span><span className="read-more">펼쳐 읽기 ↗</span></span>
              </button>
            </article>)}
            {!query&&<button className="add-note" onClick={()=>setMode('write')}><span>＋</span><strong>{letters.length?'내 쪽지도 붙이기':'첫 쪽지를 붙여 주세요'}</strong><p>고마웠던 순간, 응원하는 마음.<br/>길게 써도 괜찮아요.</p><small>눌러서 쪽지 쓰기 ↗</small></button>}
            {query&&!visible.length&&<div className="board-state">찾는 쪽지가 없어요.</div>}
          </div>}
        {!loading&&!error&&!letters.length&&<div className="empty-doodles" aria-hidden="true"><span>우리의 마음이<br/>모일 자리!</span><i>⤴</i><b>✧</b></div>}
        <div className="board-signoff">정희님의 새로운 챕터에, 우리 팀 드림 <span>♡</span></div>
      </section>
      <p className="board-help">쪽지를 누르면 긴 편지도 끝까지 읽을 수 있어요. <span>인쇄할 때는 모든 쪽지의 전문이 나옵니다.</span></p>
    </main>
    <div className="floating-actions"><button className="refresh" aria-label="새 쪽지 불러오기" onClick={load} disabled={loading}>↻</button><button className="write-button" onClick={()=>setMode('write')}><span>✎</span> 쪽지 쓰기</button></div>
    <dialog ref={dialog} className={'paper-dialog '+(mode==='read'?'reading':'')} onCancel={e=>{if(busy)e.preventDefault();else setMode(null)}} onClose={()=>setMode(null)} onClick={e=>{if(e.target===e.currentTarget&&!busy)setMode(null)}}>
      {mode==='write'&&<div className="dialog-content">
        <div className="dialog-heading"><div><small>정희님 롤링페이퍼</small><h2>마음을 담아, 쪽지 한 장</h2></div><button className="close" disabled={busy} aria-label="작성창 닫기" onClick={()=>setMode(null)}>×</button></div>
        <form onSubmit={save}>
          <div className={'writing-paper '+color}>
            <span className="note-to">To. 김정희 책임님 <span>♡</span></span>
            <label className="sr-only" htmlFor="message">쪽지 내용</label>
            <textarea id="message" ref={writer} required maxLength={10000} placeholder={'정희님께 전하고 싶은 이야기를 써 주세요.\n함께했던 추억도, 응원도 좋아요.\n\n긴 편지도 최대 1만 자까지 담을 수 있어요.'} value={body} onChange={e=>{setBody(e.target.value);draft(name,e.target.value,color)}}/>
            <label className="from">From. <input required maxLength={40} placeholder="보내는 사람" aria-label="보내는 사람" value={name} onChange={e=>{setName(e.target.value);draft(e.target.value,body,color)}}/></label>
          </div>
          <div className="paper-controls"><div className="swatches" aria-label="편지지 색상">{colors.map(c=><button type="button" key={c.id} className={c.id} aria-label={c.name} aria-pressed={color===c.id} onClick={()=>{setColor(c.id);draft(name,body,c.id)}}>{color===c.id?'✓':''}</button>)}</div><span>{body.length.toLocaleString()} / 10,000자</span></div>
          <div className="submit-row"><span>작성 중인 내용은 이 기기에 임시 저장돼요.</span><button className="write-button" disabled={busy||!name.trim()||!body.trim()}>{busy?'쪽지 붙이는 중…':'롤링페이퍼에 붙이기 ↗'}</button></div>
        </form>
      </div>}
      {mode==='read'&&selected&&<div className={'reading-paper '+selected.color}><button className="close" aria-label="쪽지 닫기" onClick={()=>setMode(null)}>×</button><span className="note-to">To. 김정희 책임님 <span>♡</span></span><p className="full-letter">{selected.body}</p><div className="reading-signature"><b>From. {selected.name}</b><time>{date(selected.date)}</time></div></div>}
    </dialog>
    {notice&&<div className="toast" role="status">{notice}<button aria-label="알림 닫기" onClick={()=>setNotice('')}>×</button></div>}
  </>;
}
