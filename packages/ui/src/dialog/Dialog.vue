<!-- Ported from Cloudflare Kumo's Dialog (MIT). See /NOTICE. -->
<script setup>
/**
 * Dialog - a window over the page, with everything behind it inert.
 *
 *   <Dialog title="Modal title" description="What this is about.">
 *     <template #trigger><Button>Open</Button></template>
 *     <p>Body copy.</p>
 *     <template #footer="{ close }">
 *       <Button variant="secondary" @click="close">Cancel</Button>
 *     </template>
 *   </Dialog>
 *
 * Or controlled, with no trigger of its own:
 *
 *   <Dialog v-model:open="confirming" role="alertdialog" disable-pointer-dismissal>
 *
 * Built on Reka UI's Dialog primitive, the counterpart to the Base UI one Kumo
 * builds on: it owns the portal, the focus trap, the scroll lock, the escape
 * key, and the `aria-labelledby` / `aria-describedby` wiring.
 *
 * Kumo composes this from five parts - `Dialog.Root`, `Dialog.Trigger`,
 * `Dialog`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close`. Here it is
 * one component with slots, the same flattening every other component in this
 * library makes; `close` is handed to the slots that need it rather than being
 * a component you wrap a button in.
 */
import { computed, onMounted, ref, useSlots, watch } from "vue";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "reka-ui";

import { Button } from "../button/index.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** Controlled open state. Leave unset to let the component manage it. */
  open: { type: Boolean, default: undefined },
  /** Open state on first render, for the uncontrolled case. */
  defaultOpen: { type: Boolean, default: false },
  /** The heading that names the dialog. Use the `title` slot for markup. */
  title: { type: String, default: "" },
  /** A line of context below the title. Use the `description` slot for markup. */
  description: { type: String, default: "" },
  /**
   * Width on desktop. Content wider than this scrolls inside the dialog
   * rather than stretching it.
   * @values sm, base, lg, xl
   */
  size: { type: String, default: "base" },
  /**
   * `alertdialog` is for destructive actions, confirmations and critical
   * warnings - anything needing an explicit acknowledgement.
   * @values dialog, alertdialog
   */
  role: { type: String, default: "dialog" },
  /** Keep a click outside from closing the dialog. Escape still closes it. */
  disablePointerDismissal: { type: Boolean, default: false },
  /**
   * Writing direction. Leave unset and the dialog follows the direction where
   * it was written, which is not what it would inherit from the portal.
   * @values ltr, rtl
   */
  dir: { type: String, default: undefined },
  /** Where the dialog is portalled to. */
  to: { type: [String, Object], default: "body" },
  /** Renders the close control in the corner. */
  closable: { type: Boolean, default: true },
  /** Accessible name for that control. */
  closeLabel: { type: String, default: "Close" },
});

const emit = defineEmits(["update:open"]);

const slots = useSlots();

const hasTitle = computed(() => Boolean(props.title || slots.title));
const hasDescription = computed(() => Boolean(props.description || slots.description));

const classes = computed(() => ["kv-dialog", `kv-dialog--size-${props.size}`]);

/* Kumo drops the close control a size on its smallest dialog. */
const closeSize = computed(() => (props.size === "sm" ? "sm" : "base"));

/*
 * A portalled dialog hangs off the body, so a writing direction set on part of
 * the page - a form, a panel, anything short of the document - never reaches
 * it, and an RTL dialog comes out the wrong way round. The direction is read
 * from the trigger, where the dialog was written, and carried across.
 */
const triggerRef = ref();
const resolvedDir = ref(props.dir);

function readDir() {
  if (props.dir) {
    resolvedDir.value = props.dir;
    return;
  }

  const anchor = triggerRef.value?.$el;
  if (!anchor?.closest) return;

  /*
   * The nearest `dir` attribute answers first - it is how HTML says to set
   * direction, and it survives environments with no cascade to compute. A CSS
   * `direction`, or a `dir="auto"` only the browser can resolve, falls through
   * to the computed value. With no trigger to read, nothing is written and the
   * portal's own inherited direction stands.
   */
  const declared = anchor.closest("[dir]")?.getAttribute("dir");
  resolvedDir.value =
    declared === "rtl" || declared === "ltr" ? declared : getComputedStyle(anchor).direction;
}

