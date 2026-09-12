/**
 * Renders Reka's `TooltipProvider` around its children, but only when one is
 * not already mounted above.
 *
 * Reka's tooltip context throws without a provider, so a `Tooltip` copied into
 * a project on its own has to bring one. Wrapping unconditionally would defeat
 * a provider someone mounted deliberately: the inner one would win and the
 * delay grouping it exists for would be lost.
 *
 * A component rather than a ternary in the template, because there is no way
 * to say "wrap these nodes, or do not" in a template without writing the
 * subtree out twice. Declared at module scope so its identity never changes -
 * a new one on every render would tear the tooltip down and rebuild it.
 */
import { h, inject } from "vue";
import { TooltipProvider } from "reka-ui";

import { TOOLTIP_PROVIDER_KEY } from "./context.js";

export const MaybeProvider = {
  name: "TooltipMaybeProvider",
  props: { delayDuration: { type: Number, default: 600 } },
  setup(props, { slots }) {
    const hasProvider = inject(TOOLTIP_PROVIDER_KEY, false);
    return () =>
      hasProvider
        ? slots.default?.()
        : h(TooltipProvider, { delayDuration: props.delayDuration }, slots.default);
  },
};
