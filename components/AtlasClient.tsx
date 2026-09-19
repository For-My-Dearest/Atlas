'use client';
import { useMemo, useRef, useState } from 'react';
import MapHierarchySelect from './MapHierarchySelect';

export default function AtlasClient({ maps, characters, role }: { maps: any[]; characters: any[]; role: string }) {
  const [mapId, setMapId] = useState(maps[0]?.id || '');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<any>(null);
  const [placing, setPlacing] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [msg, setMsg] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const map = maps.find(m => m.id === mapId) || maps[0];
  const canPlace = role === 'GM';

  const markers = useMemo(() => map?.markers || [], [map]);

  function reset() { setZoom(1); setOffset({ x: 0, y: 0 }); }

  function focusCharacter(characterId: string) {
    setSelectedCharacter(characterId);
    if (!map || !stageRef.current) return;
    const marker = markers.find((m: any) => m.entityId === characterId && m.visibleToPlayers !== false);
    if (!marker) {
      setMsg('This character has not been placed on this map.');
      return;
    }
    const rect = stageRef.current.getBoundingClientRect();
    setOffset({
      x: rect.width / 2 - marker.x * rect.width * zoom,
      y: rect.height / 2 - marker.y * rect.height * zoom,
    });
    setMsg(`Showing ${characters.find(c => c.id === characterId)?.name || 'character'}.`);
  }

  async function place(e: React.PointerEvent<HTMLDivElement>) {
    if (!canPlace || !placing || !selectedCharacter || !map || drag) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left - rect.width / 2 - offset.x;
    const localY = e.clientY - rect.top - rect.height / 2 - offset.y;
    const x = Math.max(0, Math.min(1, (localX / zoom + rect.width / 2) / rect.width));
    const y = Math.max(0, Math.min(1, (localY / zoom + rect.height / 2) / rect.height));
    try {
      const r = await fetch(`/api/maps/${map.id}/markers`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ characterId: selectedCharacter, x, y }) });
      const data = await r.json().catch(() => ({}));
      if (r.ok) { setMsg('Character placed.'); window.location.reload(); }
      else setMsg(data.error || 'Could not place character.');
    } catch { setMsg('Could not reach the server.'); }
  }

  return <>
    <div className="toolbar">
      <MapHierarchySelect maps={maps} value={map?.id || ''} onChange={id => { setMapId(id); reset(); setSelectedCharacter(''); setMsg(''); }} />
      <div className="toolbar-right">
        <div className="zoom"><button aria-label="Zoom out" onClick={() => setZoom(z => Math.max(.6, z - .2))}>−</button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" onClick={() => setZoom(z => Math.min(4, z + .2))}>+</button><button onClick={reset}>Reset</button></div>
      </div>
    </div>

    <div className="placement-bar">
      <select aria-label="Choose a character" value={selectedCharacter} onChange={e => focusCharacter(e.target.value)}>
        <option value="">{canPlace ? 'Choose character to place…' : 'Find a character on the map…'}</option>
        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {canPlace ? <button className={placing ? 'primary' : 'ghost'} disabled={!selectedCharacter} onClick={() => { setPlacing(v => !v); setMsg(''); }}>{placing ? 'Click map to place · active' : 'Place character'}</button> : <span>Selecting a character only locates it. Players cannot move characters.</span>}
      <span>{msg}</span>
    </div>

    <div ref={stageRef} className="map-stage interactive" style={{ aspectRatio: map ? `${map.width}/${map.height}` : '3/2', cursor: placing ? 'crosshair' : drag ? 'grabbing' : 'grab' }} onPointerDown={e => { if (placing) return; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setDrag({ x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }); }} onPointerMove={e => { if (drag) setOffset({ x: drag.ox + e.clientX - drag.x, y: drag.oy + e.clientY - drag.y }); }} onPointerUp={e => { if (placing) { void place(e); return; } setDrag(null); }} onPointerCancel={() => setDrag(null)}>
      {map && <div className="map-world" style={{ transform: `translate(${offset.x}px,${offset.y}px) scale(${zoom})` }}><img src={map.imageUrl} alt={map.name} draggable={false}/>{markers.map((m: any) => { const c = characters.find(ch => ch.id === m.entityId); if (!c || (role === 'PLAYER' && !m.visibleToPlayers)) return null; return <button type="button" key={m.id} className="character-marker" style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }} onPointerDown={e => e.stopPropagation()} onClick={() => setSelectedCharacter(c.id)}><span className="marker-name">{c.name}</span><img src={c.portraitUrl || '/assets/chars/character-placeholder.svg'} alt={c.name}/></button>; })}</div>}
    </div>
    {selectedCharacter && <div className="marker-preview"><button className="close" onClick={() => setSelectedCharacter('')} aria-label="Close">×</button>{(() => { const c = characters.find(x => x.id === selectedCharacter); return c ? <><img src={c.portraitUrl || '/assets/chars/character-placeholder.svg'} alt={c.name}/><div><p className="kicker">CHARACTER</p><h3>{c.name}</h3>{c.title && <p>{c.title}</p>}<p>{c.description || c.publicInfo || 'No public description.'}</p><a className="primary inline" href={`/characters/${c.id}`}>View full profile →</a></div></> : null; })()}</div>}
  </>;
}
