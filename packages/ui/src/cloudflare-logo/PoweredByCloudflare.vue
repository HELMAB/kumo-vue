<!-- Ported from Cloudflare Kumo's PoweredByCloudflare (MIT). See /NOTICE. -->
<script setup>
/** A "Powered by Cloudflare" badge linking to cloudflare.com in a new tab. */
import CloudflareLogo from "./CloudflareLogo.vue";

defineProps({
  /**
   * Colour scheme for the badge and its glyph.
   * @values color, black, white
   */
  color: { type: String, default: "color" },
  /** Where the badge links to. */
  href: { type: String, default: "https://www.cloudflare.com" },
});
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    :class="['kv-powered-by-cloudflare', `kv-powered-by-cloudflare--${color}`]"
  >
    <CloudflareLogo variant="glyph" :color="color" class="kv-powered-by-cloudflare__glyph" />
    <span>Powered by <span class="kv-powered-by-cloudflare__name">Cloudflare</span></span>
  </a>
</template>

<style>
.kv-powered-by-cloudflare {
  display: inline-flex;
  align-items: center;
  gap: var(--kv-space-2);
  padding-block: var(--kv-space-2);
  padding-inline: var(--kv-space-2-5) var(--kv-space-3);
  border-radius: var(--kv-radius-lg);
  font-size: var(--kv-text-sm);
  font-weight: 500;
  line-height: calc(1 / 0.85);
  text-decoration: none;
  box-shadow: inset 0 0 0 1px var(--kv-powered-by-ring);
  transition: all 100ms cubic-bezier(0.4, 0, 0.2, 1);
}

.kv-powered-by-cloudflare:hover {
  box-shadow:
    inset 0 0 0 1px var(--kv-powered-by-ring),
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.kv-powered-by-cloudflare--color {
  --kv-powered-by-ring: var(--kv-hairline);
  background-color: var(--kv-surface-base);
  color: var(--kv-text-default);
}

.kv-powered-by-cloudflare--black {
  --kv-powered-by-ring: rgb(0 0 0 / 0.2);
  background-color: #fff;
  color: #000;
}

.kv-powered-by-cloudflare--white {
  --kv-powered-by-ring: rgb(255 255 255 / 0.2);
  background-color: #000;
  color: #fff;
}

.kv-powered-by-cloudflare__glyph {
  block-size: 1rem;
  inline-size: auto;
}

.kv-powered-by-cloudflare__name {
  font-weight: 600;
}
</style>
