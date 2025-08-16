// /api/users/list.js

function cors(req) {
    const o = req.headers.get("Origin");
    return {
        "Access-Control-Allow-Origin": o || "*",
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

export const onRequestOptions = async ({ request }) =>
    new Response(null, { headers: cors(request) });

export const onRequestGet = async ({ request, env }) => {
    // 1) Verificar sesión
    const sid = request.headers.get("Cookie")?.match(/sid=([^;]+)/)?.[1];
    if (!sid) return json({ error: "No autorizado" }, 401, request);

    try {
        // 2) Obtener usuarios (excepto passwords)
        const { results } = await env.DB.prepare(`
            SELECT id, username, email, role, full_name, branch_id, active,
                   created_at, updated_at
            FROM users
            ORDER BY username
        `).all();

        return json(results || []);

    } catch (err) {
        console.error("[users/list] error:", err);
        return json({ error: "Error interno" }, 500, request);
    }
};
