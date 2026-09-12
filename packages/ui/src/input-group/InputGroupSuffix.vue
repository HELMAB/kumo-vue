<!-- Ported from Cloudflare Kumo's InputGroup.Suffix (MIT). See /NOTICE. -->
<script setup>
/**
 * Static text that reads as part of the value - `.workers.dev` after a
 * subdomain. The input shrinks to what has been typed so the suffix sits
 * against it rather than at the far end of the field.
 */
defineOptions({ name: "InputGroupSuffix" });
</script>

<template>
  <div class="kv-input-group__suffix" data-kumo-part="suffix">
    <span class="kv-input-group__suffix-text"><slot /></span>
  </div>
</template>
