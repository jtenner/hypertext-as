import { AnyOfRule, AnyRule, BetweenInclusiveRule, ByteSink, EqualsRule, EveryRule, ManyRule, OptionalRule, Range } from "byte-parse-as/assembly";

// ALPHA          =  %x41-5A / %x61-7A   ; A-Z / a-z
export const ALPHA = new AnyRule([
  new BetweenInclusiveRule(0x41, 0x5A),
  new BetweenInclusiveRule(0x61, 0x7A),
]);

// CHAR           =  %x01-7F
export const CHAR = new BetweenInclusiveRule(0x01, 0x7F);

// CR             =  %x0D
export const CR = new EqualsRule(0x0D);

//          LF             =  %x0A
export const LF = new EqualsRule(0x0A);

// CR LF
export const CRLF = new EveryRule([CR, LF]);

// CTL            =  %x00-1F / %x7F
export const CTL = new AnyRule([
  new BetweenInclusiveRule(0x00, 0x1F),
  new EqualsRule(0x7F),
]);

// DIGIT          =  %x30-39
export const DIGIT = new BetweenInclusiveRule(0x30, 0x39);

// DQUOTE         =  %x22
export const DQUOTE = new EqualsRule(0x22);

// HEXDIG         =  DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
export const HEXDIG = new AnyRule([
  DIGIT,
  new AnyOfRule("ABCDEF"),
]);

// HTAB           =  %x09
export const HTAB = new EqualsRule(0x09);

// SP             =  %x20
export const SP = new EqualsRule(0x20);

// WSP            =  SP / HTAB
export const WSP = new AnyRule([SP, HTAB]);

// LWSP           =  *(WSP / CRLF WSP)
export const LWSP = new OptionalRule(
  new ManyRule(
    new AnyRule([
      WSP,
      new EveryRule([CRLF, WSP]),
    ]),
  ),
);

// OCTET          =  %x00-FF
export const OCTET = new BetweenInclusiveRule(0x00, 0xFF);

// VCHAR          =  %x21-7E
export const VCHAR = new BetweenInclusiveRule(0x21, 0x7E);
