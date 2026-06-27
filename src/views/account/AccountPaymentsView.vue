<template>
  <section class="account-view payments-view">
    <header class="account-hero">
      <span>pagos y domiciliaciones</span>
      <h1>Gestión económica de la cuenta</h1>
      <p>Todavía estamos desarrollando esta funcionalidad.</p>
    </header>

    <section class="payments-panel">
      <span>en desarrollo</span>
      <strong>Pagos y domiciliaciones no está disponible todavía.</strong>
      <p>
        Este apartado quedará reservado para métodos de pago, domiciliaciones, facturación y seguridad de cobros cuando
        la pasarela esté cerrada.
      </p>
    </section>
  </section>
</template>

<style scoped>
.account-view {
  display: grid;
  gap: var(--compact-gap);
  min-height: calc(100vh - var(--home-header-height));
  padding: var(--space-page);
  color: var(--color-text);
}

.account-hero {
  display: grid;
  gap: 0.22rem;
  border-bottom: 1px solid var(--color-border);
  padding: 0.2rem 0 0.78rem;
}

.account-hero span,
.payments-panel span {
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 950;
  text-transform: uppercase;
}

.account-hero h1,
.account-hero p,
.payments-panel p {
  margin: 0;
}

.account-hero h1 {
  font-size: clamp(1.55rem, 3vw, 2.35rem);
  line-height: 1.02;
}

.account-hero p,
.payments-panel p {
  color: var(--color-muted);
  font-weight: 760;
}

.payments-panel {
  display: grid;
  max-width: 760px;
  gap: 0.42rem;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-accent);
  border-radius: 8px;
  padding: 1rem;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 60%),
    var(--color-surface);
}

.payments-panel strong {
  font-size: 1.12rem;
  font-weight: 950;
}

@media (max-width: 560px) {
  .account-view {
    padding: var(--space-page) 0;
  }

  .account-hero,
  .payments-panel {
    margin-inline: var(--space-page);
  }
}
</style>