onMounted(readDir);
watch(() => props.dir, readDir);

/**
 * Reka points `aria-describedby` at its description id whether or not a
 * description was rendered, leaving a dangling reference on a dialog without
 * one. A `null` passed through overrides that binding and drops the attribute.
 * It has to be absent from the object rather than `undefined` in it: Vue's
 * attribute merge takes the later value either way, so an `undefined` here
 * would erase the id in the case that has one.
 */
const describedByAttrs = computed(() =>
  hasDescription.value ? {} : { "aria-describedby": null },
);

/*
 * Reka's Dialog is controlled through `open` alone, so the state lives here:
 * a controlled `open` prop wins, and without one the dialog keeps its own.
 * That is what lets `close` work in both cases - a slot needs to close the
 * dialog whether or not the page is tracking it.
 */
const uncontrolledOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? uncontrolledOpen.value);

/* Re-read on the way open: the page around the trigger may have turned since. */
watch(isOpen, (open) => open && readDir());

const setOpen = (value) => {
  uncontrolledOpen.value = value;
  emit("update:open", value);
};

const close = () => setOpen(false);

/*
 * `interactOutside` is the umbrella event: a pointer down outside and a focus
 * moving outside both arrive here, and preventing it leaves the dialog open.
 */
const onInteractOutside = (event) => {
  if (props.disablePointerDismissal) event.preventDefault();
};
</script>

<template>
  <DialogRoot
    :open="isOpen"
    @update:open="setOpen"
  >
    <DialogTrigger v-if="$slots.trigger" ref="triggerRef" as-child>
      <slot name="trigger" />
    </DialogTrigger>

    <DialogPortal :to="to">
      <DialogOverlay class="kv-dialog__backdrop" data-kumo-part="backdrop" />

      <DialogContent
        v-bind="{ ...describedByAttrs, ...$attrs }"
        :class="classes"
        data-kumo-component="Dialog"
        :role="role"
        :dir="resolvedDir"
        @interact-outside="onInteractOutside"
      >
        <div v-if="hasTitle || closable" class="kv-dialog__header">
          <DialogTitle v-if="hasTitle" class="kv-dialog__title">
            <slot name="title">{{ title }}</slot>
          </DialogTitle>

          <DialogClose v-if="closable" as-child>
            <Button
              class="kv-dialog__close"
              variant="secondary"
              shape="square"
              :size="closeSize"
              :aria-label="closeLabel"
            >
              <template #icon>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <path d="m4 4 8 8M12 4l-8 8" stroke-linecap="round" />
                </svg>
              </template>
            </Button>
          </DialogClose>
        </div>

        <!--
          The scrolling region. The header and the footer sit outside it, so a
          dialog taller than the screen never carries its own title, its close
          control or its actions off the top and bottom with the content.
        -->
        <div v-if="hasDescription || $slots.default" class="kv-dialog__scroll">
          <DialogDescription v-if="hasDescription" class="kv-dialog__description">
            <slot name="description">{{ description }}</slot>
          </DialogDescription>

          <div v-if="$slots.default" class="kv-dialog__body">
            <slot :close="close" />
          </div>
        </div>

        <div v-if="$slots.footer" class="kv-dialog__footer">
          <slot name="footer" :close="close" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
.kv-dialog__backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  /* Kumo's scrim is the recessed surface at 80%, so it lightens in light mode. */
  background-color: color-mix(in oklch, var(--kv-surface-recessed) 80%, transparent);
  animation: kv-dialog-backdrop-in 150ms ease;
}

.kv-dialog__backdrop[data-state="closed"] {
  animation: kv-dialog-backdrop-out 120ms ease;
}

