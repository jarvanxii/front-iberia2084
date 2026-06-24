<script setup lang="ts">
import { computed } from 'vue'
import type { FactionDto } from '@/types/game'
import { sortByPartyOrder } from '@/utils/partyOrder'
import { partyLogo } from '@/utils/partyLogos'

const props = defineProps<{
  factions: FactionDto[]
}>()

interface PartyProfile {
  definition: string
  firstContact: string
  strengths: string[]
  tempo: string
}

const orderedFactions = computed(() => sortByPartyOrder(props.factions))

const primerCards = [
  {
    title: 'Qué son',
    body: 'Los partidos son estilos de juego: cada uno empuja los recursos, el ritmo y la presión política de forma distinta.',
  },
  {
    title: 'Qué mirar',
    body: 'Lee el tono, las fortalezas y el primer contacto antes de escoger. No hay un partido correcto, hay una forma de jugar.',
  },
  {
    title: 'Cómo decidir',
    body: 'Elige por tempo: aguantar, negociar, expandirte rápido, presionar o sobrevivir cuando el mapa se complique.',
  },
]

function factionProfile(faction: FactionDto): PartyProfile {
  const profiles: Record<string, PartyProfile> = {
    pp: {
      definition:
        'Bloque institucional y conservador: caja ordenada, favores discretos y una defensa que prefiere ganar por desgaste.',
      firstContact:
        'Buen primer partido si quieres aprender a construir sin ir siempre al choque. Perdona errores pequeños y premia la constancia.',
      strengths: ['Pesetas', 'Favores', 'Defensa'],
      tempo: 'Resistente',
    },
    pisoe: {
      definition:
        'Partido de subvención metódica, obra pública interminable y excusa administrativa siempre lista. Convierte trámites en músculo.',
      firstContact:
        'Cómodo si quieres crecer con paciencia: financia, inaugura, justifica el retraso y vuelve a financiar antes de que nadie encuentre el expediente.',
      strengths: ['Pesetas', 'Votos', 'Obras'],
      tempo: 'Administrativo',
    },
    gil: {
      definition:
        'Operación municipal liberticida: mucho ladrillo, mucha caja y una querencia peligrosa por inaugurar antes de preguntar.',
      firstContact:
        'Ideal si quieres una partida rápida y agresiva. Crece pronto, pero no dejes que la factura política te alcance.',
      strengths: ['Pesetas', 'Favores', 'Expansión'],
      tempo: 'Explosivo',
    },
    puff: {
      definition:
        'Movimiento de movilización social, defensa callejera y resistencia organizada ante mapas incómodos.',
      firstContact:
        'Funciona bien si prefieres reaccionar, bloquear avances y convertir crisis en oportunidad política.',
      strengths: ['Votos', 'Favores', 'Resistencia'],
      tempo: 'Reactivo',
    },
    vox: {
      definition:
        'Presión frontal, voto ruidoso y empuje directo. Menos filigrana, más choque y presencia constante.',
      firstContact:
        'Bueno si quieres entender rápido el combate político: avanza, fuerza decisiones y mide cuándo conviene parar.',
      strengths: ['Votos', 'Pesetas', 'Choque'],
      tempo: 'Agresivo',
    },
    junts: {
      definition:
        'Pactismo territorial y control de bisagra. Juega con fronteras, favores caros y acuerdos que cambian el tablero.',
      firstContact:
        'Para quien disfruta negociando. No siempre gana por tamaño, sino por hacer que cada provincia valga más.',
      strengths: ['Favores', 'Pesetas', 'Negociación'],
      tempo: 'Táctico',
    },
  }

  return (
    profiles[faction.code] ?? {
      definition: 'Partido híbrido pendiente de doctrina oficial, con margen para adaptarse a la partida.',
      firstContact: 'Observa sus recursos principales y busca una ventaja clara durante los primeros turnos.',
      strengths: ['Adaptación', 'Margen', 'Sorpresa'],
      tempo: 'Flexible',
    }
  )
}

</script>

<template>
  <section class="parties-guide">
    <header class="parties-hero">
      <div class="parties-title">
        <p class="muted">Partidos jugables</p>
        <h2>Partidos</h2>
      </div>

      <div class="parties-intro">
        <p>
          Esta pantalla es una guía de lectura rápida. Aquí no se muestra tu partida ni tu progreso: solo el carácter
          de cada partido, su forma de entrar en el juego y qué tipo de decisiones suele favorecer.
        </p>
      </div>
    </header>

    <section class="primer-grid" aria-label="Primer contacto con los partidos">
      <article v-for="card in primerCards" :key="card.title" class="primer-card">
        <span>{{ card.title }}</span>
        <p>{{ card.body }}</p>
      </article>
    </section>

    <div class="party-list">
      <article
        v-for="faction in orderedFactions"
        :key="faction.code"
        class="party-row"
        :style="{ '--faction': faction.color }"
      >
        <aside class="party-media">
          <img v-if="partyLogo(faction.code)" class="party-logo" :src="partyLogo(faction.code)" :alt="`Logo de ${faction.name}`" loading="lazy" />
          <span v-else class="party-logo-fallback">{{ faction.shortName.slice(0, 3) }}</span>
        </aside>

        <div class="party-main">
          <div class="party-kicker">
            <span>{{ faction.shortName }}</span>
          </div>
          <h3>{{ faction.name }}</h3>
          <p class="motto">{{ faction.motto }}</p>
          <p>{{ faction.satire }}</p>
        </div>

        <section class="party-definition" aria-label="Definición">
          <span>Definición</span>
          <strong>{{ factionProfile(faction).definition }}</strong>
          <div class="party-strengths">
            <em v-for="strength in factionProfile(faction).strengths" :key="strength">{{ strength }}</em>
          </div>
        </section>

        <section class="party-contact" aria-label="Primer contacto">
          <span>Primer contacto</span>
          <p>{{ factionProfile(faction).firstContact }}</p>
          <div class="contact-tags">
            <em>{{ factionProfile(faction).tempo }}</em>
          </div>
        </section>
      </article>
    </div>
  </section>
