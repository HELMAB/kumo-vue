// Ported from Cloudflare Kumo's Sidebar (MIT). See /NOTICE.
import { Comment, Fragment, Text, h, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import "./sidebar.css";

export const SIDEBAR = Symbol("kv-sidebar");
export const MENU_ITEM = Symbol("kv-sidebar-menu-item");
export const MENU_SUB_ITEM = Symbol("kv-sidebar-menu-sub-item");
export const COLLAPSE = Symbol("kv-sidebar-collapse");
export const SLIDING = Symbol("kv-sidebar-sliding");

export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Sidebar state and actions for anything inside a `SidebarProvider`. */
export function useSidebar() {
  const sidebar = inject(SIDEBAR, null);
  if (!sidebar) throw new Error("useSidebar must be used within a SidebarProvider.");
  return sidebar;
}

export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** True below `breakpoint` pixels; false on the server and until mounted. */
export function useIsMobile(breakpoint) {
  const isMobile = ref(false);
  let query;
  const sync = () => (isMobile.value = query?.matches ?? false);
  const listen = () => {
    query?.removeEventListener("change", sync);
    query = window.matchMedia?.(`(max-width: ${breakpoint() - 1}px)`);
    query?.addEventListener("change", sync);
    sync();
  };
  onMounted(listen);
  watch(breakpoint, () => typeof window !== "undefined" && listen());
  onBeforeUnmount(() => query?.removeEventListener("change", sync));
  return isMobile;
}

/** Calls `onComplete(open)` once a transition settles: from `complete()` on transitionend, or after the duration as a fallback. */
export function useOpenChangeComplete(open, duration, onComplete, active = () => true) {
  let pending;
  let timer;
  const complete = () => {
    if (pending === undefined) return;
    const value = pending;
    pending = undefined;
    clearTimeout(timer);
    onComplete(value);
  };
  watch([open, active], ([isOpen, isActive], [wasOpen, wasActive]) => {
    clearTimeout(timer);
    if (!isActive) {
      pending = undefined;
      return;
    }
    if (!wasActive || isOpen === wasOpen) return;
    pending = isOpen;
    if (duration() === 0 || prefersReducedMotion()) complete();
    else timer = setTimeout(complete, duration() + 50);
  });
  onBeforeUnmount(() => clearTimeout(timer));
  return complete;
}

export const flatten = (nodes) =>
  nodes.flatMap((node) => (node.type === Fragment ? flatten(node.children ?? []) : node.type === Comment ? [] : [node]));

/** Slot content with bare text wrapped in a truncating span, as Kumo wraps string children. */
export const LabelNodes = (_, { slots }) =>
  flatten(slots.default?.() ?? []).map((node) => (node.type === Text ? h("span", { class: "kv-sidebar__truncate" }, node.children) : node));

export const Passthrough = (_, { slots }) => slots.default?.();