.kv-dialog {
  --kv-dialog-width: 24rem;
  --kv-dialog-inset: var(--kv-space-8);
  --kv-dialog-padding: var(--kv-space-6);
  --kv-dialog-gap: var(--kv-space-4);

  /*
   * Anchored near the top, not centred: Kumo's panel is `top-8 sm:top-16`, so
   * a dialog opens where the eye already is and does not jump down the screen
   * as it grows. Centring is horizontal only.
   *
   * That centring is `inset-inline` plus `margin-inline: auto` rather than
   * Kumo's `left-1/2 -translate-x-1/2`, which is physical: in RTL the inline
   * start is the right edge, and the translate would then pull the panel a
   * whole width off-centre.
   */
  position: fixed;
  z-index: 51;
  inset-block-start: var(--kv-dialog-inset);
  inset-inline: 0;
  margin-inline: var(--kv-space-4);

  /*
   * Kumo's panel is `overflow-hidden` with no height cap, so a long dialog
   * runs off the bottom of a locked page with no way to reach the end of it.
   * Capping at the viewport and scrolling is the one behavioural change here.
   *
   * The panel itself still clips, in both axes, as Kumo's does: the scrolling
   * happens in the region between the header and the footer, and wide content
   * scrolls in a container of its own, as it does in Kumo's own examples.
   */
  max-block-size: calc(100dvh - var(--kv-dialog-inset) - var(--kv-space-4));
  overflow: hidden;

  display: flex;
  flex-direction: column;
  gap: var(--kv-dialog-gap);
  padding: var(--kv-dialog-padding);

  /* The width is the panel's, padding included, as it is under Tailwind's
     preflight - which this library does not assume is present. */
  box-sizing: border-box;

  background-color: var(--kv-surface-base);
  color: var(--kv-text-default);
  border-radius: var(--kv-radius-xl);
  box-shadow:
    0 0 0 1px var(--kv-line),
    0 20px 25px -5px var(--kv-shadow-elevated),
    0 8px 10px -6px var(--kv-shadow-elevated);
  font-family: var(--kv-font-sans);
  outline: none;

  animation: kv-dialog-in 150ms ease;
}

/*
 * Below Kumo's `sm` breakpoint the dialog is the width of the screen less a
 * margin; above it, `size` takes over and it is a fixed width - not a maximum,
 * so content wider than the dialog scrolls inside it rather than stretching it.
 */
@media (min-width: 40rem) {
  .kv-dialog {
    --kv-dialog-inset: var(--kv-space-16);

    inline-size: var(--kv-dialog-width);
    max-inline-size: calc(100vw - 2 * var(--kv-space-4));
    margin-inline: auto;
  }
}

.kv-dialog[data-state="closed"] {
  animation: kv-dialog-out 120ms ease;
}

/* The smallest dialog tightens its padding and gap, as Kumo's does. */
.kv-dialog--size-sm {
  --kv-dialog-width: 18rem;
  --kv-dialog-padding: var(--kv-space-4);
  --kv-dialog-gap: var(--kv-space-2);
}

.kv-dialog--size-base { --kv-dialog-width: 24rem; }
.kv-dialog--size-lg { --kv-dialog-width: 32rem; }
.kv-dialog--size-xl { --kv-dialog-width: 48rem; }

.kv-dialog__header {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--kv-space-4);
}

/*
 * `min-block-size: 0` is what lets this shrink below its content: a flex item
 * defaults to its content size, and without it the region would push the panel
 * past its cap instead of scrolling.
 */
.kv-dialog__scroll {
  display: flex;
  flex-direction: column;
  gap: var(--kv-dialog-gap);
  min-block-size: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.kv-dialog__title {
  margin: 0;
  font-size: var(--kv-text-xl);
  font-weight: 600;
  line-height: var(--kv-leading-tight);
  color: var(--kv-text-strong);
}

/* The close control sits against the panel edge, not the title's baseline. */
.kv-dialog__close {
  margin-inline-start: auto;
  flex-shrink: 0;
}

.kv-dialog__description {
  margin: 0;
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-relaxed);
  color: var(--kv-text-subtle);
}

.kv-dialog__body {
  min-inline-size: 0;
  font-size: var(--kv-text-base);
  line-height: var(--kv-leading-relaxed);
}

.kv-dialog__footer {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  gap: var(--kv-space-2);
  margin-block-start: var(--kv-space-2);
}

@keyframes kv-dialog-backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes kv-dialog-backdrop-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes kv-dialog-in {
  from { opacity: 0; scale: 0.9; }
  to { opacity: 1; scale: 1; }
}

@keyframes kv-dialog-out {
  from { opacity: 1; scale: 1; }
  to { opacity: 0; scale: 0.9; }
}

@media (prefers-reduced-motion: reduce) {
  .kv-dialog,
  .kv-dialog[data-state="closed"],
  .kv-dialog__backdrop,
  .kv-dialog__backdrop[data-state="closed"] {
    animation: none;
  }
}
</style>
