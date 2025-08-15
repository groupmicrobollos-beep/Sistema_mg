// /api/auth/me -> GET (lee cookie 'sid')
export const onRequestGet = async ({ request, env }) => {
    const sid = getCookie(request, 'sid');
    if (!sid) return json({ error: 'No session' }, 401);

    const { results } = await env.DB.prepare(
        `SELECT u.id,u.email,u.role,u.branch_id,u.full_name
     FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.id=? AND s.expires_at > datetime('now')`
    ).bind(sid).all();

    const u = results?.[0];
    if (!u) return json({ error: 'No session' }, 401);
    return json({ ...u, perms: (u.role === 'admin' ? { all: true, inventory: true, quotes: true, settings: true, reports: true, pos: true } : { pos: true, quotes: true, inventory: true }) });
};

function getCookie(req, name) { const c = req.headers.get('Cookie') || ''; const m = c.match(new RegExp(`${name}=([^;]+)`)); return m ? decodeURIComponent(m[1]) : null; }
function json(d, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } }); }
