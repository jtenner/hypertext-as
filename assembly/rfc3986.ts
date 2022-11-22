import { AnyOfRule, AnyRule, BetweenInclusiveRule, ByteSink, CountRule, EqualsRule, EveryRule, KeywordRule, ManyRule, OptionalRule, Range, EMPTY, Rule } from "byte-parse-as/assembly";
import { RFC5234 } from "./rfc5234";

export class URIParser extends RFC5234 {
  constructor() {
    super();
    this.PORT = new ManyRule(this.DIGIT);

    // sub-delims    = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
    this.SUB_DELIMS = new AnyOfRule("!$&'()*+,;=");

    // pct-encoded   = "%" HEXDIG HEXDIG
    this.PCT_ENCODED = new EveryRule([new EqualsRule(0x25), this.HEXDIG, this.HEXDIG]);

    // UNRESERVED    = ALPHA / DIGIT / "-" / "." / "_" / "~"
    this.UNRESERVED = new AnyRule([this.ALPHA, this.DIGIT, new AnyOfRule("-._~")]);

    /** reg-name    = *( unreserved / pct-encoded / sub-delims ) */
    this.REG_NAME = new OptionalRule(new ManyRule(new AnyRule([this.UNRESERVED, this.PCT_ENCODED, this.SUB_DELIMS])));

    /**
     * dec-octet     = DIGIT                 ; 0-9
     *               / %x31-39 DIGIT         ; 10-99
     *               / "1" 2DIGIT            ; 100-199
     *               / "2" %x30-34 DIGIT     ; 200-249
     *               / "25" %x30-35          ; 250-255
     */
    this.DEC_OCTET = new AnyRule([
      // "25" %x30-35          ; 250-255
      new EveryRule([this.TWO, this.FIVE, new BetweenInclusiveRule(0x30, 0x35)]),
      // "2" %x30-34 DIGIT     ; 200-249
      new EveryRule([this.TWO, new BetweenInclusiveRule(0x30, 0x34), this.DIGIT]),
      // "1" 2DIGIT            ; 100-199
      new EveryRule([this.ONE, new CountRule(this.DIGIT, 2)]),
      // %x31-39 DIGIT         ; 10-99
      new EveryRule([new BetweenInclusiveRule(0x31, 0x39), this.DIGIT]),
      // DIGIT                 ; 0-9
      this.DIGIT
    ]);

    // IPv4address   = dec-octet "." dec-octet "." dec-octet "." dec-octet
    this.IPV4_ADDRESS = new EveryRule([
      this.DEC_OCTET,
      this.DOT,
      this.DEC_OCTET,
      this.DOT,
      this.DEC_OCTET,
      this.DOT,
      this.DEC_OCTET,
    ]);

    // 4 HEXDIG
    this.H16 = new CountRule(this.HEXDIG, 4);

    // LS32 = ( h16 ":" h16 ) / IPv4address
    this.LS32 = new AnyRule([
      new EveryRule([this.H16, this.COLON, this.H16]),
      this.IPV4_ADDRESS,
    ]);

    /** 6( h16 ":" ) ls32 */
    this.IPV6_ADDRESS_1 = new EveryRule([
      new CountRule(new EveryRule([
        this.H16,
        this.COLON,
      ]), 6),
      this.LS32,
    ]);

    /** "::" 5( h16 ":" ) ls32 */
    this.IPV6_ADDRESS_2 = new EveryRule([
      new CountRule(this.COLON, 2),
      new CountRule(new EveryRule([this.H16, this.COLON]), 5),
      this.LS32,
    ]);

    /** [               h16 ] "::" 4( h16 ":" ) ls32 */
    this.IPV6_ADDRESS_3 = new EveryRule([
      new OptionalRule(this.H16),
      new CountRule(this.COLON, 2),
      new CountRule(new EveryRule([this.H16, this.COLON]), 4),
      this.LS32,
    ]);

    /**
     * [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
     *
     * However, it should be parsed using the grammar differently like this:
     *
     * [ h16 *1( ":" h16 ) ] "::" 3( h16 ":" ) ls32
    */
    this.IPV6_ADDRESS_4 = new EveryRule([
      new OptionalRule(new EveryRule([
        this.H16,
        new OptionalRule(new EveryRule([
          this.COLON,
          this.H16,
        ])),
      ])),
      new CountRule(this.COLON, 2),
      new CountRule(new EveryRule([this.H16, this.COLON]), 3),
      this.LS32,
    ]);

    /**
     * [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
     *
     * Again, should be parsed like this instead.
     *
     * [ h16 *2( ":" h16 ) ] "::" 2( h16 ":" ) ls32
     */
    this.IPV6_ADDRESS_5 = new EveryRule([
      new OptionalRule(new EveryRule([
        this.H16,
        new CountRule(
          new OptionalRule(new ManyRule(new EveryRule([this.COLON, this.H16]))),
          2,
        ),
      ])),
      new CountRule(this.COLON, 2),
      new CountRule(new EveryRule([this.H16, this.COLON]), 2),
      this.LS32,
    ]);

    /**
     * [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
     *
     * We parse it like this
     *
     * [ h16 3*(":" h16) ] "::"    h16 ":"   ls32
     */
    this.IPV6_ADDRESS_6 = new EveryRule([
      new OptionalRule(new EveryRule([
        this.H16,
        new CountRule(new OptionalRule(new EveryRule([this.COLON, this.H16])), 3),
      ])),
      new CountRule(this.COLON, 2),
      this.H16,
      this.COLON,
      this.LS32,
    ]);

    /**
     * [ *4( h16 ":" ) h16 ] "::"              ls32
     *
     * Parsed in grammar as:
     *
     * [ h16 *4( ":" h16 ) ]  "::"              ls32
     */
    this.IPV6_ADDRESS_7 = new EveryRule([
      new OptionalRule(new EveryRule([
        this.H16,
        new CountRule(new OptionalRule(new EveryRule([this.COLON, this.H16])), 4),
      ])),
      new CountRule(this.COLON, 2),
      this.LS32,
    ]);

    /**
     * [ *5( h16 ":" ) h16 ] "::"              h16
     *
     * Parsed in grammar as:
     *
     * [ h16 *5( ":" h16 ) ]  "::"             h16
     */
    this.IPV6_ADDRESS_8 = new EveryRule([
      new OptionalRule(new EveryRule([
        this.H16,
        new CountRule(new OptionalRule(new EveryRule([this.COLON, this.H16])), 5),
      ])),
      new CountRule(this.COLON, 2),
      this.H16,
    ]);

    /**
     * [ *6( h16 ":" ) h16 ] "::"              h16
     *
     * Parsed in grammar as:
     *
     * [ h16 *6( ":" h16 ) ]  "::"             h16
     */
    this.IPV6_ADDRESS_9 = new EveryRule([
      new OptionalRule(new EveryRule([
        this.H16,
        new CountRule(new OptionalRule(new EveryRule([this.COLON, this.H16])), 6),
      ])),
      new CountRule(this.COLON, 2),
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
    this.IPV6_ADDRESS = new AnyRule([
      this.IPV6_ADDRESS_1,
      this.IPV6_ADDRESS_2,
      this.IPV6_ADDRESS_3,
      this.IPV6_ADDRESS_4,
      this.IPV6_ADDRESS_5,
      this.IPV6_ADDRESS_6,
      this.IPV6_ADDRESS_7,
      this.IPV6_ADDRESS_8,
      this.IPV6_ADDRESS_9,
    ]);

    // IPvFuture  = "v" 1*HEXDIG "." 1*( unreserved / sub-delims / ":" )
    this.IPV_FUTURE = new EveryRule([
      new EqualsRule(0x76),
      this.HEXDIG,
      this.DOT,
      new AnyRule([this.UNRESERVED, this.SUB_DELIMS, this.COLON])
    ]);

    // IP-literal    = "[" ( IPv6address / IPvFuture  ) "]"
    this.IP_LITERAL = new EveryRule([
      this.OPEN_BRACKET,
      new AnyRule([this.IPV6_ADDRESS, this.IPV_FUTURE]),
      this.CLOSE_BRACKET,
    ]);

    // host          = IP-literal / IPv4address / reg-name
    this.HOST = new AnyRule([this.IP_LITERAL, this.IPV4_ADDRESS, this.REG_NAME]);

    // userinfo      = *( unreserved / pct-encoded / sub-delims / ":" )
    this.USERINFO = new OptionalRule(new ManyRule(new AnyRule([
      this.UNRESERVED,
      this.PCT_ENCODED,
      this.SUB_DELIMS,
      this.COLON,
    ])));

    // authority     = [ userinfo "@" ] host [ ":" port ]
    this.AUTHORITY = new EveryRule([
      new OptionalRule(new EveryRule([this.USERINFO, new EqualsRule(0x40)])),
      this.HOST,
      new OptionalRule(new EveryRule([this.COLON, this.PORT])),
    ]);

    // pchar = unreserved / pct-encoded / sub-delims / ":" / "@"
    this.PCHAR = new AnyRule([this.UNRESERVED, this.PCT_ENCODED, this.SUB_DELIMS, new AnyOfRule(":@")]);

    this.SEGMENT = new OptionalRule(new ManyRule(this.PCHAR));

    this.PATH_ABEMPTY = new OptionalRule(new ManyRule(new EveryRule([
      this.SLASH,
      this.SEGMENT,
    ])));

    // segment-nz    = 1*pchar
    this.SEGMENT_NZ = new ManyRule(this.PCHAR);

    // path-absolute = "/" [ segment-nz *( "/" segment ) ]
    this.PATH_ABSOLUTE = new EveryRule([
      this.SLASH,
      new OptionalRule(new EveryRule([
        this.SEGMENT_NZ,
        // reuse the same rule: *( "/" segment )
        this.PATH_ABEMPTY,
      ])),
    ]);

    // path-rootless = segment-nz *( "/" segment )
    this.PATH_ROOTLESS = new EveryRule([
      this.SEGMENT_NZ,
      // reuse the same rule: *( "/" segment )
      this.PATH_ABEMPTY,
    ]);

    this.PATH_EMPTY = EMPTY;

    // HIER PART
    // hier-part     = "//" authority path-abempty
    //                  / path-absolute
    //                  / path-rootless
    //                  / path-empty

    this.HIER_PART = new AnyRule([
      new EveryRule([new KeywordRule("//"), this.AUTHORITY, this.PATH_ABEMPTY]),
      this.PATH_ABSOLUTE,
      this.PATH_ROOTLESS,
      this.PATH_EMPTY,
    ]);

    // SCHEME
    this.SCHEME = new EveryRule([
      this.ALPHA,
      new OptionalRule(new ManyRule(new AnyRule([
        this.ALPHA,
        this.DIGIT,
        new AnyOfRule("+-."),
      ])))
    ]);

    // query         = *( pchar / "/" / "?" )
    this.QUERY = new OptionalRule(new ManyRule(new AnyRule([this.PCHAR, this.SLASH, this.QUESTION])));
    // fragment      = *( pchar / "/" / "?" )
    this.FRAGMENT = this.QUERY;

    // absolute-URI  = scheme ":" hier-part [ "?" query ]
    this.ABSOLUTE_URI = new EveryRule([
      this.SCHEME,
      this.COLON,
      this.HIER_PART,
      new OptionalRule(new EveryRule([this.QUESTION, this.QUERY]))
    ]);
  }

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
    if (!this.COLON.test(buffer, index, range)) return false;
    index++;

    // HIER_PART
    if (!this.HIER_PART.test(buffer, index, range)) return false;
    uri.path = range.toString();
    index = range.end;

    // query
    if (this.QUESTION.test(buffer, index, range)) {
      index++;
      if (this.QUERY.test(buffer, index, range)) {
        uri.query = range.toString();
        index = range.end;
      }
    }

    // fragment
    if (this.HASH.test(buffer, index, range)) {
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