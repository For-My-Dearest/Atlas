'use client';
import { useState } from 'react';

type Member = { id: string; displayName: string; email: string; role: string };

export default function AccountSettingsClient({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const [rows, setRows] = useState(members);
  const [editing, setEditing] = useState<Member | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  function open(member: Member) {
    setEditing(member); setPassword(''); setConfirm(''); setError(''); setSaved('');
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(''); setSaved('');
    if (password && password !== confirm) { setError('Passwords do not match.'); return; }
    if (password && password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: editing.id, displayName: editing.displayName, email: editing.email, password: password || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Could not update account.'); return; }
      setRows((current) => current.map((m) => m.id === data.id ? { ...m, ...data } : m));
      setEditing(null); setSaved('Account updated successfully.');
    } catch { setError('Could not reach the server. Make sure the development server is running.'); }
    finally { setBusy(false); }
  }

  return <div className="settings-stack">
    {saved && <div className="settings-success" role="status">{saved}</div>}
    {rows.map((member) => <article className="settings-card" key={member.id}>
      <div><p className="kicker">{member.role === 'GM' ? 'GAME MASTER' : 'PLAYER'}{member.id === currentUserId ? ' · YOU' : ''}</p><h3>{member.displayName}</h3><p className="settings-email">{member.email}</p></div>
      <button className="ghost" onClick={() => open(member)}>Edit account</button>
    </article>)}

    {editing && <div className="modal-backdrop"><form className="modal settings-modal" onSubmit={save}>
      <div className="modal-head"><div><p className="kicker">{editing.role === 'GM' ? 'GAME MASTER' : 'PLAYER'} ACCOUNT</p><h3>Edit account</h3></div><button type="button" className="ghost" onClick={() => setEditing(null)}>Close</button></div>
      <label>Display name<input value={editing.displayName} onChange={e => setEditing({...editing, displayName:e.target.value})} required maxLength={80}/></label>
      <label>Email<input type="email" value={editing.email} onChange={e => setEditing({...editing, email:e.target.value})} required maxLength={160}/></label>
      <div className="settings-password"><div><p className="kicker">OPTIONAL</p><h4>Change password</h4><p>Leave both fields blank to keep the current password.</p></div></div>
      <label>New password<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="At least 8 characters"/></label>
      <label>Confirm new password<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={8} autoComplete="new-password"/></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save account'}</button>
    </form></div>}
  </div>;
}
