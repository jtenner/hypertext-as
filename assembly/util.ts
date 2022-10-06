import { EqualsRule } from "byte-parse-as/assembly";

// ":"
export const COLON = new EqualsRule(0x3A);

// "["
export const OPEN_BRACKET = new EqualsRule(0x5B);
// "]"
export const CLOSE_BRACKET = new EqualsRule(0x5D);

// "1"
export const ONE = new EqualsRule(0x01);
// "2"
export const TWO = new EqualsRule(0x32);
// "5"
export const FIVE = new EqualsRule(0x35);

// "."
export const DOT = new EqualsRule(0x2E);

// "/"
export const SLASH = new EqualsRule(0x2F);

// "?"
export const QUESTION = new EqualsRule(0x3F);

// "#"
export const HASH = new EqualsRule(0x23);
