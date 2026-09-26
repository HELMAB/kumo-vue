// Ported from Cloudflare Kumo's Toolbar (MIT). See /NOTICE.
export const TOOLBAR = Symbol("kv-toolbar");
export const TOOLBAR_INPUT_GROUP = Symbol("kv-toolbar-input-group");
export const TOOLBAR_ITEM = "data-kv-toolbar-item";

/** Whether a key pressed in a text field belongs to the caret, as Base UI's toolbar decides. */
export function keepsCaret(event, forward, backward) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.disabled) return false;
  const { selectionStart: start, selectionEnd: end, value } = input;
  return (
    start == null ||
    event.shiftKey ||
    start !== end ||
    (event.key !== backward && start < value.length) ||
    (event.key !== forward && start > 0)
  );
}
