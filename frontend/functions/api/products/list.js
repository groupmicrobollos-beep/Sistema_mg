// /api/products/list.js - Listar productos
export async function onRequestGet({ request, env }) {
    const { results } = await env.DB.prepare(`
        SELECT p.*, 
               COALESCE(SUM(CASE WHEN sm.type = 'in' THEN sm.quantity ELSE -sm.quantity END), 0) as stock_real
        FROM products p
        LEFT JOIN stock_movements sm ON sm.product_id = p.id
        GROUP BY p.id
        ORDER BY p.name
    `).all();
    
    return new Response(JSON.stringify(results || []));
}
