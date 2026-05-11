# Iberia 2084 Frontend

Frontend de Iberia 2084, juego de estrategia política, territorial y satírica construido con Vue 3, Vite, TypeScript, Pinia y Vue Router.

## Requisitos

- Node.js 22 LTS o superior compatible con Vite.
- npm.
- Backend de Iberia 2084 disponible en local o remoto.

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

También se puede pasar un modo al script general cuando sea necesario:

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

## Beta Jugable

La primera beta incluye registro, login, selección de partido, mapa territorial,
recursos con producción por minuto, acciones con temporizador, corrupción con
riesgo porcentual, catástrofes gestionables, investigaciones y coalición con
foro interno. La segunda vertical añade ciudad visual, edificios con niveles y
colas de generación de tropas políticas. La tercera vertical añade divisas,
intercambio, ministerios, iberopedia y mapa político responsive.

### Partidos Canónicos

- **Pantomima Popular (PP):** "Gestión, populismo y demagogia." Secundario: "Orden, puro y palco."
- **Unión Progresista Nacional (PISOE):** "Todo para el pueblo, pero sin el pueblo." Secundario: "Libertad, mafia e igualdad."
- **Grupo Independiente Liberal (GIL):** "Obras, orden y espectáculo." Secundario: "Menos papeles y más grúas."
- **Partido Unido Feminista Federal (PUFF...):** "Igualdad, sindicatos y mucho mucho enfado." Secundario: "¡Levantemos el puñito!"
- **Votantes obreros con Xilófono (VOX):** "Patria, bombo y xilófono." Alternativa: "Mucho himno, poco bemol."
- **Junts Units Nacionalment per la Terra Sobirana (JUNTS):** "Una provincia, una ilusión." Alternativa: "Lo nuestro primero, el resto va después."

### Experiencia De Juego

- La primera pantalla real es el juego, no una landing: el jugador debe entrar, elegir partido y empezar a operar.
- Ciudad muestra un mapa urbano con edificios políticos clicables, niveles, costes y temporizadores de mejora.
- Tropas muestra generación por cola con retratos, costes, cantidades, tiempo, requisitos de edificio y fuerza disponible.
- Intercambio permite transformar los tres recursos nucleares, pesetas, votos y favores, con pérdida política asumida.
- Eventos nacionales reutiliza el sistema de catástrofes: DANA, apagón, terremoto, pandemia y otros marrones gestionables.
- Ministerios muestra partidos gobernantes y mejoras activas por apoyo institucional.
- Iberopedia documenta recursos, tropas, investigaciones y edificios dentro del propio juego.
- Mapa global usa SVG responsive por comunidades/provincias para colorear cada territorio según quién gobierna.
- El mapa muestra territorios conquistables, dueño actual, edificio clave, defensa y recurso principal.
- Corrupción muestra riesgo base, coste, recompensa y consecuencia de pillada antes de lanzar la operación.
- Crisis muestra catástrofes activas con territorio, gravedad, temporizador y planes de gestión. Cada plan enseña porcentaje de éxito, coste, beneficio y posible ridículo.
- Políticas permite investigar mejoras con temporizador para producción, defensa, conquista y reducción de riesgo.
- Coalición permite crear, unirse y escribir en el foro interno de la alianza.

## Normas

- Mantener el front separado de la antigua plataforma de películas.
- No copiar código, assets, SQL ni documentación de La Pipa de Gandalf.
- Centralizar la URL de API en `VITE_API_BASE_URL`.
- Tipar los contratos del juego antes de usarlos en vistas o stores.
- Las reglas críticas del juego deben cubrirse con Vitest cuando empiecen a existir.
