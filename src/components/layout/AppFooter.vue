<template>
  <footer class="app-footer" aria-label="Aviso de ficcion">
    <span class="footer-mark" aria-hidden="true">
      <span>IB</span>
      <strong>2084</strong>
    </span>

    <p>Cualquier parecido con la realidad es una extraña coincidencia.</p>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  gap: 0.72rem;
  align-items: center;
  min-height: 56px;
  border-top: 1px solid rgba(125, 190, 255, 0.16);
  padding: 0.72rem var(--space-page);
  color: color-mix(in srgb, var(--color-muted) 82%, var(--color-text));
  background:
    radial-gradient(circle at 0% 0%, rgba(90, 167, 232, 0.08), transparent 18rem),
    linear-gradient(180deg, rgba(7, 15, 26, 0.92), #050a12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.footer-mark {
  display: grid;
  flex: 0 0 auto;
  width: 34px;
  min-height: 31px;
  align-content: center;
  justify-items: center;
  border-left: 2px solid #5aa7e8;
  color: #9bd6ff;
  background: rgba(3, 10, 18, 0.34);
  line-height: 1;
}

.footer-mark span {
  font-size: 0.52rem;
  font-weight: 950;
}

.footer-mark strong {
  margin-top: 0.08rem;
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 950;
  letter-spacing: 0;
}

.app-footer p {
  margin: 0;
  font-size: 0.74rem;
  font-weight: 760;
  line-height: 1.35;
}

@media (max-width: 520px) {
  .app-footer {
    gap: 0.58rem;
    min-height: 52px;
    padding-top: 0.66rem;
    padding-bottom: 0.66rem;
  }

  .app-footer p {
    font-size: 0.7rem;
  }
}
</style>
