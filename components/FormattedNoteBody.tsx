'use client';
import React from 'react';

function inline(text:string){
  const parts=text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[\[[^\]]+\]\])/g);
  return parts.map((part,i)=>{
    if(part.startsWith('**')&&part.endsWith('**')) return <strong key={i}>{part.slice(2,-2)}</strong>;
    if(part.startsWith('*')&&part.endsWith('*')) return <em key={i}>{part.slice(1,-1)}</em>;
    if(part.startsWith('`')&&part.endsWith('`')) return <code key={i}>{part.slice(1,-1)}</code>;
    if(part.startsWith('[[')&&part.endsWith(']]')) return <span key={i}>{part.slice(2,-2).split('|')[0]}</span>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
function cells(line:string){return line.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());}
export default function FormattedNoteBody({body,direction}:{body:string;direction?:string}){
 const lines=body.replace(/\r/g,'').split('\n'); const blocks:React.ReactNode[]=[]; let i=0;
 while(i<lines.length){
  const line=lines[i].trim();
  if(!line){i++;continue;}
  if(/^\|.*\|$/.test(line)&&i+1<lines.length&&/^\|?\s*:?-{2,}/.test(lines[i+1].trim())){
    const head=cells(line); const rows:string[][]=[]; i+=2; while(i<lines.length&&/^\|.*\|$/.test(lines[i].trim())){rows.push(cells(lines[i]));i++;}
    blocks.push(<div className="note-table-wrap" key={blocks.length}><table className="note-table"><thead><tr>{head.map((c,j)=><th key={j}>{inline(c)}</th>)}</tr></thead><tbody>{rows.map((r,j)=><tr key={j}>{head.map((_,k)=><td key={k}>{inline(r[k]||'')}</td>)}</tr>)}</tbody></table></div>); continue;
  }
  const heading=line.match(/^(#{1,6})\s+(.+)$/); if(heading){const H=`h${heading[1].length}` as any; blocks.push(React.createElement(H,{key:blocks.length},inline(heading[2])));i++;continue;}
  if(/^---+$/.test(line)){blocks.push(<hr key={blocks.length}/>);i++;continue;}
  if(/^[-*]\s+/.test(line)){const items:string[]=[];while(i<lines.length&&/^[-*]\s+/.test(lines[i].trim())){items.push(lines[i].trim().replace(/^[-*]\s+/,''));i++;}blocks.push(<ul key={blocks.length}>{items.map((x,j)=><li key={j}>{inline(x)}</li>)}</ul>);continue;}
  if(/^\d+[.)]\s+/.test(line)){const items:string[]=[];while(i<lines.length&&/^\d+[.)]\s+/.test(lines[i].trim())){items.push(lines[i].trim().replace(/^\d+[.)]\s+/,''));i++;}blocks.push(<ol key={blocks.length}>{items.map((x,j)=><li key={j}>{inline(x)}</li>)}</ol>);continue;}
  const para:string[]=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^(#{1,6})\s+/.test(lines[i].trim())&&!/^[-*]\s+/.test(lines[i].trim())&&!/^\d+[.)]\s+/.test(lines[i].trim())&&!/^\|.*\|$/.test(lines[i].trim())){para.push(lines[i].trim());i++;}
  blocks.push(<p key={blocks.length}>{inline(para.join(' '))}</p>);
 }
 return <div className={`formatted-note-body ${direction==='RTL'?'note-rtl':'note-ltr'}`} dir={direction==='RTL'?'rtl':'ltr'}>{blocks}</div>;
}
