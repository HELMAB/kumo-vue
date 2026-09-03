/**
 * The toast queue.
 *
 * Kept out of the components, and out of the DOM, the way `items.js` is: this
 * is a list and some rules about adding to it, so it can be tested directly
 * rather than through a portal that has to be opened first.
 *
 * Timers are deliberately *not* here. Reka's `ToastRoot` already owns the
 * countdown, pauses it while the pointer is over the viewport and resumes it
 * after, so a second timer in the store would only be a second source of
 * truth to keep in step.
 *
 * Ported from Cloudflare Kumo's toast manager (MIT). See /NOTICE.
 */

import { inject, ref } from "vue";

/** Injection key a `Toaster` uses to share its manager with the tree below. */
export const TOAST_MANAGER_KEY = Symbol("kumo-vue-toast-manager");

/** Never auto-dismiss - what a loading toast wants. */
export const NO_TIMEOUT = Number.POSITIVE_INFINITY;

let sequence = 0;

const nextId = () => `kv-toast-${++sequence}`;

/**
 * Create an independent queue.
 *
 * Most applications want the shared `toast` below. Make your own when you need
 * a queue that a test can assert against in isolation, or a second viewport.
 *
 * @param {{ duration?: number }} [options]
 */
export function createToastManager({ duration } = {}) {
  /** Newest first, which is the order the stack is drawn in. */
  const toasts = ref([]);

  const find = (id) => toasts.value.find((toast) => toast.id === id);

  /**
   * Add a toast, and return its id so it can be updated or closed later.
   *
   * Adding one whose id is already showing does not stack a duplicate: the
   * toast already on screen is bumped instead, which is Kumo's answer to the
   * same event firing twice - a retry that keeps failing, say.
   *
   * @param {{
   *   id?: string, title?: string, description?: string, variant?: string,
   *   actions?: object[], duration?: number, data?: unknown,
   * }} [options]
   * @returns {string} the toast's id
   */
  function add(options = {}) {
    const existing = options.id ? find(options.id) : undefined;

    if (existing) {
      Object.assign(existing, options, {
        /* A change of key restarts the attention animation. */
        bump: existing.bump + 1,
        open: true,
      });
      return existing.id;
    }

    const toast = {
      variant: "default",
      title: "",
      description: "",
      actions: undefined,
      duration,
      ...options,
      id: options.id ?? nextId(),
      bump: 0,
      open: true,
    };

    toasts.value = [toast, ...toasts.value];
    return toast.id;
  }

  /**
   * Change a toast that is already showing. Unknown ids are ignored - the
   * toast may have been dismissed while the work behind it was still running.
   *
   * @param {string} id
   * @param {object} patch
   */
  function update(id, patch = {}) {
    const toast = find(id);
    if (toast) Object.assign(toast, patch);
    return Boolean(toast);
  }

  /**
   * Start a toast closing. It stays in the list until the exit transition
   * ends and `remove` is called, so it can animate out.
   *
   * @param {string} id
   */
  function close(id) {
    return update(id, { open: false });
  }

  /** Take a toast out of the list, once it has finished leaving. */
  function remove(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  /** Close every toast at once - on a route change, say. */
  function clear() {
    for (const toast of toasts.value) toast.open = false;
  }

  /**
   * Show a toast that follows a promise: a loading state that cannot time out,
   * replaced in place by the outcome.
   *
   * `success` and `error` may be objects or functions of the resolved value
   * and the rejection, as in Kumo.
   *
   * @template T
   * @param {Promise<T>} promise
   * @param {{ loading: object, success: object | ((value: T) => object), error: object | ((error: unknown) => object) }} states
   * @returns {Promise<T>} the original promise, so callers can still await it
   */
  function promise(promise, states) {
    const id = add({ duration: NO_TIMEOUT, ...states.loading });

    const settle = (state, value) => {
      const next = typeof state === "function" ? state(value) : state;
      /*
       * `duration: undefined` in the patch would leave the loading toast's
       * infinite timeout in place, so the default is restored explicitly.
       */
      update(id, { actions: undefined, duration, ...next });
    };

    return promise.then(
      (value) => {
        settle(states.success, value);
        return value;
      },
      (error) => {
        settle(states.error, error);
        throw error;
      },
    );
  }

  return { toasts, add, update, close, remove, clear, promise };
}

/**
 * The queue every component shares unless told otherwise.
 *
 * It lives at module scope on purpose: a toast is most often raised from
 * somewhere that is not a component - an interceptor, a store action, a
 * timer - and Kumo needs a manager threaded through a provider for that.
 */
export const toast = createToastManager();

/**
 * The manager the nearest `Toaster` is using, or the shared one.
 *
 * Only useful inside `setup`; anywhere else, import `toast` directly.
 */
export function useToast() {
  return inject(TOAST_MANAGER_KEY, toast);
}
