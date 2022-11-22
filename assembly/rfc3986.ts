import { AnyOfRule, AnyRule, BetweenInclusiveRule, ByteSink, CountRule, EqualsRule, EveryRule, KeywordRule, ManyRule, OptionalRule, Range, EMPTY, Rule } from "byte-parse-as/assembly";
import { RFC5234 } from "./rfc5234";

export class URIParser {
  constructor() {
    let parent = this.parent = new RFC5234()

    let PORT = this.PORT = new ManyRule(parent.DIGIT);

    // sub-delims    = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
    let SUB_DELIMS = this.SUB_DELIMS = new AnyOfRule("!$&'()*+,;=");

    // pct-encoded   = "%" HEXDIG HEXDIG
    let PCT_ENCODED = this.PCT_ENCODED = new EveryRule([new EqualsRule(0x25), parent.HEXDIG, parent.HEXDIG]);

    // UNRESERVED    = ALPHA / DIGIT / "-" / "." / "_" / "~"
    let UNRESERVED = this.UNRESERVED = new AnyRule([parent.ALPHA, parent.DIGIT, new AnyOfRule("-._~")]);

    /** reg-name    = *( unreserved / pct-encoded / sub-delims ) */
    let REG_NAME = this.REG_NAME = new OptionalRule(new ManyRule(new AnyRule([UNRESERVED, PCT_ENCODED, SUB_DELIMS])));

    /**
     * dec-octet     = DIGIT                 ; 0-9
     *               / %x31-39 DIGIT         ; 10-99
     *               / "1" 2DIGIT            ; 100-199
     *               / "2" %x30-34 DIGIT     ; 200-249
     *               / "25" %x30-35          ; 250-255
     */
    let DEC_OCTET = this.DEC_OCTET = new AnyRule([
      // "25" %x30-35          ; 250-255
      new EveryRule([parent.TWO, parent.FIVE, new BetweenInclusiveRule(0x30, 0x35)]),
      // "2" %x30-34 DIGIT     ; 200-249
      new EveryRule([parent.TWO, new BetweenInclusiveRule(0x30, 0x34), parent.DIGIT]),
      // "1" 2DIGIT            ; 100-199
      new EveryRule([parent.ONE, new CountRule(parent.DIGIT, 2)]),
      // %x31-39 DIGIT         ; 10-99
      new EveryRule([new BetweenInclusiveRule(0x31, 0x39), parent.DIGIT]),
      // DIGIT                 ; 0-9
      parent.DIGIT
    ]);

    // IPv4address   = dec-octet "." dec-octet "." dec-octet "." dec-octet
    let IPV4_ADDRESS = this.IPV4_ADDRESS = new EveryRule([
      DEC_OCTET,
      parent.DOT,
      DEC_OCTET,
      parent.DOT,
      DEC_OCTET,
      parent.DOT,
      DEC_OCTET,
    ]);

    // 4 HEXDIG
    let H16 = this.H16 = new CountRule(parent.HEXDIG, 4);

    // LS32 = ( h16 ":" h16 ) / IPv4address
    let LS32 = this.LS32 = new AnyRule([
      new EveryRule([H16, parent.COLON, H16]),
      IPV4_ADDRESS,
    ]);

    /** 6( h16 ":" ) ls32 */
    let IPV6_ADDRESS_1 = this.IPV6_ADDRESS_1 = new EveryRule([
      new CountRule(new EveryRule([
        H16,
        parent.COLON,
      ]), 6),
      LS32,
    ]);

    /** "::" 5( h16 ":" ) ls32 */
    let IPV6_ADDRESS_2 = this.IPV6_ADDRESS_2 = new EveryRule([
      new CountRule(parent.COLON, 2),
      new CountRule(new EveryRule([H16, parent.COLON]), 5),
      LS32,
    ]);

    /** [               h16 ] "::" 4( h16 ":" ) ls32 */
    let IPV6_ADDRESS_3 = this.IPV6_ADDRESS_3 = new EveryRule([
      new OptionalRule(H16),
      new CountRule(parent.COLON, 2),
      new CountRule(new EveryRule([H16, parent.COLON]), 4),
      LS32,
    ]);

    /**
     * [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
     *
     * However, it should be parsed using the grammar differently like this:
     *
     * [ h16 *1( ":" h16 ) ] "::" 3( h16 ":" ) ls32
    */
    let IPV6_ADDRESS_4 = this.IPV6_ADDRESS_4 = new EveryRule([
      new OptionalRule(new EveryRule([
        H16,
        new OptionalRule(new EveryRule([
          parent.COLON,
          H16,
        ])),
      ])),
      new CountRule(parent.COLON, 2),
      new CountRule(new EveryRule([H16, parent.COLON]), 3),
      LS32,
    ]);

    /**
     * [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
     *
     * Again, should be parsed like this instead.
     *
     * [ h16 *2( ":" h16 ) ] "::" 2( h16 ":" ) ls32
     */
    let IPV6_ADDRESS_5 = this.IPV6_ADDRESS_5 = new EveryRule([
      new OptionalRule(new EveryRule([
        H16,
        new CountRule(
          new OptionalRule(new ManyRule(new EveryRule([parent.COLON, H16]))),
          2,
        ),
      ])),
      new CountRule(parent.COLON, 2),
      new CountRule(new EveryRule([H16, parent.COLON]), 2),
      LS32,
    ]);

    /**
     * [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
     *
     * We parse it like this
     *
     * [ h16 3*(":" h16) ] "::"    h16 ":"   ls32
     */
    let IPV6_ADDRESS_6 = this.IPV6_ADDRESS_6 = new EveryRule([
      new OptionalRule(new EveryRule([
        H16,
        new CountRule(new OptionalRule(new EveryRule([parent.COLON, H16])), 3),
      ])),
      new CountRule(parent.COLON, 2),
      H16,
      parent.COLON,
      LS32,
    ]);

    /**
     * [ *4( h16 ":" ) h16 ] "::"              ls32
     *
     * Parsed in grammar as:
     *
     * [ h16 *4( ":" h16 ) ]  "::"              ls32
     */
    let IPV6_ADDRESS_7 = this.IPV6_ADDRESS_7 = new EveryRule([
      new OptionalRule(new EveryRule([
        H16,
        new CountRule(new OptionalRule(new EveryRule([parent.COLON, H16])), 4),
      ])),
      new CountRule(parent.COLON, 2),
      LS32,
    ]);

    /**
     * [ *5( h16 ":" ) h16 ] "::"              h16
     *
     * Parsed in grammar as:
     *
     * [ h16 *5( ":" h16 ) ]  "::"             h16
     */
    let IPV6_ADDRESS_8 = this.IPV6_ADDRESS_8 = new EveryRule([
      new OptionalRule(new EveryRule([
        H16,
        new CountRule(new OptionalRule(new EveryRule([parent.COLON, H16])), 5),
      ])),
      new CountRule(parent.COLON, 2),
      H16,
    ]);

    /**
     * [ *6( h16 ":" ) h16 ] "::"              h16
     *
     * Parsed in grammar as:
     *
     * [ h16 *6( ":" h16 ) ]  "::"             h16
     */
    let IPV6_ADDRESS_9 = this.IPV6_ADDRESS_9 = new EveryRule([
      new OptionalRule(new EveryRule([
        H16,
        new CountRule(new OptionalRule(new EveryRule([parent.COLON, H16])), 6),
      ])),
      new CountRule(parent.COLON, 2),
    ]);

    /**
     * IPv6address   =                            6( h16 ":" ) ls32
     *               /                       "::" 5( h16 ":" ) ls32
     *               / [               h16 ] "::" 4( h16 ":" ) ls32
     *               / [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
     *               / [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
     *               / [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
     *               / [ *4( h16 ":" ) h16 ] "::"              ls32
     *               / [ *5( h16 ":" ) h16 ] "::"              h16
     *               / [ *6( h16 ":" ) h16 ] "::"
     */
    let IPV6_ADDRESS = this.IPV6_ADDRESS = new AnyRule([
      IPV6_ADDRESS_1,
      IPV6_ADDRESS_2,
      IPV6_ADDRESS_3,
      IPV6_ADDRESS_4,
      IPV6_ADDRESS_5,
      IPV6_ADDRESS_6,
      IPV6_ADDRESS_7,
      IPV6_ADDRESS_8,
      IPV6_ADDRESS_9,
    ]);

    // IPvFuture  = "v" 1*HEXDIG "." 1*( unreserved / sub-delims / ":" )
    let IPV_FUTURE = this.IPV_FUTURE = new EveryRule([
      new EqualsRule(0x76),
      parent.HEXDIG,
      parent.DOT,
      new AnyRule([UNRESERVED, SUB_DELIMS, parent.COLON])
    ]);

    // IP-literal    = "[" ( IPv6address / IPvFuture  ) "]"
    let IP_LITERAL = this.IP_LITERAL = new EveryRule([
      parent.OPEN_BRACKET,
      new AnyRule([IPV6_ADDRESS, IPV_FUTURE]),
      parent.CLOSE_BRACKET,
    ]);

    // host          = IP-literal / IPv4address / reg-name
    let HOST = this.HOST = new AnyRule([IP_LITERAL, IPV4_ADDRESS, REG_NAME]);

    // userinfo      = *( unreserved / pct-encoded / sub-delims / ":" )
    let USERINFO = this.USERINFO = new OptionalRule(new ManyRule(new AnyRule([
      UNRESERVED,
      PCT_ENCODED,
      SUB_DELIMS,
      parent.COLON,
    ])));

    // authority     = [ userinfo "@" ] host [ ":" port ]
    let AUTHORITY = this.AUTHORITY = new EveryRule([
      new OptionalRule(new EveryRule([USERINFO, new EqualsRule(0x40)])),
      HOST,
      new OptionalRule(new EveryRule([parent.COLON, PORT])),
    ]);

    // pchar = unreserved / pct-encoded / sub-delims / ":" / "@"
    let PCHAR = this.PCHAR = new AnyRule([UNRESERVED, PCT_ENCODED, SUB_DELIMS, new AnyOfRule(":@")]);

    let SEGMENT = this.SEGMENT = new OptionalRule(new ManyRule(PCHAR));

    let PATH_ABEMPTY = this.PATH_ABEMPTY = new OptionalRule(new ManyRule(new EveryRule([
      parent.SLASH,
      SEGMENT,
    ])));

    // segment-nz    = 1*pchar
    let SEGMENT_NZ = this.SEGMENT_NZ = new ManyRule(PCHAR);

    // path-absolute = "/" [ segment-nz *( "/" segment ) ]
    let PATH_ABSOLUTE = this.PATH_ABSOLUTE = new EveryRule([
      parent.SLASH,
      new OptionalRule(new EveryRule([
        SEGMENT_NZ,
        // reuse the same rule: *( "/" segment )
        PATH_ABEMPTY,
      ])),
    ]);

    // path-rootless = segment-nz *( "/" segment )
    let PATH_ROOTLESS = this.PATH_ROOTLESS = new EveryRule([
      SEGMENT_NZ,
      // reuse the same rule: *( "/" segment )
      PATH_ABEMPTY,
    ]);

    let PATH_EMPTY = this.PATH_EMPTY = EMPTY;

    // HIER PART
    // hier-part     = "//" authority path-abempty
    //                  / path-absolute
    //                  / path-rootless
    //                  / path-empty

    let HIER_PART = this.HIER_PART = new AnyRule([
      new EveryRule([new KeywordRule("//"), AUTHORITY, PATH_ABEMPTY]),
      PATH_ABSOLUTE,
      PATH_ROOTLESS,
      PATH_EMPTY,
    ]);

    // SCHEME
    let SCHEME = this.SCHEME = new EveryRule([
      parent.ALPHA,
      new OptionalRule(new ManyRule(new AnyRule([
        parent.ALPHA,
        parent.DIGIT,
        new AnyOfRule("+-."),
      ])))
    ]);

    // query         = *( pchar / "/" / "?" )
    let QUERY = this.QUERY = new OptionalRule(new ManyRule(new AnyRule([PCHAR, parent.SLASH, parent.QUESTION])));
    // fragment      = *( pchar / "/" / "?" )
    this.FRAGMENT = QUERY;

    // absolute-URI  = scheme ":" hier-part [ "?" query ]
    this.ABSOLUTE_URI = new EveryRule([
      SCHEME,
      parent.COLON,
      HIER_PART,
      new OptionalRule(new EveryRule([parent.QUESTION, QUERY]))
    ]);
  }

