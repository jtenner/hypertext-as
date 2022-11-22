import { EqualsRule, Rule } from "byte-parse-as/assembly";

export class UtilParsers {
  constructor() {}

  // ":"
  public COLON: Rule = new EqualsRule(0x3A);

  // "["
  public OPEN_BRACKET: Rule = new EqualsRule(0x5B);
  // "]"
  public CLOSE_BRACKET: Rule = new EqualsRule(0x5D);

  // "1"
  public ONE: Rule = new EqualsRule(0x01);
  // "2"
  public TWO: Rule = new EqualsRule(0x32);
  // "5"
  public FIVE: Rule = new EqualsRule(0x35);

  // "."
  public DOT: Rule = new EqualsRule(0x2E);

  // "/"
  public SLASH: Rule = new EqualsRule(0x2F);

  // "?"
  public QUESTION: Rule = new EqualsRule(0x3F);

  // "#"
  public HASH: Rule = new EqualsRule(0x23);

  // "*"
  public ASTERISK: Rule = new EqualsRule(0x2A);
}