</template>

<style scoped>
.parties-guide {
  display: grid;
  gap: var(--compact-gap);
  scroll-margin-top: calc(var(--home-header-height) + var(--space-page));
}

.parties-hero {
  display: grid;
  grid-template-columns: minmax(240px, 0.45fr) minmax(0, 1fr);
  gap: var(--compact-gap);
  align-items: end;
  min-width: 0;
}

.parties-title h2,
.party-main h3 {
  margin: 0;
  color: var(--color-text);
  line-height: 1.05;
}

.parties-title h2 {
  font-size: clamp(1.7rem, 4vw, 3.05rem);
  font-weight: 950;
}

.parties-title p {
  margin: 0 0 0.16rem;
  font-weight: 850;
}

.parties-intro {
  border-left: 3px solid var(--color-accent);
  padding: var(--space-2) 0 var(--space-2) var(--compact-gap);
}

.parties-intro p,
.primer-card p,
.party-main p,
.party-contact p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.36;
}

.parties-intro p {
  max-width: 82ch;
  color: var(--color-text);
  font-size: 0.98rem;
}

.primer-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--compact-gap);
  min-width: 0;
}

.primer-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--strategy-inset);
}

.primer-card {
  display: grid;
  gap: var(--space-2);
  padding: var(--compact-card-padding);
}

.primer-card span,
.party-definition span,
.party-contact span {
  overflow: hidden;
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.party-list {
  display: grid;
  gap: var(--compact-gap);
  min-width: 0;
}

.party-row {
  display: grid;
  grid-template-columns: 178px minmax(240px, 0.95fr) minmax(280px, 1fr) minmax(240px, 0.72fr);
  gap: var(--compact-gap);
  align-items: stretch;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-left: 5px solid var(--faction);
  border-radius: var(--radius-md);
  padding: var(--compact-card-padding);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--faction) 13%, transparent), transparent 38%),
    var(--color-surface);
}

.party-media {
  position: relative;
  display: grid;
  align-self: center;
  min-height: 178px;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  aspect-ratio: 1;
  background:
    radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--faction) 19%, transparent), transparent 62%),
    linear-gradient(135deg, color-mix(in srgb, var(--faction) 16%, transparent), transparent 44%),
    var(--color-surface-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.party-media::before,
.party-media::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.party-media::before {
  inset: 0.55rem;
  border: 1px solid color-mix(in srgb, var(--faction) 34%, transparent);
}

.party-media::after {
  top: 0;
  bottom: 0;
  left: 18%;
  width: 1px;
  background: color-mix(in srgb, var(--faction) 22%, transparent);
  box-shadow:
    52px 0 0 color-mix(in srgb, var(--faction) 12%, transparent),
    104px 0 0 color-mix(in srgb, var(--faction) 12%, transparent);
  opacity: 0.68;
}

.party-logo {
  position: relative;
  z-index: 1;
  align-self: center;
  justify-self: center;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter:
    drop-shadow(0 16px 18px rgba(0, 0, 0, 0.36))
    drop-shadow(0 0 16px color-mix(in srgb, var(--faction) 18%, transparent));
}

.party-logo-fallback {
  position: relative;
  z-index: 1;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--color-text);
  font-size: 2rem;
  font-weight: 950;
}

.party-main,
.party-definition,
.party-contact {
  display: grid;
  align-content: center;
  gap: var(--compact-gap-sm);
  min-width: 0;
}

.party-kicker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  align-items: center;
  min-width: 0;
}

.party-kicker span,
.party-kicker em,
.party-strengths em,
.contact-tags em {
  border: 1px solid color-mix(in srgb, var(--faction) 54%, var(--color-border));
  border-radius: var(--radius-sm);
  padding: 0.16rem 0.34rem;
  color: color-mix(in srgb, var(--faction) 82%, var(--color-text));
  background: color-mix(in srgb, var(--faction) 10%, var(--color-surface));
  font-size: 0.66rem;
  font-style: normal;
  font-weight: 950;
}

.party-main h3 {
  overflow-wrap: anywhere;
  font-size: 1.18rem;
}

.party-main .motto {
  color: var(--color-accent);
  font-weight: 900;
}

.party-main p:not(.motto) {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.party-definition {
  border-left: 1px solid var(--color-border);
  padding-left: var(--compact-gap);
}

.party-definition strong {
  color: var(--color-text);
  font-weight: 850;
  line-height: 1.35;
}

.party-strengths,
.contact-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  min-width: 0;
}

.party-contact {
  align-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--compact-card-padding);
  background: var(--color-surface-soft);
}

@media (max-width: 1180px) {
  .parties-hero {
    grid-template-columns: 1fr;
  }

  .party-row {
    grid-template-columns: 160px minmax(0, 1fr) minmax(280px, 0.9fr);
  }

  .party-contact {
    grid-column: 2 / -1;
  }
}

@media (max-width: 820px) {
  .primer-grid {
    grid-template-columns: 1fr;
  }

  .party-row {
    grid-template-columns: 142px minmax(0, 1fr);
  }

  .party-definition,
  .party-contact {
    grid-column: 1 / -1;
  }

  .party-definition {
    border-left: 0;
    border-top: 1px solid var(--color-border);
    padding: var(--compact-gap) 0 0;
  }
}

@media (max-width: 560px) {
  .party-row {
    grid-template-columns: 1fr;
  }

  .party-media {
    min-height: 210px;
    aspect-ratio: 16 / 9;
  }
}
</style>
