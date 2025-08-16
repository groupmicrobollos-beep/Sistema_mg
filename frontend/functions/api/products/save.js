export async function onRequest(context) {
  const { env, request } = context;

  try {
    if (request.method === 'POST') {
      const product = await request.json();
      
      const result = await env.DB.prepare(`
        INSERT INTO products (
          id, name, description, category, supplier_id, 
          buyPrice, sellPrice, minStock, maxStock, stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        product.id || rid('product'),
        product.name,
        product.description || '',
        product.category || 'Insumos',
        product.supplier_id || '',
        product.buyPrice || 0,
        product.sellPrice || 0,
        product.minStock || 0,
        product.maxStock || 0,
        product.stock || 0
      ).run();

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function rid(p = "id") {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
