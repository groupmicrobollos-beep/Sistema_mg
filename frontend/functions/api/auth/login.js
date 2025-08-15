// /api/auth/login -> POST (y OPTIONS para CORS si hace falta)
export const onRequestOptions = async ({ request }) =>
    new Response(null, { headers: cors(request) });

export const onRequestPost = async ({ request, env }) => {
    const { email, password } = await request.json().catch(() => ({}));
    if (!email || !password) return json({ error: 'Email y password requeridos' }, 400);

    const { results } = await env.DB.prepare(
        'SELECT * FROM users WHERE email=? AND active=1'
    ).bind(email).all();
    const user = results?.[0];
    if (!user || !user.salt) return json({ error: 'Credenciales inválidas' }, 401);

    const hash = await sha256Hex(password + user.salt);
    if (hash !== user.password_hash) return json({ error: 'Credenciales inválidas' }, 401);

    // crear sesión
    const sid = crypto.randomUUID();
    const TTL_MIN = 60 * 24 * 30; // 30 días
    const expiresAt = new Date(Date.now() + TTL_MIN * 60 * 1000).toISOString();
    await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?,?,?)')
        .bind(sid, user.id, expiresAt).run();

    const userOut = {
        id: user.id, email: user.email, role: user.role,
        branch_id: user.branch_id, full_name: user.full_name,
        perms: permsFor(user.role),
    };

    return new Response(JSON.stringify(userOut), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            ...cors(request),
            'Set-Cookie': `sid=${sid}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TTL_MIN * 60}`,
        }
    });
};

// helpers
function cors(req) {
    const o = req.headers.get('Origin') || '*';
    return {
        'Access-Control-Allow-Origin': o,
        'Vary': 'Origin',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
}
function json(d, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } }); }
async function sha256Hex(s) { const b = new TextEncoder().encode(s); const d = await crypto.subtle.digest('SHA-256', b); return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join(''); }
function permsFor(role) { if (role === 'admin') return { all: true, inventory: true, quotes: true, settings: true, reports: true, pos: true }; if (role === 'seller') return { pos: true, quotes: true, inventory: true }; return {}; }
