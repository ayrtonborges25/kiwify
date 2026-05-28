<script setup lang="ts">
const { toasts, removeToast } = useKiwifyToast()
</script>

<template>
  <div class="kiwify-toast-host" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="kiwify-toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="kiwify-toast-card"
        :class="`kiwify-toast-card--${toast.type}`"
        role="status"
      >
        <span class="kiwify-toast-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M5 10.4l3 3L15.5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <p class="kiwify-toast-message">
          {{ toast.message }}
        </p>
        <button type="button" class="kiwify-toast-close" aria-label="Fechar aviso" @click="removeToast(toast.id)">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.kiwify-toast-host {
  position: fixed;
  top: 12px;
  right: 32px;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.kiwify-toast-card {
  pointer-events: auto;
  width: 536px;
  max-width: calc(100vw - 32px);
  min-height: 80px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 18px 20px 24px;
  color: #111827;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.kiwify-toast-icon {
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  border: 2px solid #10b981;
  border-radius: 9999px;
}

.kiwify-toast-card--error .kiwify-toast-icon {
  color: #ef4444;
  border-color: #ef4444;
}

.kiwify-toast-icon svg,
.kiwify-toast-close svg {
  width: 18px;
  height: 18px;
}

.kiwify-toast-message {
  flex: 1;
  margin: 0;
  color: #111827;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}

.kiwify-toast-close {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #9ca3af;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.kiwify-toast-close:hover {
  color: #6b7280;
}

.kiwify-toast-enter-active,
.kiwify-toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.kiwify-toast-enter-from,
.kiwify-toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

@media (max-width: 640px) {
  .kiwify-toast-host {
    top: 12px;
    right: 12px;
    left: 12px;
  }

  .kiwify-toast-card {
    width: auto;
  }
}
</style>
