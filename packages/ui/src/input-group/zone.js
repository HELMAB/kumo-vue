/**
 * Renders an already-created list of vnodes.
 *
 * InputGroup's hybrid mode has to split its children into two wrappers, and a
 * template has no way to say "render these vnodes here". An inline arrow in
 * `:is` would do it, but a new function identity on every render makes Vue tear
 * the subtree down and build it again - which for an input means losing focus,
 * the caret position and the selection on every keystroke.
 *
 * Declared once, at module scope, so the identity never changes.
 */
export const Zone = {
  name: "InputGroupZone",
  props: { nodes: { type: Array, default: () => [] } },
  setup: (props) => () => props.nodes,
};
