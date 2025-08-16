// /api/users/save.js

// ====== CORS ======
function cors(req) {
    const o = req.headers.get("Origin");
    return {
        "Access-Control-Allow-Origin": o || "*",
        "Vary": "Origin",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

function json(d, s = 200, req) {
    return new Response(JSON.stringify(d), {
        status: s,
        headers: { "Content-Type": "application/json", ...(req ? cors(req) : {}) },
    });
}

// ====== Utils ======
async function sha256Hex(s) {
    const b = new TextEncoder().encode(s);
    const d = await crypto.subtle.digest("SHA-256", b);
    return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const onRequestOptions = async ({ request }) =>
    new Response(null, { headers: cors(request) });

export const onRequestPost = async ({ request, env }) => {
    // 1) Verificar sesión
    const sid = request.headers.get("Cookie")?.match(/sid=([^;]+)/)?.[1];
    if (!sid) return json({ error: "No autorizado" }, 401, request);

    // 2) Body
    let body;
    try {
        body = await request.json();
    } catch {
        return json({ error: "Invalid JSON" }, 400, request);
    }

    const { id, username, email, password, role, full_name, branch_id, active } = body;

    // 3) Validaciones básicas
    if (!username?.trim()) return json({ error: "Username requerido" }, 400, request);
    if (!full_name?.trim()) return json({ error: "Nombre requerido" }, 400, request);
    if (!role) return json({ error: "Rol requerido" }, 400, request);

    try {
        // 4) Si tiene ID, actualizar
        if (id) {
            const updateFields = ["username=?", "email=?", "role=?", "full_name=?", "branch_id=?", "active=?"];
            const params = [username, email || null, role, full_name, branch_id || null, active ? 1 : 0];

            // Si hay password, actualizarlo también
            if (password) {
                const salt = crypto.randomUUID();
                const hash = await sha256Hex(password + salt);
                updateFields.push("password_hash=?", "salt=?");
                params.push(hash, salt);
            }

            params.push(id); // WHERE id=?

            await env.DB.prepare(`
                UPDATE users 
                SET ${updateFields.join(", ")}
                WHERE id=?
            `).bind(...params).run();

            return json({ success: true, message: "Usuario actualizado" });
        }

        // 5) Si no tiene ID, crear nuevo
        const salt = crypto.randomUUID();
        const hash = await sha256Hex((password || "admin") + salt);

        const { success } = await env.DB.prepare(`
            INSERT INTO users (username, email, password_hash, salt, role, full_name, branch_id, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            username,
            email || null,
            hash,
            salt,
            role,
            full_name,
            branch_id || null,
            active ? 1 : 0
        ).run();

        return json({ 
            success: true, 
            message: "Usuario creado",
            defaultPassword: !password ? "admin" : undefined
        });

    } catch (err) {
        console.error("[users/save] error:", err);
        return json({ error: "Error interno" }, 500, request);
    }
};
