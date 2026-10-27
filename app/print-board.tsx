'use client';
import {useEffect,useState} from 'react';
type Letter={id:string;name?:string;body?:string;color:string};
type Piece=Letter&{continued:boolean};
type Sheet=Piece[][];

export default function PrintBoard({letters,onReady}:{letters:Letter[];onReady:()=>void}){
 const [sheets,setSheets]=useState<Sheet[]>([]);
 useEffect(()=>{
  let cancelled=false;
  async function arrange(){
   await document.fonts.ready;
   if(cancelled)return;
   const probe=document.createElement('div');
   probe.className='print-measure';
   document.body.appendChild(probe);
   const ruler=document.createElement('div');ruler.style.height='148mm';probe.appendChild(ruler);
   const limit=ruler.getBoundingClientRect().height;ruler.remove();
   const gap=6*96/25.4;
   const height=(piece:Piece)=>{
    const card=document.createElement('article');card.className='print-card';
    const to=document.createElement('div');to.className='print-card-to';to.textContent=piece.continued?'정희님께 · 이어지는 마음':'정희님께 ♡';
    const body=document.createElement('p');body.textContent=piece.body||'';
    const from=document.createElement('div');from.className='print-card-from';from.textContent='From. '+(piece.name||'');
    card.append(to,body,from);probe.appendChild(card);
    const h=card.getBoundingClientRect().height;card.remove();return h;
   };
   const pages:Sheet[]=[];let columns:Piece[][]=[[],[],[]],used=[0,0,0];
   const add=(piece:Piece)=>{
    const h=height(piece);let fits=used.map((v,i)=>({i,v})).filter(x=>x.v+h<=limit).sort((a,b)=>a.v-b.v);
    if(!fits.length){pages.push(columns);columns=[[],[],[]];used=[0,0,0];fits=[{i:0,v:0}]}
    const col=fits[0].i;columns[col].push(piece);used[col]+=h+gap;
   };
   try{
    for(const letter of letters){
     let remaining=Array.from((letter.body||'').trimEnd());let continued=false;
     if(!remaining.length){add({...letter,body:'',continued});continue}
     while(remaining.length){
      const whole={...letter,body:remaining.join(''),continued};
      if(height(whole)<=limit){add(whole);break}
      let low=1,high=remaining.length,best=1;
      while(low<=high){const mid=Math.floor((low+high)/2);if(height({...letter,body:remaining.slice(0,mid).join(''),continued})<=limit-2){best=mid;low=mid+1}else high=mid-1}
      // Prefer a line/word boundary without dropping any source characters.
      const prefix=remaining.slice(0,best).join('');
      const boundary=Math.max(prefix.lastIndexOf('\n'),prefix.lastIndexOf(' '));
      if(boundary>prefix.length*.7)best=Array.from(prefix.slice(0,boundary+1)).length;
      add({...letter,body:remaining.slice(0,best).join(''),continued});
      remaining=remaining.slice(best);continued=true;
     }
    }
    if(columns.some(c=>c.length)||!pages.length)pages.push(columns);
    if(!cancelled){setSheets(pages);onReady();}
   }finally{probe.remove()}
  }
  arrange();return()=>{cancelled=true};
 },[letters,onReady]);
 return <div className="print-sheets" aria-hidden="true">{sheets.map((columns,index)=><section className="print-sheet" key={index}>
  <div className="print-sheet-heading"><span>✿</span><div><small>우리 팀이 함께 쓰는 응원의 한 장</small><h2>To. 김정희 책임님</h2><p>새로운 일상도, 반짝이는 매일도 응원해요!</p></div><span>♡</span></div>
  <div className="print-columns">{columns.map((column,i)=><div className="print-column" key={i}>{column.map((piece,j)=><article className={'print-card '+piece.color} key={piece.id+'-'+j}><span className="print-tape"/><div className="print-card-to">{piece.continued?'정희님께 · 이어지는 마음':'정희님께 ♡'}</div><p>{piece.body}</p><div className="print-card-from">From. {piece.name}</div></article>)}</div>)}</div>
  <footer className="print-sheet-footer"><span>정희님의 새로운 챕터에, 우리 팀 드림 ♡</span><span>{index+1} / {sheets.length}</span></footer>
 </section>)}</div>;
}
