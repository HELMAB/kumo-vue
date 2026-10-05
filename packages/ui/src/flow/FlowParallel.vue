<!-- Ported from Cloudflare Kumo's Flow.Parallel (MIT). See /NOTICE. -->
<script setup>
/** Branches that run side by side: every branch connects from the step before and into the step after. */
import { ref, toRef } from "vue";
import { useFlow, useGroup } from "./context.js";

const props = defineProps({
  /**
   * `end` aligns each branch to the far edge of the widest one.
   * @values start, end
   */
  align: { type: String, default: undefined },
});

useFlow("FlowParallel");
const el = ref();
const { index } = useGroup("parallel", el, toRef(props, "align"));
</script>

<template>
  <li ref="el" class="kv-flow__parallel" :data-node-index="index">
    <slot />
  </li>
</template>
