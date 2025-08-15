// /api/auth/login.js

// ====== CORS ======
function cors(req) {
  const o = req.headers.get("Origin");
  // Nota: con credenciales, lo ideal es eco del Origin real.
  return {
    "Access-Control-Allow-Origin": o || "*",
    "Vary": "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Respuesta JSON (si pasás request, agrega CORS)
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

function permsFor(role) {
  if (role === "admin")
    return { all: true, inventory: true, quotes: true, settings: true, reports: true, pos: true };
  if (role === "seller")
    return { pos: true, quotes: true, inventory: true };
  return {};
}

// ====== Schema helper (evita 500 si aún no existe sessions) ======
let sessionsSchemaEnsured = false;
async function ensureSessionsSchema(env) {
  if (sessionsSchemaEnsured) return;
  try {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at TEXT NOT NULL)"
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)"
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions(expires_at)"
    ).run();
    sessionsSchemaEnsured = true;
  } catch (err) {
    // No rompemos el flujo por error de DDL; solo dejamos log
    console.warn("[login] ensureSessionsSchema warn:", err?.message || err);
  }
}

// ====== Handlers ======
export const onRequestOptions = async ({ request }) =>
  new Response(null, { headers: cors(request) });

export const onRequestPost = async ({ request, env }) => {
  // 1) Body
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Soportar identifier/email; normalizar email a lowercase
  const { identifier, email, password } = body;
  const identRaw = (identifier ?? email ?? "").trim();
  const ident = identRaw.includes("@") ? identRaw.toLowerCase() : identRaw;
  const pass = (password ?? "").trim();

  if (!ident || !pass) {
    return json({ error: "Usuario/email y password requeridos" }, 400, request);
  }

  // 2) Buscar usuario (case-insensitive y active por defecto = 1)
  const byEmail = ident.includes("@");
  const query = byEmail
    ? `SELECT id,email,username,role,branch_id,full_name,salt,password_hash,active
       FROM users
       WHERE lower(email)=lower(?) AND COALESCE(active,1)=1
       LIMIT 1`
    : `SELECT id,email,username,role,branch_id,full_name,salt,password_hash,active
       FROM users
       WHERE lower(username)=lower(?) AND COALESCE(active,1)=1
       LIMIT 1`;

  let user;
  try {
    const { results } = await env.DB.prepare(query).bind(ident).all();
    user = results?.[0];
  } catch (err) {
    console.error("[login] query error", err);
    return json({ error: "Error interno" }, 500, request);
  }

  if (!user || !user.salt || !user.password_hash) {
    return json({ error: "Credenciales inválidas" }, 401, request);
  }

  // 3) Verificar hash (tolerante a casing en DB)
  const hash = await sha256Hex(pass + user.salt);
  if (hash.toLowerCase() !== String(user.password_hash).toLowerCase()) {
    return json({ error: "Credenciales inválidas" }, 401, request);
  }

  // 4) Crear sesión + cookie
  const sid = crypto.randomUUID();
  const TTL_MIN = 60 * 24 * 30; // 30 días
  const expiresAt = new Date(Date.now() + TTL_MIN * 60 * 1000).toISOString();

  // asegurar schema de sessions (idempotente)
  await ensureSessionsSchema(env);

  async function insertSession() {
    await env.DB.prepare(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES (?,?,?)"
    ).bind(sid, user.id, expiresAt).run();
  }

  try {
    await insertSession();
  } catch (err) {
    // Si la tabla no existe por alguna razón, intentar crearla y reintentar una vez
    const msg = String(err?.message || err);
    if (/no such table/i.test(msg) || /does not exist/i.test(msg)) {
      await ensureSessionsSchema(env);
      try {
        await insertSession();
      } catch (err2) {
        console.error("[login] insert session retry error", err2);
        return json({ error: "Error interno" }, 500, request);
      }
    } else {
      console.error("[login] insert session error", err);
      return json({ error: "Error interno" }, 500, request);
    }
  }

  const userOut = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    branch_id: user.branch_id,
    full_name: user.full_name,
    perms: permsFor(user.role),
  };

  return new Response(JSON.stringify(userOut), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...cors(request),
      // Cookie HttpOnly/Secure para Pages (dominio *.pages.dev o custom)
      "Set-Cookie": `sid=${sid}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TTL_MIN * 60}`,
    },
  });
};
