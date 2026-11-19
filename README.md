# Dulce Nube — React + Vite + Supabase

Aplicación web sencilla para administrar productos, ingredientes y ventas.

## Configuración
1. Instala Node.js si vas a ejecutarlo en tu computador.
2. Copia `.env.example` y renombra la copia como `.env`.
3. En Supabase entra a **Project Settings → API**.
4. Copia **Project URL** en `VITE_SUPABASE_URL` y la clave pública **anon / publishable** en `VITE_SUPABASE_ANON_KEY`.
5. Nunca pongas la clave `service_role` en una aplicación web.

## Ejecutar
```bash
npm install
npm run dev
```

## Tablas que usa esta versión
- `profiles`: `id`, `nombre`, `correo`, `rol`
- `ingredientes`: `id`, `nombre`, `precio`, `calorias`, `inventario`, `tipo`
- `productos`: `id`, `nombre`, `precio_publico`, `tipo`, `vaso`, `volumen_onzas`
- `ventas`: `id`, `producto`, `user_id`, `fecha`, `cantidad`, `total`

La tabla `producto_ingrediente` todavía no se utiliza en esta primera interfaz porque falta confirmar si tiene una columna con la cantidad de cada ingrediente por producto. Por la misma razón, esta versión no descuenta ingredientes del inventario al vender. Primero debemos confirmar esa relación para evitar descontar cantidades incorrectas.

La aplicación permite iniciar sesión, consultar productos e ingredientes, y al rol `admin` crear, editar y eliminar esos registros. También permite registrar ventas e historial.

Antes de publicar, configura políticas RLS en Supabase para restringir el acceso por usuario y rol. La interfaz por sí sola no reemplaza la seguridad de la base de datos.