  // basic parsing rules
  public parent: RFC5234;

  public PORT: Rule;

  // sub-delims    = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
  public SUB_DELIMS: Rule;

  // pct-encoded   = "%" HEXDIG HEXDIG
  public PCT_ENCODED: Rule;

  // UNRESERVED    = ALPHA / DIGIT / "-" / "." / "_" / "~"
  public UNRESERVED: Rule;

  /** reg-name    = *( unreserved / pct-encoded / sub-delims ) */
  public REG_NAME: Rule;

  /**
   * dec-octet     = DIGIT                 ; 0-9
   *               / %x31-39 DIGIT         ; 10-99
   *               / "1" 2DIGIT            ; 100-199
   *               / "2" %x30-34 DIGIT     ; 200-249
   *               / "25" %x30-35          ; 250-255
   */
  public DEC_OCTET: Rule;

  // IPv4address   = dec-octet "." dec-octet "." dec-octet "." dec-octet
  public IPV4_ADDRESS: Rule;

  // 4 HEXDIG
  public H16: Rule;

  // LS32 = ( h16 ":" h16 ) / IPv4address
  public LS32: Rule;

  /** 6( h16 ":" ) ls32 */
  public IPV6_ADDRESS_1: Rule;

  /** "::" 5( h16 ":" ) ls32 */
  public IPV6_ADDRESS_2: Rule;

