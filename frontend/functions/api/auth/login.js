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

    // === Crear sesión (expira en 30 días) calculando la fecha en SQLite ===
    const sid = crypto.randomUUID();
    await env.DB.prepare(
        "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))"
    ).bind(sid, user.id).run();

    const userOut = {
        id: user.id,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id,
        full_name: user.full_name,
        perms: permsFor(user.role),
    };

    const TTL_MIN = 60 * 24 * 30;

    // Mismo dominio (front y API en el mismo host): Lax está perfecto.
    const cookie = `sid=${sid}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TTL_MIN * 60}`;

    // Si algún día servís front y API en DOMINIOS DISTINTOS, usá esto en su lugar:
    // const cookie = `sid=${sid}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${TTL_MIN * 60}`;

    return new Response(JSON.stringify(userOut), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            ...cors(request),
            'Set-Cookie': cookie,
        }
    });
};

// ===== helpers =====
function cors(req) {
    // Con credenciales no podemos usar '*'. Devolvemos el Origin recibido
    // o, si no hay, el origin del propio sitio (misma-origin no requiere CORS).
    const origin = req.headers.get('Origin') || new URL(req.url).origin;
    return {
        'Access-Control-Allow-Origin': origin,
        'Vary': 'Origin',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
}
function json(d, s = 200) {
    return new Response(JSON.stringify(d), {
        status: s,
        headers: { 'Content-Type': 'application/json' }
    });
}
async function sha256Hex(s) {
    const b = new TextEncoder().encode(s);
    const d = await crypto.subtle.digest('SHA-256', b);
    return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function permsFor(role) {
    if (role === 'admin') return { all: true, inventory: true, quotes: true, settings: true, reports: true, pos: true };
    if (role === 'seller') return { pos: true, quotes: true, inventory: true };
    return {};
}
