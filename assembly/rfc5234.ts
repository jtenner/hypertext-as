import { AnyOfRule, AnyRule, BetweenInclusiveRule, EqualsRule, EveryRule, ManyRule, OptionalRule, Rule } from "byte-parse-as/assembly";
import { UtilParsers } from "./util";

export class RFC5234 extends UtilParsers {
  constructor() {
    super();
    // ALPHA          =  %x41-5A / %x61-7A   ; A-Z / a-z
    this.ALPHA = new AnyRule([
      new BetweenInclusiveRule(0x41, 0x5A),
      new BetweenInclusiveRule(0x61, 0x7A),
    ]);

    // CHAR           =  %x01-7F
    this.CHAR = new BetweenInclusiveRule(0x01, 0x7F);

    // CR             =  %x0D
    this.CR = new EqualsRule(0x0D);
    // LF             =  %x0A
    this.LF = new EqualsRule(0x0A);

    // CR LF
    this.CRLF = new EveryRule([this.CR, this.LF]);

    // CTL            =  %x00-1F / %x7F
    this.CTL = new AnyRule([
      new BetweenInclusiveRule(0x00, 0x1F),
      new EqualsRule(0x7F),
    ]);

    // DIGIT          =  %x30-39
    this.DIGIT = new BetweenInclusiveRule(0x30, 0x39);

    // DQUOTE         =  %x22
    this.DQUOTE = new EqualsRule(0x22);

    // HEXDIG         =  DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
    this.HEXDIG = new AnyRule([
      this.DIGIT,
      new AnyOfRule("ABCDEF"),
    ]);

    // HTAB           =  %x09
    this.HTAB = new EqualsRule(0x09);

    // SP             =  %x20
    this.SP = new EqualsRule(0x20);

    // WSP            =  SP / HTAB
    this.WSP = new AnyRule([this.SP, this.HTAB]);

    // LWSP           =  *(WSP / CRLF WSP)
    this.LWSP = new OptionalRule(
      new ManyRule(
        new AnyRule([
          this.WSP,
          new EveryRule([this.CRLF, this.WSP]),
        ]),
      ),
    );

    // OCTET          =  %x00-FF
    this.OCTET = new BetweenInclusiveRule(0x00, 0xFF);

    // VCHAR          =  %x21-7E
    this.VCHAR = new BetweenInclusiveRule(0x21, 0x7E);
  }

  
  public ALPHA: Rule; 
  
  public CHAR: Rule;

  
  public CR: Rule;

  
  public LF: Rule;

  
  public CRLF: Rule;


  public CTL: Rule;

  // DIGIT          =  %x30-39
  public DIGIT: Rule;

  // DQUOTE         =  %x22
  public DQUOTE: Rule;

  // HEXDIG         =  DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
  public HEXDIG: Rule;

  // HTAB           =  %x09
  public HTAB: Rule;

  // SP             =  %x20
  public SP: Rule;

  // WSP            =  SP / HTAB
  public WSP: Rule;

  // LWSP           =  *(WSP / CRLF WSP)
  public LWSP: Rule;

  // OCTET          =  %x00-FF
  public OCTET: Rule;

  // VCHAR          =  %x21-7E
  public VCHAR: Rule;
}
