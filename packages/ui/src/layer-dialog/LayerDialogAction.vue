<!-- Ported from Cloudflare Kumo's LayerDialog.Action (MIT). See /NOTICE. -->
<script setup>
/** The single primary action of a `LayerDialog`, placed in its `#action` slot. `menu` adds a split-button menu of related actions. */
import { Button } from "../button/index.js";
import { ButtonGroup } from "../button-group/index.js";
import { Dropdown } from "../dropdown/index.js";

defineOptions({ inheritAttrs: false });

defineProps({
  /**
   * Use `destructive` to confirm something irreversible.
   * @values primary, destructive
   */
  variant: { type: String, default: "primary" },
  /** Shows a spinner and blocks interaction. */
  loading: { type: Boolean, default: false },
  /** Related actions in a split-button menu. Takes Dropdown `items`. */
  menu: { type: Array, default: undefined },
  /** Accessible name of the split-button menu trigger. */
  menuLabel: { type: String, default: "More actions" },
});

const emit = defineEmits(["select"]);
</script>

<template>
  <ButtonGroup v-if="menu?.length" :aria-label="menuLabel">
    <Button v-bind="$attrs" :variant="variant" :loading="loading">
      <slot />
    </Button>
    <Dropdown :items="menu" @select="(...args) => emit('select', ...args)">
      <template #trigger>
        <Button :variant="variant" shape="square" :aria-label="menuLabel">
          <template #icon>
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
            </svg>
          </template>
        </Button>
      </template>
    </Dropdown>
  </ButtonGroup>
  <Button v-else v-bind="$attrs" :variant="variant" :loading="loading">
    <slot />
  </Button>
</template>