  /** [               h16 ] "::" 4( h16 ":" ) ls32 */
  public IPV6_ADDRESS_3: Rule;

  /**
   * [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
   *
   * However, it should be parsed using the grammar differently like this:
   *
   * [ h16 *1( ":" h16 ) ] "::" 3( h16 ":" ) ls32
  */
  public IPV6_ADDRESS_4: Rule;

  /**
   * [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
   *
   * Again, should be parsed like this instead.
   *
   * [ h16 *2( ":" h16 ) ] "::" 2( h16 ":" ) ls32
   */
  public IPV6_ADDRESS_5: Rule;

  /**
   * [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
   *
   * We parse it like this
   *
   * [ h16 3*(":" h16) ] "::"    h16 ":"   ls32
   */
  public IPV6_ADDRESS_6: Rule;

  /**
   * [ *4( h16 ":" ) h16 ] "::"              ls32
   *
   * Parsed in grammar as:
   *
   * [ h16 *4( ":" h16 ) ]  "::"              ls32
   */
  public IPV6_ADDRESS_7: Rule;

  /**
   * [ *5( h16 ":" ) h16 ] "::"              h16
   *
   * Parsed in grammar as:
   *
   * [ h16 *5( ":" h16 ) ]  "::"             h16
   */
  public IPV6_ADDRESS_8: Rule;

