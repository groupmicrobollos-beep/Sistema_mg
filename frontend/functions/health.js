export async function onRequest({ env }) {
    return new Response(JSON.stringify({ ok: true, hasDB: !!env.DB }), { headers: { 'Content-Type': 'application/json' } });
}
