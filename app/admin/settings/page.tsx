import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import AccountSettingsClient from '@/components/AccountSettingsClient';

export default async function AccountSettings() {
  const session = await getSession();
  if (!session) redirect('/login');
  const membership = session.user.memberships.find((m) => m.role === 'GM');
  if (!membership) redirect('/');

  const members = await db.campaignMember.findMany({
    where: { campaignId: membership.campaignId },
    include: { user: { select: { id: true, displayName: true, email: true } } },
    orderBy: { role: 'asc' },
  });

  return (
    <main className="shell">
      <header className="topbar">
        <div><span className="eyebrow">LIVING ATLAS</span><h1>Account settings</h1></div>
        <div className="top-actions"><span className="user-chip">{session.user.displayName} · GM</span><form action="/api/auth/logout" method="post"><button className="ghost">Sign out</button></form></div>
      </header>
      <div className="layout">
        <aside className="sidebar"><nav>
          <a href="/">Map</a><a href="/characters">Characters</a><a href="/notes">Notes</a><a className="active" href="/admin">GM Workspace</a><a className="subactive" href="/admin/settings">Account settings</a>
        </nav><div className="role">GM<small>{session.user.displayName}</small></div></aside>
        <section className="content">
          <div className="page-head"><div><p className="kicker">ADMINISTRATION</p><h2>Account settings</h2><p>Manage the campaign's GM and player login details. Passwords are stored securely as hashes.</p></div><a className="ghost" href="/admin">← GM Workspace</a></div>
          <AccountSettingsClient members={members.map((m) => ({ ...m.user, role: m.role }))} currentUserId={session.userId} />
        </section>
      </div>
    </main>
  );
}