  /**
   * [ *6( h16 ":" ) h16 ] "::"              h16
   *
   * Parsed in grammar as:
   *
   * [ h16 *6( ":" h16 ) ]  "::"             h16
   */
  public IPV6_ADDRESS_9: Rule;

  /**
   * IPv6address   =                            6( h16 ":" ) ls32
   *               /                       "::" 5( h16 ":" ) ls32
   *               / [               h16 ] "::" 4( h16 ":" ) ls32
   *               / [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
   *               / [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
   *               / [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
   *               / [ *4( h16 ":" ) h16 ] "::"              ls32
   *               / [ *5( h16 ":" ) h16 ] "::"              h16
   *               / [ *6( h16 ":" ) h16 ] "::"
   */
  public IPV6_ADDRESS: Rule;

  // IPvFuture  = "v" 1*HEXDIG "." 1*( unreserved / sub-delims / ":" )
  public IPV_FUTURE: Rule;

  // IP-literal    = "[" ( IPv6address / IPvFuture  ) "]"
  public IP_LITERAL: Rule;

  // host          = IP-literal / IPv4address / reg-name
  public HOST: Rule;

  // userinfo      = *( unreserved / pct-encoded / sub-delims / ":" )
  public USERINFO: Rule;

  // authority     = [ userinfo "@" ] host [ ":" port ]
  public AUTHORITY: Rule;

