# Operaciones Frontend Iberia 2084

## Repositorios y servidor

- Repo local: `C:\Users\Jarva\Desktop\git-repos\front-iberia2084`.
- Servidor asignado: Servidor 2, `192.168.0.253`.
- Ruta en servidor: `/var/www/iberia2084/front`.
- Salida de build en servidor: `/var/www/iberia2084/front/dist`.
- Front LAN por Nginx: `http://192.168.0.253:8083/`.
- Configuración Nginx: `/etc/nginx/sites-available/iberia2084`.
- Desplegar solo en el Servidor 2 asignado a Iberia 2084.

## Entornos

- Desarrollo local: `VITE_APP_ENV=local` y `VITE_API_BASE_URL=http://localhost:18081`.
- Build remoto servido por Nginx: `VITE_APP_ENV=remoto` y `VITE_API_BASE_URL=/api`.
- Solo las variables `VITE_` están disponibles en el navegador.
- Los `.env*` reales no se commitean; solo entran los `.example`.

## Despliegue en Servidor 2

```bash
cd /var/www/iberia2084/front
npm ci
VITE_APP_ENV=remoto VITE_API_BASE_URL=/api npm run build
sudo systemctl reload nginx
```

Nginx sirve el contenido de `dist` y proxya `/api` hacia el backend interno.

## Sincronización

Antes de desplegar cambios locales, comprobar `git status`, commitear y pushear lo que corresponda, y después hacer `git pull --ff-only` en el servidor.

## Credenciales

Las credenciales de acceso al servidor se consultan en `C:\Users\Jarva\Desktop\OPERACION AGENTICA.md`. No se imprimen ni se commitean.
