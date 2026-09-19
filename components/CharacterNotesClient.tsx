'use client';
import { useState } from 'react';
import FormattedNoteBody from './FormattedNoteBody';

type Note = {
  id: string;
  title: string;
  body: string;
  linkedCharacterId?: string | null;
  direction?: string;
};

export default function CharacterNotesClient({ characterId, initial }: { characterId: string; initial: Note[] }) {
  const [notes, setNotes] = useState(initial);
  const [editing, setEditing] = useState<Note | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const blank = { title: '', body: '' };

  function start(note?: Note) {
    setEditing(note ? { ...note } : ({ id: '', ...blank } as Note));
    setError('');
    setOpen(true);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get('title') || ''),
      body: String(form.get('body') || ''),
      linkedCharacterId: characterId,
    };

    try {
      const response = editing?.id
        ? await fetch(`/api/notes/${editing.id}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/notes', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Could not save note.');
        return;
      }

      setNotes(current => editing?.id ? current.map(note => note.id === data.id ? data : note) : [data, ...current]);
      setOpen(false);
    } catch {
      setError('Could not reach the server. Make sure the development server is running.');
    }
  }

  async function remove(note: Note) {
    if (!confirm(`Delete ${note.title}?`)) return;
    try {
      const response = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
      if (response.ok) setNotes(current => current.filter(item => item.id !== note.id));
      else setError('Could not delete note.');
    } catch {
      setError('Could not reach the server.');
    }
  }

  return (
    <section className="character-notes">
      <div className="section-head">
        <div>
          <p className="kicker">PRIVATE CHARACTER NOTES</p>
          <h2>Your notes about this character</h2>
          <p>Only you can see these notes. They are separate from the campaign notes page.</p>
        </div>
        <button className="primary" onClick={() => start()}>+ Add note</button>
      </div>

      {error && <p className="form-error">{error}</p>}
      <div className="notes-list">
        {notes.map(note => (
          <article className="note-card" key={note.id}>
            <div>
              <p className="kicker">PRIVATE NOTE</p>
              <h3>{note.title}</h3>
              <FormattedNoteBody body={note.body} direction={note.direction} />
            </div>
            <div className="card-actions">
              <button onClick={() => start(note)}>Edit</button>
              <button className="danger" onClick={() => remove(note)}>Delete</button>
            </div>
          </article>
        ))}
        {!notes.length && <div className="empty">No private notes for this character yet.</div>}
      </div>

      {open && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={save}>
            <div className="modal-head">
              <div><p className="kicker">PRIVATE CHARACTER NOTE</p><h3>{editing?.id ? 'Edit note' : 'New character note'}</h3></div>
              <button type="button" className="ghost" onClick={() => setOpen(false)}>Close</button>
            </div>
            <label>Title<input name="title" defaultValue={editing?.title || ''} required /></label>
            <label>Note<textarea dir="auto" name="body" defaultValue={editing?.body || ''} rows={12} required /></label>
            <button className="primary" type="submit">Save note</button>
          </form>
        </div>
      )}
    </section>
  );
}
