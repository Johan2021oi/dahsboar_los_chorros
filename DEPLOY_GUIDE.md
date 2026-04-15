# Guia de Despliegue - Dashboard Granja Los Chorros

## Opcion 1: Despliegue en Vercel (Recomendado - Gratis)

### Paso 1: Configurar Variables de Entorno en Vercel

Cuando conectes el proyecto a Vercel, necesitas agregar estas variables de entorno:

```
VITE_SUPABASE_URL=https://ulewgxrzgqpajjudbpxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZXdneHJ6Z3FwYWpqdWRicHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjczMDAsImV4cCI6MjA5MTUxMjczMH0.UvXML06cCvLtvkEgbb7dQ4z8n1dV42gGTJ3NM8TU8ek
```

### Paso 2: Configuracion del Build

En Vercel, usa estas configuraciones:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Opcion 2: Ejecutable de Windows

Para crear un `.exe` distribuible:

```bash
npm run electron:build
```

El archivo estara en: `dist_electron/win-unpacked/Granja Los Chorros.exe`

## Base de Datos

La app usa Supabase (ya configurado). La base de datos esta en la nube y funciona desde cualquier dispositivo.

URL del proyecto: https://ulewgxrzgqpajjudbpxp.supabase.co
