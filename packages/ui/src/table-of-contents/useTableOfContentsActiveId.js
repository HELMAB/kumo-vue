// Ported from Cloudflare Kumo's useTableOfContentsActiveId (MIT). See /NOTICE.
import { onMounted, onUnmounted, ref, toValue, watch } from "vue";

const SCROLL_SETTLE_MS = 150;

/**
 * Tracks the topmost section in view. `selectSection` pins one after a click
 * until scrolling settles. `ids`, `offset` and `root` may be refs or getters.
 */
export function useTableOfContentsActiveId({ ids, offset = 0, root = null, trackHash = true }) {
  const activeId = ref(null);
  const mounted = ref(false);
  let pinned = false;
  let settleTimer;
  let cancelPendingUnpin = null;

  const idList = () => [...(toValue(ids) ?? [])];

  function selectSection(id) {
    cancelPendingUnpin?.();
    pinned = true;
    activeId.value = id;

    const target = toValue(root) ?? window;
    const arm = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        cancelPendingUnpin?.();
        pinned = false;
      }, SCROLL_SETTLE_MS);
    };

    target.addEventListener("scroll", arm, { passive: true });
    cancelPendingUnpin = () => {
      clearTimeout(settleTimer);
      target.removeEventListener("scroll", arm);
      cancelPendingUnpin = null;
    };
    arm();
  }

  watch(
    () => mounted.value && [idList().join("\0"), toValue(offset), toValue(root)],
    (deps, _, onCleanup) => {
      if (!deps) return;
      const elements = idList()
        .map((id) => document.getElementById(id))
        .filter(Boolean);
      if (elements.length === 0) return;

      const intersecting = new Set();
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) intersecting.add(entry.target);
            else intersecting.delete(entry.target);
          }
          const first = elements.find((el) => intersecting.has(el));
          if (first && !pinned) activeId.value = first.id;
        },
        { root: toValue(root) ?? null, rootMargin: `-${toValue(offset)}px 0px 0px 0px` },
      );
      for (const el of elements) observer.observe(el);
      onCleanup(() => observer.disconnect());
    },
    { immediate: true },
  );

  watch(
    () => mounted.value && toValue(trackHash) && idList().join("\0"),
    (key, _, onCleanup) => {
      if (!key) return;
      const known = new Set(key.split("\0"));
      const sync = () => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (id && known.has(id)) selectSection(id);
      };
      sync();
      window.addEventListener("hashchange", sync);
      onCleanup(() => window.removeEventListener("hashchange", sync));
    },
    { immediate: true },
  );

  onMounted(() => (mounted.value = true));
  onUnmounted(() => cancelPendingUnpin?.());

  return { activeId, selectSection };
}
