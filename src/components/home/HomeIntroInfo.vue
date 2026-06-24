<template>
  <article class="panel home-intro-panel" aria-labelledby="home-intro-title">
    <header class="intro-heading">
      <p class="muted">Inicio</p>
      <h1 id="home-intro-title">Cómo se juega a Iberia 2084</h1>
      <p>
        Iberia 2084 es un juego de estrategia por provincias. Cada jugador entra en una partida, ocupa una provincia
        libre y desarrolla su capital provincial para producir recursos, entrenar unidades, defender su territorio y
        extender su influencia sobre el mapa de España.
      </p>
    </header>

    <section class="intro-section" aria-labelledby="goal-title">
      <h2 id="goal-title">Objetivo de la partida</h2>
      <p>
        El mapa está dividido en provincias. Una provincia solo puede pertenecer a un jugador en cada partida, así que
        elegir dónde empiezas importa. Tu objetivo es construir una base sólida, controlar más provincias, coordinarte
        con tu alianza y convertir tus recursos en ventaja territorial antes de que otros jugadores ocupen los huecos
        clave.
      </p>
    </section>

    <section class="intro-section" aria-labelledby="first-steps-title">
      <h2 id="first-steps-title">Tu primera partida, paso a paso</h2>
      <ol class="intro-steps">
        <li>
          <strong>Entra en Partidas.</strong>
          Elige una partida abierta. Cada cuenta puede participar en un máximo de 2 partidas a la vez.
        </li>
        <li>
          <strong>Escoge partido y nombre visible.</strong>
          El partido define tu identidad y tus unidades especiales, pero la pantalla de partidos es una guía: no muestra
          progreso privado del jugador.
        </li>
        <li>
          <strong>Empieza en una provincia libre.</strong>
          Cada ciudad es la capital de provincia. No hay nombres personalizados de ciudad: Madrid es Madrid, Tarragona
          es Tarragona y nadie más puede ocupar esa provincia dentro de la misma partida.
        </li>
        <li>
          <strong>Mejora edificios.</strong>
          La provincia funciona como tu base. Los edificios desbloquean unidades, aumentan producción y abren nuevas
          decisiones. Mira siempre coste, duración y consecuencia antes de iniciar una mejora.
        </li>
        <li>
          <strong>Entrena unidades.</strong>
          Las unidades de combate tienen ataque, plazas, tiempo de generación y tres defensas. Los transportes no
          atacan: indican si son terrestres, marítimos o aéreos. El tier indica complejidad y desbloqueo, no significa
          automáticamente que ocupe más plazas.
        </li>
        <li>
          <strong>Lee el mapa antes de actuar.</strong>
          En el mapa puedes ver a quién pertenece cada provincia, detectar huecos libres e invitar a otro jugador a
          empezar en una provincia disponible.
        </li>
      </ol>
    </section>

    <section class="intro-columns" aria-labelledby="systems-title">
      <h2 id="systems-title">Sistemas principales</h2>

      <section aria-labelledby="resources-title">
        <h3 id="resources-title">Recursos</h3>
        <p>
          Hay tres recursos: pesetas, votos y favores. Las pesetas pagan infraestructura y operaciones; los votos
          sostienen presión política; los favores desbloquean acciones más delicadas. Si una acción cuesta recursos,
          debe mostrar el coste antes de confirmarse.
        </p>
      </section>

      <section aria-labelledby="province-title">
        <h3 id="province-title">Provincia</h3>
        <p>
          La vista de provincia es el centro de mando. Desde ahí gestionas edificios, cola de construcción, producción y
          defensas. Si no sabes qué hacer, mejora edificios que desbloqueen unidades o aumenten producción.
        </p>
      </section>

      <section aria-labelledby="units-title">
        <h3 id="units-title">Unidades</h3>
        <p>
          Las unidades no se comparan solo por ataque. Mira plazas, tiempo, coste y defensas burocrática, incisiva y
          mediática. Algunas sirven para atacar, otras para aguantar presión, y el movimiento dependerá de transportes
          terrestres, marítimos y aéreos.
        </p>
      </section>

      <section aria-labelledby="map-title">
        <h3 id="map-title">Mapa</h3>
        <p>
          El mapa sirve para decidir dónde crecer. Una provincia ocupada ya tiene dueño; una provincia libre puede ser
          una oportunidad o una invitación para un amigo. Antes de gastar recursos, revisa propietario, defensa y valor
          estratégico.
        </p>
      </section>
    </section>

    <section class="intro-section" aria-labelledby="screen-guide-title">
      <h2 id="screen-guide-title">Qué mirar en cada apartado</h2>
      <dl class="intro-guide">
        <dt>Inicio</dt>
        <dd>Reglas generales y flujo básico para entender el juego sin entrar todavía en datos de tu partida.</dd>
        <dt>Partidas</dt>
        <dd>Lista de partidas abiertas, plazas ocupadas, estado del mapa y entrada a las partidas donde participas.</dd>
        <dt>Partidos</dt>
        <dd>Descripción y primer contacto con cada partido jugable, con tono, lema y personalidad.</dd>
        <dt>Unidades</dt>
        <dd>Catálogo explicativo de unidades comunes y especiales, con retrato, estadísticas, costes y desbloqueos.</dd>
        <dt>Edificios</dt>
        <dd>Catálogo de infraestructura provincial, usos, costes base, duración inicial y estética de cada edificio.</dd>
        <dt>Eventos</dt>
        <dd>Crisis globales que afectan al mundo activo y obligan a todos los jugadores a reaccionar.</dd>
        <dt>Investigaciones</dt>
        <dd>Mejoras comunes y tecnologías especiales de partido, con costes, duración y efecto jugable.</dd>
        <dt>Iberopedia</dt>
        <dd>Archivo interno del juego: edificios, investigaciones, unidades, reglas y sistemas de consulta rápida.</dd>
      </dl>
    </section>

    <section class="intro-section" aria-labelledby="rules-title">
      <h2 id="rules-title">Reglas que conviene recordar</h2>
      <ul class="intro-rules">
        <li>Una ciudad equivale a una provincia y cada provincia solo admite un propietario por partida.</li>
        <li>El juego usa 3 recursos principales: pesetas, votos y favores.</li>
        <li>No hay vínculo fijo entre partidos y provincias: cualquier partido puede empezar donde haya hueco libre.</li>
        <li>Antes de confirmar una acción importante, revisa coste, duración, riesgo y beneficio esperado.</li>
        <li>Si estás perdido, abre Provincia, mejora un edificio útil y después revisa Unidades y Mapa.</li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
