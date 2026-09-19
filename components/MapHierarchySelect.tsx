'use client';
import { useMemo } from 'react';

function pathToRoot(maps:any[], id:string){
  const byId=new Map(maps.map(m=>[m.id,m])); const path:any[]=[]; let cur=byId.get(id);
  while(cur){ path.unshift(cur); cur=cur.parentId?byId.get(cur.parentId):null; }
  return path;
}

export default function MapHierarchySelect({maps,value,onChange}:{maps:any[];value:string;onChange:(id:string)=>void}){
  const path=useMemo(()=>pathToRoot(maps,value),[maps,value]);
  const levels:any[][]=[];
  let parentId:string|null=null;
  for(let i=0;i<=path.length;i++){
    const children=maps.filter(m=>(m.parentId||null)===parentId).sort((a,b)=>a.name.localeCompare(b.name));
    if(!children.length) break;
    levels.push(children);
    const selected=path[i];
    if(!selected) break;
    parentId=selected.id;
  }
  if(!levels.length) return null;
  return <div className="map-hierarchy-select" aria-label="Map hierarchy">
    {levels.map((options,level)=>{const selected=path[level]?.id||''; return <select key={level} value={selected} onChange={e=>onChange(e.target.value)} aria-label={`Map level ${level+1}`}>
      <option value="">Choose {level===0?'world':level===1?'region':'location'}…</option>
      {options.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
    </select>})}
  </div>;
}
