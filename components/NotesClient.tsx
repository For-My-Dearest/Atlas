'use client';
import { useMemo, useState } from 'react';
import FormattedNoteBody from './FormattedNoteBody';

type Folder = { id: string; name: string; parentId: string | null; sortOrder?: number };

function buildTree(folders: Folder[]) {
  const byParent = new Map<string | null, Folder[]>();
  for (const folder of folders) {
    const key = folder.parentId || null;
    const list = byParent.get(key) || [];
    list.push(folder);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) list.sort((a,b) => a.name.localeCompare(b.name));
  return byParent;
}

export default function NotesClient({ initial, folders: initialFolders, campaignId, characters, locations, role, userId }: { initial:any[]; folders:Folder[]; campaignId:string; characters:any[]; locations:any[]; role:string; userId:string }) {
  const [notes,setNotes] = useState(initial);
  const [folders,setFolders] = useState(initialFolders);
  const [selectedFolder,setSelectedFolder] = useState<string | null>(null);
  const [collapsed,setCollapsed] = useState<Record<string,boolean>>({});
  const [editing,setEditing] = useState<any>(null), [open,setOpen] = useState(false), [error,setError] = useState('');
  const [folderEditing,setFolderEditing] = useState<Folder | null>(null), [folderOpen,setFolderOpen] = useState(false);
  const blank={title:'',body:'',linkedCharacterId:'',linkedLocationId:'',visibility:'PRIVATE',folderId:''};
  const isGM=role==='GM';
  const tree=useMemo(()=>buildTree(folders),[folders]);

  const visibleFolderIds = useMemo(() => {
    const ids = new Set<string>();
    for (const note of notes) if (note.folderId) ids.add(note.folderId);
    let changed=true;
    while(changed){changed=false;for(const f of folders){if(f.parentId&&ids.has(f.id)&&!ids.has(f.parentId)){ids.add(f.parentId);changed=true;}}}
    return ids;
  },[notes,folders]);

  function start(n?:any){setEditing(n?{...n}:blank);setOpen(true);setError('')}
  function startFolder(folder?:Folder){setFolderEditing(folder?{...folder}:{id:'',name:'',parentId:null,sortOrder:0});setFolderOpen(true);setError('')}

  async function save(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');const f=new FormData(e.currentTarget);
    const payload={title:String(f.get('title')||''),body:String(f.get('body')||''),linkedCharacterId:f.get('linkedCharacterId')||null,linkedLocationId:f.get('linkedLocationId')||null,visibility:f.get('visibility')||'PRIVATE',folderId:f.get('folderId')||null,campaignId};
    try{const r=editing?.id?await fetch(`/api/notes/${editing.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}):await fetch('/api/notes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const data=await r.json().catch(()=>({}));if(!r.ok){setError(data.error||'Could not save note.');return}setNotes(v=>editing?.id?v.map(n=>n.id===data.id?{...n,...data}:n):[{...data,folder:folders.find(x=>x.id===data.folderId)||null},...v]);setOpen(false)}catch{setError('Could not reach the server.')}
  }

  async function remove(n:any){if(!confirm(`Delete ${n.title}?`))return;try{const r=await fetch(`/api/notes/${n.id}`,{method:'DELETE'});if(r.ok)setNotes(v=>v.filter(x=>x.id!==n.id));else setError('Could not delete note.')}catch{setError('Could not reach the server.')}}

  async function saveFolder(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError('');const f=new FormData(e.currentTarget);const payload={name:String(f.get('name')||''),parentId:f.get('parentId')||null,sortOrder:Number(f.get('sortOrder')||0),campaignId};try{const r=folderEditing?.id?await fetch(`/api/note-folders/${folderEditing.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}):await fetch('/api/note-folders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const data=await r.json().catch(()=>({}));if(!r.ok){setError(data.error||'Could not save folder.');return}setFolders(v=>folderEditing?.id?v.map(x=>x.id===data.id?data:x):[...v,data]);setFolderOpen(false)}catch{setError('Could not reach the server.')}}
  async function removeFolder(folder:Folder){if(!confirm(`Delete "${folder.name}"? Notes and subfolders will be moved to its parent.`))return;const r=await fetch(`/api/note-folders/${folder.id}`,{method:'DELETE'});if(r.ok){setFolders(v=>v.filter(x=>x.id!==folder.id).map(x=>x.parentId===folder.id?{...x,parentId:folder.parentId}:x));setNotes(v=>v.map(n=>n.folderId===folder.id?{...n,folderId:folder.parentId,folder:folders.find(x=>x.id===folder.parentId)||null}:n));if(selectedFolder===folder.id)setSelectedFolder(folder.parentId)}else setError((await r.json().catch(()=>({}))).error||'Could not delete folder.')}

  function renderFolder(folder:Folder,depth=0):React.ReactNode{
    if(!isGM&&!visibleFolderIds.has(folder.id)) return null;
    const children=(tree.get(folder.id)||[]).filter(x=>isGM||visibleFolderIds.has(x.id));
    const isCollapsed=collapsed[folder.id];
    const count=notes.filter(n=>n.folderId===folder.id).length;
    return <div key={folder.id} className="notes-tree-item"><div className={`notes-folder-row ${selectedFolder===folder.id?'selected':''}`} style={{paddingLeft:10+depth*18}}><button className="tree-toggle" onClick={()=>setCollapsed(v=>({...v,[folder.id]:!v[folder.id]}))} aria-label={isCollapsed?'Expand':'Collapse'}>{children.length?(isCollapsed?'▸':'▾'):'·'}</button><button className="notes-folder-select" onClick={()=>setSelectedFolder(folder.id)}><span>📁</span><strong>{folder.name}</strong><small>{count}</small></button>{isGM&&<div className="folder-actions"><button onClick={()=>startFolder(folder)}>Edit</button><button className="danger" onClick={()=>removeFolder(folder)}>Delete</button></div>}</div>{!isCollapsed&&children.map(child=>renderFolder(child,depth+1))}</div>
  }

  const filtered=selectedFolder===null?notes:selectedFolder==='__unsorted'?notes.filter(n=>!n.folderId):notes.filter(n=>n.folderId===selectedFolder);
  const unsortedCount=notes.filter(n=>!n.folderId).length;
  const selectableFolders=isGM?folders:folders.filter(f=>visibleFolderIds.has(f.id));

  return <>
    <div className="page-head"><div><p className="kicker">CAMPAIGN KNOWLEDGE</p><h2>Notes</h2><p>{isGM?'Your campaign knowledge base. Sort it into folders, then choose exactly what players can see.':'Your private notes plus the campaign knowledge the DM has chosen to reveal.'}</p></div><div className="notes-top-actions"><button className="primary" onClick={()=>start()}>+ Add note</button>{isGM&&<button className="ghost" onClick={()=>startFolder()}>+ Folder</button>}</div></div>
    {error&&<p className="form-error">{error}</p>}
    <div className="notes-layout">
      <aside className="notes-sidebar">
        <div className="notes-sidebar-head"><div><p className="kicker">NOTE FOLDERS</p><strong>Organize your campaign</strong></div>{isGM&&<button className="ghost" onClick={()=>startFolder()}>+</button>}</div>
        <button className={`notes-all-row ${selectedFolder===null?'selected':''}`} onClick={()=>setSelectedFolder(null)}>All notes <small>{notes.length}</small></button>
        <button className={`notes-all-row ${selectedFolder==='__unsorted'?'selected':''}`} onClick={()=>setSelectedFolder('__unsorted')}>Unsorted <small>{unsortedCount}</small></button>
        <div className="notes-tree">{(tree.get(null)||[]).map(folder=>renderFolder(folder))}</div>
      </aside>
      <section className="notes-main"><div className="notes-main-head"><div><p className="kicker">{selectedFolder===null?'ALL NOTES':selectedFolder==='__unsorted'?'UNSORTED':folders.find(f=>f.id===selectedFolder)?.name||'NOTES'}</p><strong>{filtered.length} note{filtered.length===1?'':'s'}</strong></div></div><div className="notes-list">{filtered.map(n=>{const own=n.userId===userId;const editable=isGM||own;return <article className="note-card" key={n.id}><div><div className="note-meta"><span className={n.visibility==='PUBLIC'?'public-badge':'private-badge'}>{n.visibility==='PUBLIC'?'PUBLIC':'PRIVATE'}</span>{n.sourcePath&&<span className="source-badge">IMPORTED</span>}{n.folder&&<span className="source-badge">{n.folder.name}</span>}</div><h3>{n.title}</h3><FormattedNoteBody body={n.body} direction={n.direction}/><div className="note-links">{n.character&&<span>Character · {n.character.name}</span>}{n.location&&<span>Location · {n.location.name}</span>}</div></div>{editable&&<div className="card-actions"><button onClick={()=>start(n)}>Edit</button><button className="danger" onClick={()=>remove(n)}>Delete</button></div>}</article>})}{!filtered.length&&<div className="empty">No notes in this folder.</div>}</div></section>
    </div>
    {open&&<div className="modal-backdrop"><form className="modal" onSubmit={save}><div className="modal-head"><div><p className="kicker">{isGM?'CAMPAIGN NOTE':'PRIVATE NOTE'}</p><h3>{editing?.id?'Edit note':'New note'}</h3></div><button type="button" className="ghost" onClick={()=>setOpen(false)}>Close</button></div><label>Title<input name="title" defaultValue={editing?.title||''} required/></label><label>Body<textarea dir="auto" name="body" defaultValue={editing?.body||''} rows={12} required/></label><label>Folder<select name="folderId" defaultValue={editing?.folderId||''}><option value="">Unsorted</option>{selectableFolders.map(f=><option key={f.id} value={f.id}>{f.parentId?'↳ ':''}{f.name}</option>)}</select></label><div className="form-grid"><label>Link character<select name="linkedCharacterId" defaultValue={editing?.linkedCharacterId||''}><option value="">None</option>{characters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Link location<select name="linkedLocationId" defaultValue={editing?.linkedLocationId||''}><option value="">None</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label></div>{isGM&&<label>Visibility<select name="visibility" defaultValue={editing?.visibility||'PRIVATE'}><option value="PRIVATE">Private — GM only</option><option value="PUBLIC">Public — visible to players</option></select></label>}<button className="primary">Save note</button></form></div>}
    {folderOpen&&<div className="modal-backdrop"><form className="modal" onSubmit={saveFolder}><div className="modal-head"><div><p className="kicker">NOTE FOLDER</p><h3>{folderEditing?.id?'Edit folder':'New folder'}</h3></div><button type="button" className="ghost" onClick={()=>setFolderOpen(false)}>Close</button></div><label>Name<input name="name" defaultValue={folderEditing?.name||''} required/></label><label>Parent folder<select name="parentId" defaultValue={folderEditing?.parentId||''}><option value="">Top level</option>{folders.filter(f=>f.id!==folderEditing?.id).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><label>Sort order<input name="sortOrder" type="number" defaultValue={folderEditing?.sortOrder||0}/></label><button className="primary">Save folder</button></form></div>}
  </>
}
