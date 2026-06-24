<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

export interface DropdownOption {
  value: string | number
  label: string
  meta?: string
  badge?: string
  icon?: string
  color?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null
    options: DropdownOption[]
    placeholder?: string
    ariaLabel?: string
  }>(),
  {
    placeholder: 'Seleccionar',
    ariaLabel: 'Seleccionar opción',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const root = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const opensUp = ref(false)
const highlightedIndex = ref(0)
const listboxId = `dropdown-${Math.random().toString(36).slice(2)}`

const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue) ?? null)
const enabledOptions = computed(() => props.options.filter((option) => !option.disabled))

watch(
  () => props.modelValue,
  () => {
    const index = props.options.findIndex((option) => option.value === props.modelValue)
    highlightedIndex.value = Math.max(0, index)
  },
  { immediate: true },
)

function open() {
  if (!props.options.length) return
  const bounds = root.value?.getBoundingClientRect()
  if (bounds) {
    const spaceBelow = window.innerHeight - bounds.bottom
    const spaceAbove = bounds.top
    opensUp.value = spaceBelow < 320 && spaceAbove > spaceBelow
  }
  isOpen.value = true
  const index = props.options.findIndex((option) => option.value === props.modelValue && !option.disabled)
  highlightedIndex.value = Math.max(0, index)
}

function close() {
  isOpen.value = false
  opensUp.value = false
}

function toggle() {
  if (isOpen.value) close()
  else open()
}

function selectOption(option: DropdownOption) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  emit('change', option.value)
  close()
}

function moveHighlight(direction: 1 | -1) {
  if (!enabledOptions.value.length) return
  const currentValue = props.options[highlightedIndex.value]?.value
  const enabledIndex = Math.max(
    0,
    enabledOptions.value.findIndex((option) => option.value === currentValue),
  )
  const nextEnabled = enabledOptions.value[(enabledIndex + direction + enabledOptions.value.length) % enabledOptions.value.length]
  highlightedIndex.value = Math.max(0, props.options.findIndex((option) => option.value === nextEnabled?.value))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!isOpen.value) open()
    else moveHighlight(1)
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (!isOpen.value) open()
    else moveHighlight(-1)
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (!isOpen.value) {
      open()
      return
    }
    const option = props.options[highlightedIndex.value]
    if (option) selectOption(option)
  }
  if (event.key === 'Escape') {
    close()
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<template>
  <div ref="root" class="app-dropdown" :class="{ open: isOpen, 'open-up': opensUp }">
    <button
      type="button"
      class="dropdown-trigger"
      :class="{ 'has-icon': selectedOption?.icon }"
      :aria-label="ariaLabel"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span v-if="selectedOption?.icon" class="option-icon" :style="{ '--option-color': selectedOption.color }">
        <img :src="selectedOption.icon" :alt="''" />
      </span>
      <span class="trigger-copy">
        <strong>{{ selectedOption?.label ?? placeholder }}</strong>
        <small v-if="selectedOption?.meta">{{ selectedOption.meta }}</small>
      </span>
      <em v-if="selectedOption?.badge">{{ selectedOption.badge }}</em>
      <i aria-hidden="true"></i>
    </button>

    <div v-if="isOpen" :id="listboxId" class="dropdown-menu" role="listbox">
      <button
        v-for="(option, index) in options"
        :key="option.value"
        type="button"
        role="option"
        class="dropdown-option"
        :class="{ selected: option.value === modelValue, highlighted: index === highlightedIndex, 'has-icon': option.icon }"
        :aria-selected="option.value === modelValue"
        :disabled="option.disabled"
        @mouseenter="highlightedIndex = index"
        @click="selectOption(option)"
      >
        <span v-if="option.icon" class="option-icon" :style="{ '--option-color': option.color }">
          <img :src="option.icon" :alt="''" />
        </span>
        <span>
          <strong>{{ option.label }}</strong>
          <small v-if="option.meta">{{ option.meta }}</small>
        </span>
        <em v-if="option.badge">{{ option.badge }}</em>
      </button>
    </div>
  </div>
</template>

<style scoped>
.app-dropdown {
  position: relative;
  min-width: 0;
}

.dropdown-trigger {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 14px;
  gap: 0.38rem;
  align-items: center;
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.38rem 0.52rem;
  color: var(--color-text);
  background: var(--color-surface-soft);
  text-align: left;
}

.dropdown-trigger.has-icon {
  grid-template-columns: auto minmax(0, 1fr) auto 14px;
}

.dropdown-trigger:hover,
.app-dropdown.open .dropdown-trigger {
  border-color: var(--color-accent);
  background: var(--color-surface-raised);
}

.trigger-copy,
.dropdown-option span {
  display: grid;
  min-width: 0;
  gap: 0.08rem;
}

.option-icon {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--option-color, var(--color-accent)) 48%, var(--color-border));
  border-radius: var(--radius-sm);
  background:
    radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--option-color, var(--color-accent)) 12%, transparent), transparent 62%),
    var(--color-surface);
}

.option-icon img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.trigger-copy strong,
.dropdown-option strong,
.trigger-copy small,
.dropdown-option small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trigger-copy strong,
.dropdown-option strong {
  color: var(--color-text);
  font-size: 0.88rem;
  line-height: 1.08;
}

.trigger-copy small,
.dropdown-option small {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 780;
}

.dropdown-trigger em,
.dropdown-option em {
  border-radius: var(--radius-sm);
  padding: 0.12rem 0.32rem;
  color: var(--color-on-accent);
  background: var(--color-accent);
  font-size: 0.62rem;
  font-style: normal;
  font-weight: 950;
  white-space: nowrap;
}

.dropdown-trigger i {
  width: 10px;
  height: 10px;
  border-right: 2px solid var(--color-accent);
  border-bottom: 2px solid var(--color-accent);
  transform: translateY(-2px) rotate(45deg);
}

.app-dropdown.open .dropdown-trigger i {
  transform: translateY(2px) rotate(225deg);
}

.dropdown-menu {
  position: absolute;
  z-index: 1400;
  top: calc(100% + 0.22rem);
  right: 0;
  left: 0;
  display: grid;
  gap: 0.18rem;
  max-height: min(300px, 52vh);
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.24rem;
  background: var(--color-surface);
}

.app-dropdown.open-up .dropdown-menu {
  top: auto;
  bottom: calc(100% + 0.22rem);
}

.dropdown-menu::-webkit-scrollbar {
  width: 9px;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  border: 2px solid var(--color-surface);
  border-radius: var(--radius-sm);
  background: var(--color-border-strong);
}

.dropdown-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.45rem;
  align-items: center;
  min-height: 38px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.34rem 0.46rem;
  color: var(--color-text);
  background: transparent;
  text-align: left;
}

.dropdown-option.has-icon {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.dropdown-option:hover,
.dropdown-option.highlighted {
  border-color: var(--color-border-strong);
  background: var(--color-surface-soft);
}

.dropdown-option.selected {
  border-color: var(--color-accent);
  background: var(--color-surface-raised);
}

.dropdown-option:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

@media (max-width: 640px) {
  .dropdown-menu {
    max-height: 260px;
  }

  .dropdown-trigger {
    min-height: 38px;
  }
}
</style>