.home-intro-panel {
  display: grid;
  gap: var(--compact-gap);
  padding: var(--compact-panel-padding);
}

.intro-heading,
.intro-section,
.intro-columns {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
}

.intro-heading {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-4);
}

.intro-heading .muted {
  margin: 0;
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 950;
  text-transform: uppercase;
}

.intro-heading h1,
.intro-section h2,
.intro-columns h2,
.intro-columns h3 {
  margin: 0;
  color: var(--color-text);
  line-height: 1.08;
}

.intro-heading h1 {
  font-size: clamp(1.55rem, 2.4vw, 2.35rem);
}

.intro-section h2,
.intro-columns h2 {
  font-size: 1.08rem;
}

.intro-columns h3 {
  font-size: 0.92rem;
}

.intro-heading p,
.intro-section p,
.intro-columns p,
.intro-steps,
.intro-rules,
.intro-guide {
  max-width: 102ch;
  margin: 0;
  color: var(--color-muted);
  font-size: 0.94rem;
  line-height: 1.55;
}

.intro-steps,
.intro-rules {
  padding-left: 1.25rem;
}

.intro-steps li,
.intro-rules li {
  margin: 0.42rem 0;
  padding-left: 0.18rem;
}

.intro-steps strong,
.intro-guide dt {
  color: var(--color-accent-strong);
}

.intro-columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-4) 0;
}

.intro-columns > h2 {
  grid-column: 1 / -1;
}

.intro-columns section {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  border-left: 2px solid color-mix(in srgb, var(--color-accent) 70%, transparent);
  padding-left: var(--space-3);
}

.intro-guide {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--space-2) var(--space-4);
}

.intro-guide dt {
  font-weight: 950;
}

.intro-guide dd {
  margin: 0;
}

@media (max-width: 760px) {
  .intro-columns,
  .intro-guide {
    grid-template-columns: 1fr;
  }

  .intro-guide {
    gap: var(--space-1);
  }

  .intro-guide dd {
    margin-bottom: var(--space-3);
  }
}
</style>
