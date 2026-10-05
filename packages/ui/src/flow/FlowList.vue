<!-- Ported from Cloudflare Kumo's Flow.List (MIT). See /NOTICE. -->
<script setup>
/** A sequence of connected nodes, for a branch of `FlowParallel` that runs through several steps. */
import { ref } from "vue";
import { useFlow, useGroup } from "./context.js";

const flow = useFlow("FlowList");
const el = ref();
const { group, isRoot } = useGroup("list", el);
if (isRoot) flow.setRoot(group);
</script>

<template>
  <ul ref="el" class="kv-flow__list" :class="{ 'kv-flow__list--vertical': flow.orientation.value === 'vertical' }">
    <slot />
  </ul>
</template>
