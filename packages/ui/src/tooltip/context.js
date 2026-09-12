/**
 * A flag saying that a `TooltipProvider` is already above us.
 *
 * Reka's tooltip needs a provider, and its context throws when there is none -
 * which would make a `Tooltip` copied into a project fail until its user
 * discovered a second component they had to install and mount. So `Tooltip`
 * brings its own provider when it cannot find one, and `TooltipProvider` sets
 * this so it does not get double-wrapped when someone does mount one to group
 * the delays.
 */
export const TOOLTIP_PROVIDER_KEY = Symbol("kv-tooltip-provider");
