export async function onRequest(context) {
  const { env } = context;
  const branch_id = 1; // TODO: Obtener de la sesión
  
  try {
    const suppliers = await env.DB.prepare(`
      SELECT s.*, 
             COUNT(DISTINCT p.id) as product_count,
             SUM(CASE WHEN (p.stock < p.min_stock) THEN 1 ELSE 0 END) as low_stock_count
      FROM suppliers s
      LEFT JOIN products p ON p.supplier_id = s.id AND p.branch_id = ?
      WHERE s.branch_id = ?
      GROUP BY s.id
      ORDER BY s.name ASC
    `).bind(branch_id, branch_id).all();

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
