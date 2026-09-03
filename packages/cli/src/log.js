/**
 * Terminal output. Colour is dropped when the stream is not a TTY, when
 * NO_COLOR is set, or on a dumb terminal.
 */

const ESC = "\u001b[";

const useColour =
  Boolean(process.stdout.isTTY) &&
  !process.env.NO_COLOR &&
  process.env.TERM !== "dumb";

const wrap = (code) => (text) =>
  useColour ? `${ESC}${code}m${text}${ESC}0m` : String(text);

export const bold = wrap("1");
export const dim = wrap("2");
export const green = wrap("32");
export const yellow = wrap("33");
export const cyan = wrap("36");

export const log = (message = "") => console.log(message);
export const step = (message) => console.log(`  ${cyan("-")} ${message}`);
export const done = (message) => console.log(`  ${green("+")} ${message}`);
export const warn = (message) => console.log(`  ${yellow("!")} ${message}`);
