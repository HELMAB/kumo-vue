<!-- Ported from Cloudflare Kumo's InputGroup.Button (MIT). See /NOTICE. -->
<script setup>
/**
 * A button that belongs to the group.
 *
 * With no `variant` it is a ghost button *inside* the field - a clear button,
 * a reveal-password toggle. Give it any other variant and it becomes a button
 * *beside* the field, which is what puts the group into its individual or
 * hybrid mode; see `detectFocusMode`.
 */
import { computed } from "vue";

import { Button } from "../button/index.js";
import { useInputGroup } from "./context.js";

defineOptions({ name: "InputGroupButton", inheritAttrs: false });

const props = defineProps({
  /**
   * Button variant. Left unset it is `ghost`, and the button sits inside the
   * field.
   * @values primary, secondary, ghost, destructive, secondary-destructive, outline
   */
  variant: { type: String, default: undefined },
  /** Overrides the size the group would give it. */
  size: { type: String, default: undefined },
  /** @values base, square, circle */
  shape: { type: String, default: "square" },
});

const group = useInputGroup();

const isInline = computed(() => (props.variant ?? "ghost") === "ghost");

/* Kumo runs the inline button a step below the field so it clears the ring. */
const STEP_DOWN = { xs: "xs", sm: "xs", base: "sm", lg: "sm" };

const size = computed(() => {
  if (props.size) return props.size;
  const groupSize = group?.size.value ?? "base";
  return isInline.value ? STEP_DOWN[groupSize] : groupSize;
});

const classes = computed(() => [
  "kv-input-group__button",
  isInline.value ? "kv-input-group__button--inline" : "kv-input-group__button--attached",
]);
</script>

<template>
  <Button
    v-bind="$attrs"
    :class="classes"
    :variant="variant ?? 'ghost'"
    :size="size"
    :shape="shape"
    :disabled="group?.disabled.value || undefined"
    data-kumo-part="button"
  >
    <slot />
  </Button>
</template>
