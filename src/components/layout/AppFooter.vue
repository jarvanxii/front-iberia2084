<template>
  <footer class="app-footer" aria-label="Aviso de ficción">
    <p>
      <strong>Iberia 2084</strong>
      <span>Cualquier parecido con la realidad es una extraña coincidencia.</span>
    </p>

    <nav class="footer-links" aria-label="Enlaces legales">
      <RouterLink :to="{ name: 'privacy' }">Privacidad</RouterLink>
      <RouterLink :to="{ name: 'terms' }">Términos</RouterLink>
      <RouterLink :to="{ name: 'contact' }">Contacto</RouterLink>
    </nav>
  </footer>
</template>

<style scoped>
.app-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: center;
  min-height: 34px;
  border-top: 1px solid rgba(125, 190, 255, 0.1);
  padding: 0.38rem var(--space-page);
  color: color-mix(in srgb, var(--color-muted) 88%, var(--color-text));
  background: rgba(4, 10, 18, 0.82);
}

.app-footer p {
  display: flex;
  min-width: 0;
  gap: 0.45rem;
  align-items: center;
  margin: 0;
  font-size: 0.68rem;
  line-height: 1.2;
}

.app-footer strong {
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--color-accent) 72%, var(--color-text));
  font-size: 0.66rem;
  font-weight: 950;
  text-transform: uppercase;
}

.app-footer p span {
  min-width: 0;
  overflow: hidden;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-links {
  display: flex;
  flex: 0 0 auto;
  gap: 0.18rem;
  align-items: center;
}

.footer-links a {
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 0.16rem 0.36rem;
  color: color-mix(in srgb, var(--color-muted) 82%, var(--color-accent));
  font-size: 0.66rem;
  font-weight: 850;
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;
}

.footer-links a:hover,
.footer-links a:focus-visible {
  border-color: rgba(125, 190, 255, 0.18);
  color: var(--color-text);
  background: rgba(90, 167, 232, 0.07);
  outline: none;
}

@media (max-width: 520px) {
  .app-footer {
    grid-template-columns: 1fr;
    gap: 0.24rem;
    min-height: 44px;
    padding-top: 0.34rem;
    padding-bottom: 0.34rem;
  }

  .app-footer p {
    justify-content: center;
    font-size: 0.64rem;
    text-align: center;
  }

  .app-footer p span {
    white-space: normal;
  }

  .footer-links {
    justify-content: center;
  }
}
</style>
