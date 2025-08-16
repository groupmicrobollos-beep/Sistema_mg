// /api/auth/me.js

// ===== CORS helpers =====
function cors(req) {
    const o = req.headers.get("Origin") || "*";
    return {
        "Access-Control-Allow-Origin": o,
        "Vary": "Origin",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}
function json(d, s = 200, req) {
    return new Response(JSON.stringify(d), {
        status: s,
        headers: { "Content-Type": "application/json", ...(req ? cors(req) : {}) },
    });
}

// ===== Permisos (alineado a login) =====
function permsFor(role) {
    if (role === "admin")
        return { all: true, inventory: true, quotes: true, settings: true, reports: true, pos: true };
    if (role === "seller")
        return { pos: true, quotes: true, inventory: true };
    return {};
}

// ===== Cookie helper (robusto) =====
function getCookie(req, name) {
    const all = req.headers.get("Cookie");
    if (!all) return null;
    const parts = all.split(";").map((v) => v.trim());
    const hit = parts.find((p) => p.startsWith(name + "="));
    return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

// ===== Handlers =====
export const onRequestOptions = async ({ request }) =>
    new Response(null, { headers: cors(request) });

export const onRequestGet = async ({ request, env }) => {
    // 1) Leer cookie 'sid'
    const sid = getCookie(request, "sid");
    if (!sid) return json({ error: "No session" }, 401, request);

    // 2) Buscar sesión válida (exp > ahora) + usuario activo
    //    Usamos epoch para evitar problemas de formato de fechas ISO vs datetime('now')
    const sql = `
    SELECT u.id, u.email, u.username, u.role, u.branch_id, u.full_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ?
      AND CAST(strftime('%s', s.expires_at) AS INTEGER) > CAST(strftime('%s','now') AS INTEGER)
      AND COALESCE(u.active,1) = 1
    LIMIT 1
  `;

    let row;
    try {
        const { results } = await env.DB.prepare(sql).bind(sid).all();
        row = results?.[0];
    } catch (err) {
        console.error("[me] query error", err);
        return json({ error: "Error interno" }, 500, request);
    }

    if (!row) return json({ error: "No session" }, 401, request);

    // 3) Responder usuario + permisos
    const userOut = {
        ...row,
        perms: permsFor(row.role),
    };

    return new Response(JSON.stringify(userOut), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            ...cors(request),
        },
    });
};
