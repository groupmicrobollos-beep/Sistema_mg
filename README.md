# Sistema POS Microbollos

Sistema de Punto de Venta (POS) diseñado específicamente para la gestión de panaderías y negocios similares. Desarrollado con tecnologías modernas y optimizado para un rendimiento eficiente.

## Características

- ✨ **Gestión de Inventario**
  - Control de stock en tiempo real
  - Alertas de stock mínimo
  - Gestión de proveedores
  - Lista de compras automática
  - Exportación/Importación de datos

- 🏪 **Gestión de Sucursales**
  - Múltiples sucursales
  - Control de stock por sucursal
  - Transferencias entre sucursales

- 💰 **Ventas y Presupuestos**
  - Generación rápida de presupuestos
  - Conversión de presupuesto a venta
  - Historial de transacciones
  - Múltiples formas de pago

- 👥 **Gestión de Usuarios**
  - Roles y permisos
  - Autenticación segura
  - Registro de actividades

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript Vanilla
- **Backend**: Cloudflare Workers
- **Base de Datos**: Cloudflare D1 (SQLite)
- **API**: REST
- **Autenticación**: JWT

## Requisitos

- Node.js >= 16.0.0
- Wrangler CLI
- Cuenta en Cloudflare

## Instalación

1. Clonar el repositorio:
\`\`\`bash
git clone https://github.com/tu-usuario/sistema-pos-microbollos.git
cd sistema-pos-microbollos
\`\`\`

2. Instalar dependencias:
\`\`\`bash
cd frontend
npm install
\`\`\`

3. Configurar variables de entorno:
   - Crear archivo \`.env\` en la raíz del proyecto
   - Copiar \`.env.example\` y completar con tus valores

4. Configurar base de datos:
\`\`\`bash
wrangler d1 create pos_db
wrangler d1 execute pos_db --file=./migrations/004_setup_tables.sql
\`\`\`

5. Iniciar el servidor de desarrollo:
\`\`\`bash
npm run dev
\`\`\`

## Estructura del Proyecto

\`\`\`
sistema-pos-microbollos/
├── frontend/                # Aplicación frontend
│   ├── functions/          # API endpoints
│   ├── js/                 # Lógica de la aplicación
│   │   ├── components/     # Componentes reutilizables
│   │   └── pages/         # Páginas de la aplicación
│   └── assets/            # Recursos estáticos
├── migrations/             # Migraciones de base de datos
└── wrangler.toml          # Configuración de Cloudflare Workers
\`\`\`

## API Endpoints

### Productos
- GET `/api/products/list` - Listar productos
- POST `/api/products/save` - Crear producto
- PUT `/api/products/[id]` - Actualizar producto
- DELETE `/api/products/[id]` - Eliminar producto

### Proveedores
- GET `/api/suppliers/list` - Listar proveedores
- POST `/api/suppliers/save` - Crear proveedor
- PUT `/api/suppliers/[id]` - Actualizar proveedor
- DELETE `/api/suppliers/[id]` - Eliminar proveedor

### Presupuestos
- GET `/api/quotes/list` - Listar presupuestos
- POST `/api/quotes/save` - Crear presupuesto
- GET `/api/quotes/[id]` - Obtener presupuesto
- PUT `/api/quotes/[id]` - Actualizar presupuesto

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add some AmazingFeature'\`)
4. Push a la rama (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## Autor

**BLINT** - *Desarrollo inicial* - [GitHub](https://github.com/blint)

## Agradecimientos

- A todos los contribuidores que participan en este proyecto
- A la comunidad de desarrolladores que mantiene las herramientas utilizadas
- A Cloudflare por su excelente infraestructura

---
Copyright © 2025 BLINT. Todos los derechos reservados.
