# España 2084 Frontend

Frontend de España 2084, juego de estrategia política y territorial construido con Vue 3, Vite, TypeScript, Pinia y Vue Router.

## Requisitos

- Node.js 22 LTS o superior compatible con Vite.
- npm.
- Backend de España 2084 disponible en local o remoto.

## Instalación

```powershell
npm install
```

## Entornos

Vite solo expone al navegador variables que empiezan por `VITE_`.

Variables usadas por el front:

```properties
VITE_APP_ENV=local
VITE_API_BASE_URL=http://localhost:8080
```

Archivos de ejemplo:

```text
.env.example
.env.local.example
.env.remoto.example
```

Para trabajar en local, crea `.env.local` a partir de `.env.local.example`.

Para probar contra la API remota, crea `.env.remoto` a partir de `.env.remoto.example` y cambia `VITE_API_BASE_URL` por el dominio real cuando esté decidido.

No se deben commitear `.env`, `.env.local`, `.env.remoto` ni archivos con secretos.

## Desarrollo

API local:

```powershell
npm run dev
```

Equivalente explícito:

```powershell
npm run dev:local
```

API remota:

```powershell
npm run dev:remoto
```

## Build

Build local:

```powershell
npm run build:local
```

Build remoto:

```powershell
npm run build:remoto
```

También se puede pasar el modo al script general:

```powershell
npm run build -- --mode remoto
```

## Verificación

```powershell
npm run type-check
npm run test:unit
npm run lint
npm run build
```

## Estructura

```text
src
|-- router      Rutas de la aplicación
|-- stores      Estado global con Pinia
|-- views       Pantallas de juego
|-- components  Componentes compartidos
|-- services    Clientes de API e integración HTTP
|-- types       Tipos de dominio compartidos
```

## Normas

- Mantener el front separado de la antigua plataforma de películas.
- No copiar código, assets, SQL ni documentación de La Pipa de Gandalf.
- Centralizar la URL de API en `VITE_API_BASE_URL`.
- Tipar los contratos del juego antes de usarlos en vistas o stores.
- Las reglas críticas del juego deben cubrirse con Vitest cuando empiecen a existir.