  // pchar = unreserved / pct-encoded / sub-delims / ":" / "@"
  public PCHAR: Rule;

  public SEGMENT: Rule;

  public PATH_ABEMPTY: Rule;

  // segment-nz    = 1*pchar
  public SEGMENT_NZ: Rule;

  // path-absolute = "/" [ segment-nz *( "/" segment ) ]
  public PATH_ABSOLUTE: Rule;

  // path-rootless = segment-nz *( "/" segment )
  public PATH_ROOTLESS: Rule;

  public PATH_EMPTY: Rule;

  // HIER PART
  // hier-part     = "//" authority path-abempty
  //                  / path-absolute
  //                  / path-rootless
  //                  / path-empty

  public HIER_PART: Rule;

  // SCHEME
  public SCHEME: Rule;

  // query         = *( pchar / "/" / "?" )
  public QUERY: Rule;
  // fragment      = *( pchar / "/" / "?" )
  public FRAGMENT: Rule;

  // absolute-URI  = scheme ":" hier-part [ "?" query ]
  public ABSOLUTE_URI: Rule;

}

export class URI extends URIParser {
  constructor(
    public raw: string,
  ) {
    super();
    let sink = new ByteSink();
    sink.write(raw);
    let range = new Range(0, 0, sink);
    this.valid = this.parse_uri(sink, 0, range, this);
  }

  valid: bool = false;

  scheme: string | null = null;
  path: string | null = null;
  query: string | null = null;
  fragment: string | null = null;

  
  // URI           = scheme ":" hier-part [ "?" query ] [ "#" fragment ]
  public parse_uri(buffer: ByteSink, index: i32, range: Range, uri: URI): bool {
    let start = index;

    // SCHEME
    if (!this.SCHEME.test(buffer, index, range)) return false;
    uri.scheme = range.toString();
    index = range.end;

    // ":"
    if (!this.parent.COLON.test(buffer, index, range)) return false;
    index++;

    // HIER_PART
    if (!this.HIER_PART.test(buffer, index, range)) return false;
    uri.path = range.toString();
    index = range.end;

    // query
    if (this.parent.QUESTION.test(buffer, index, range)) {
      index++;
      if (this.QUERY.test(buffer, index, range)) {
        uri.query = range.toString();
        index = range.end;
      }
    }

    // fragment
    if (this.parent.HASH.test(buffer, index, range)) {
      index++;
      if (this.FRAGMENT.test(buffer, index, range)) {
        uri.fragment = range.toString();
        index = range.end;
      }
    }

    if (buffer.byteLength != index) {
      return false;
    }

    range.start = start;
    return true;
  }
}