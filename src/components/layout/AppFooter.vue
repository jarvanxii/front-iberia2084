<template>
  <footer class="app-footer" aria-label="Aviso de ficción">
    <p class="footer-disclaimer">
      <strong>Iberia 2084</strong>
      <span aria-hidden="true"></span>
      <em>Cualquier parecido con la realidad es una extraña coincidencia.</em>
    </p>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  border-top: 1px solid rgba(125, 190, 255, 0.1);
  padding: 0.28rem var(--space-page);
  color: color-mix(in srgb, var(--color-muted) 88%, var(--color-text));
  background: rgba(4, 10, 18, 0.82);
}

.footer-disclaimer {
  display: flex;
  min-width: 0;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: color-mix(in srgb, var(--color-muted) 86%, var(--color-text));
  font-size: 0.66rem;
  line-height: 1.1;
  text-align: center;
}

.app-footer strong {
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--color-accent) 72%, var(--color-text));
  font-size: 0.66rem;
  font-weight: 950;
  text-transform: uppercase;
}

.footer-disclaimer span {
  display: block;
  width: 1px;
  height: 0.72rem;
  flex: 0 0 auto;
  background: rgba(125, 190, 255, 0.18);
}

.footer-disclaimer em {
  min-width: 0;
  overflow: hidden;
  font-style: normal;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 520px) {
  .app-footer {
    min-height: 38px;
    padding-top: 0.32rem;
    padding-bottom: 0.32rem;
  }

  .footer-disclaimer {
    gap: 0.34rem;
    font-size: 0.64rem;
  }

  .footer-disclaimer span {
    display: none;
  }

  .footer-disclaimer em {
    white-space: normal;
  }
}
</style>
