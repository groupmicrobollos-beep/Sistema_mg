export async function onRequest(context) {
  const { env } = context;
  
  try {
    const suppliers = await env.DB.prepare(`
      SELECT * FROM suppliers 
      ORDER BY name ASC
    `).all();

    return new Response(JSON.stringify(suppliers.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
