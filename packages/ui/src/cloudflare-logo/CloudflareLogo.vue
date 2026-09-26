<!-- Ported from Cloudflare Kumo's CloudflareLogo (MIT). See /NOTICE. -->
<script setup>
/** The Cloudflare logo, as the cloud glyph alone or with the wordmark below it. */
import { computed } from "vue";
import {
  CLOUDFLARE_ORANGE,
  CLOUDFLARE_YELLOW,
  FULL_LOGO_ORANGE_PATH,
  FULL_LOGO_VIEWBOX,
  FULL_LOGO_YELLOW_PATH,
  GLYPH_ORANGE_PATH,
  GLYPH_VIEWBOX,
  GLYPH_YELLOW_PATH,
  WORDMARK_PATHS,
} from "./logo.js";

const props = defineProps({
  /**
   * `glyph` is the cloud alone; `full` adds the wordmark below it.
   * @values glyph, full
   */
  variant: { type: String, default: "full" },
  /**
   * `color` is the brand orange and yellow; `black` and `white` are solid.
   * @values color, black, white
   */
  color: { type: String, default: "color" },
});

const isGlyph = computed(() => props.variant === "glyph");
const fillOrange = computed(() => (props.color === "color" ? CLOUDFLARE_ORANGE : "currentColor"));
const fillYellow = computed(() => (props.color === "color" ? CLOUDFLARE_YELLOW : "currentColor"));

const classes = computed(() => [
  "kv-cloudflare-logo",
  { "kv-cloudflare-logo--wordmark": !isGlyph.value && props.color === "color" },
  props.color !== "color" && `kv-cloudflare-logo--${props.color}`,
]);
</script>

<template>
  <svg
    :viewBox="isGlyph ? GLYPH_VIEWBOX : FULL_LOGO_VIEWBOX"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Cloudflare logo"
    :class="classes"
  >
    <template v-if="isGlyph">
      <path :d="GLYPH_ORANGE_PATH" :fill="fillOrange" />
      <path :d="GLYPH_YELLOW_PATH" :fill="fillYellow" />
    </template>
    <template v-else>
      <path :d="FULL_LOGO_ORANGE_PATH" :fill="fillOrange" />
      <path :d="FULL_LOGO_YELLOW_PATH" :fill="fillYellow" />
      <path v-for="(d, i) in WORDMARK_PATHS" :key="i" :d="d" fill="currentColor" />
    </template>
  </svg>
</template>

<style>
.kv-cloudflare-logo--wordmark {
  color: var(--kv-text-default);
}

.kv-cloudflare-logo--white {
  color: #fff;
}

.kv-cloudflare-logo--black {
  color: #000;
}
</style>
