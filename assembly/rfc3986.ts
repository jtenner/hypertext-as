import { AnyOfRule, AnyRule, BetweenInclusiveRule, ByteSink, CountRule, EqualsRule, EveryRule, KeywordRule, ManyRule, OptionalRule, Range, EMPTY } from "byte-parse-as/assembly";

import { CLOSE_BRACKET, COLON, DOT, FIVE, HASH, ONE, OPEN_BRACKET, QUESTION, SLASH, TWO } from "./util";
import { ALPHA, DIGIT, HEXDIG } from "./rfc5234";

export class URI {
  constructor(
    public raw: string,
  ) {
    let sink = new ByteSink();
    sink.write(raw);
    let range = new Range(0, 0, sink);
    this.valid = parse_uri(sink, 0, range, this);
  }

  valid: bool = false;

  scheme: string | null = null;
  path: string | null = null;
  query: string | null = null;
  fragment: string | null = null;
}

export const PORT = new ManyRule(DIGIT);

// sub-delims    = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
export const SUB_DELIMS = new AnyOfRule("!$&'()*+,;=");

// pct-encoded   = "%" HEXDIG HEXDIG
export const PCT_ENCODED = new EveryRule([new EqualsRule(0x25), HEXDIG, HEXDIG]);

// UNRESERVED    = ALPHA / DIGIT / "-" / "." / "_" / "~"
export const UNRESERVED = new AnyRule([ALPHA, DIGIT, new AnyOfRule("-._~")]);

/** reg-name    = *( unreserved / pct-encoded / sub-delims ) */
export const REG_NAME = new OptionalRule(new ManyRule(new AnyRule([UNRESERVED, PCT_ENCODED, SUB_DELIMS])));
/**
 * dec-octet     = DIGIT                 ; 0-9
 *               / %x31-39 DIGIT         ; 10-99
 *               / "1" 2DIGIT            ; 100-199
 *               / "2" %x30-34 DIGIT     ; 200-249
 *               / "25" %x30-35          ; 250-255
 */
export const DEC_OCTET = new AnyRule([
  // "25" %x30-35          ; 250-255
  new EveryRule([TWO, FIVE, new BetweenInclusiveRule(0x30, 0x35)]),
  // "2" %x30-34 DIGIT     ; 200-249
  new EveryRule([TWO, new BetweenInclusiveRule(0x30, 0x34), DIGIT]),
  // "1" 2DIGIT            ; 100-199
  new EveryRule([ONE, new CountRule(DIGIT, 2)]),
  // %x31-39 DIGIT         ; 10-99
  new EveryRule([new BetweenInclusiveRule(0x31, 0x39), DIGIT]),
  // DIGIT                 ; 0-9
  DIGIT
]);

// IPv4address   = dec-octet "." dec-octet "." dec-octet "." dec-octet
export const IPV4_ADDRESS = new EveryRule([
  DEC_OCTET,
  DOT,
  DEC_OCTET,
  DOT,
  DEC_OCTET,
  DOT,
  DEC_OCTET,
]);

// 4 HEXDIG
export const H16 = new CountRule(HEXDIG, 4);

// LS32 = ( h16 ":" h16 ) / IPv4address
export const LS32 = new AnyRule([
  new EveryRule([ H16, COLON, H16]),
  IPV4_ADDRESS,
]);

/** 6( h16 ":" ) ls32 */
export const IPV6_ADDRESS_1 = new EveryRule([
  new CountRule(new EveryRule([
    H16,
    COLON,
  ]), 6),
  LS32,
])

/** "::" 5( h16 ":" ) ls32 */
export const IPV6_ADDRESS_2 = new EveryRule([
  new CountRule(COLON, 2),
  new CountRule(new EveryRule([H16, COLON]), 5),
  LS32,
]);

/** [               h16 ] "::" 4( h16 ":" ) ls32 */
export const IPV6_ADDRESS_3 = new EveryRule([
  new OptionalRule(H16),
  new CountRule(COLON, 2),
  new CountRule(new EveryRule([H16, COLON]), 4),
  LS32,
]);

/**
 * [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
 *
 * However, it should be parsed using the grammar differently like this:
 *
 * [ h16 *1( ":" h16 ) ] "::" 3( h16 ":" ) ls32
*/
export const IPV6_ADDRESS_4 = new EveryRule([
  new OptionalRule(new EveryRule([
    H16,
    new OptionalRule(new EveryRule([
      COLON,
      H16,
    ])),
  ])),
  new CountRule(COLON, 2),
  new CountRule(new EveryRule([H16, COLON]), 3),
  LS32,
]);

/**
 * [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
 *
 * Again, should be parsed like this instead.
 *
 * [ h16 *2( ":" h16 ) ] "::" 2( h16 ":" ) ls32
 */
export const IPV6_ADDRESS_5 = new EveryRule([
  new OptionalRule(new EveryRule([
    H16,
    new CountRule(
      new OptionalRule(new ManyRule(new EveryRule([COLON, H16]))),
      2,
    ),
  ])),
  new CountRule(COLON, 2),
  new CountRule(new EveryRule([H16, COLON]), 2),
  LS32,
]);

/**
 * [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
 *
 * We parse it like this
 *
 * [ h16 3*(":" h16) ] "::"    h16 ":"   ls32
 */
export const IPV6_ADDRESS_6 = new EveryRule([
  new OptionalRule(new EveryRule([
    H16,
    new CountRule(new OptionalRule(new EveryRule([ COLON, H16 ])), 3),
  ])),
  new CountRule(COLON, 2),
  H16,
  COLON,
  LS32,
]);

/**
 * [ *4( h16 ":" ) h16 ] "::"              ls32
 *
 * Parsed in grammar as:
 *
 * [ h16 *4( ":" h16 ) ]  "::"              ls32
 */
export const IPV6_ADDRESS_7 = new EveryRule([
  new OptionalRule(new EveryRule([
    H16,
    new CountRule(new OptionalRule(new EveryRule([COLON, H16])), 4),
  ])),
  new CountRule(COLON, 2),
  LS32,
]);

/**
 * [ *5( h16 ":" ) h16 ] "::"              h16
 *
 * Parsed in grammar as:
 *
 * [ h16 *5( ":" h16 ) ]  "::"             h16
 */
export const IPV6_ADDRESS_8 = new EveryRule([
  new OptionalRule(new EveryRule([
    H16,
    new CountRule(new OptionalRule(new EveryRule([COLON, H16])), 5),
  ])),
  new CountRule(COLON, 2),
  H16,
]);

/**
 * [ *6( h16 ":" ) h16 ] "::"              h16
 *
 * Parsed in grammar as:
 *
 * [ h16 *6( ":" h16 ) ]  "::"             h16
 */
export const IPV6_ADDRESS_9 = new EveryRule([
  new OptionalRule(new EveryRule([
    H16,
    new CountRule(new OptionalRule(new EveryRule([COLON, H16])), 6),
  ])),
  new CountRule(COLON, 2),
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
export const IPV6_ADDRESS = new AnyRule([
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
export const IPV_FUTURE = new EveryRule([
  new EqualsRule(0x76),
  HEXDIG,
  DOT,
  new AnyRule([UNRESERVED, SUB_DELIMS, COLON])
]);

// IP-literal    = "[" ( IPv6address / IPvFuture  ) "]"
export const IP_LITERAL = new EveryRule([
  OPEN_BRACKET,
  new AnyRule([IPV6_ADDRESS, IPV_FUTURE]),
  CLOSE_BRACKET,
]);

// host          = IP-literal / IPv4address / reg-name
export const HOST = new AnyRule([IP_LITERAL, IPV4_ADDRESS, REG_NAME]);

// userinfo      = *( unreserved / pct-encoded / sub-delims / ":" )
export const USERINFO = new OptionalRule(new ManyRule(new AnyRule([
  UNRESERVED,
  PCT_ENCODED,
  SUB_DELIMS,
  COLON,
])));

// authority     = [ userinfo "@" ] host [ ":" port ]
export const AUTHORITY = new EveryRule([
  new OptionalRule(new EveryRule([USERINFO, new EqualsRule(0x40)])),
  HOST,
  new OptionalRule(new EveryRule([COLON, PORT])),
]);

// pchar = unreserved / pct-encoded / sub-delims / ":" / "@"
export const PCHAR = new AnyRule([UNRESERVED, PCT_ENCODED, SUB_DELIMS, new AnyOfRule(":@")]);

export const SEGMENT = new OptionalRule(new ManyRule(PCHAR));

export const PATH_ABEMPTY = new OptionalRule(new ManyRule(new EveryRule([
  SLASH,
  SEGMENT,
])));

// segment-nz    = 1*pchar
export const SEGMENT_NZ = new ManyRule(PCHAR);

// path-absolute = "/" [ segment-nz *( "/" segment ) ]
export const PATH_ABSOLUTE = new EveryRule([
  SLASH,
  new OptionalRule(new EveryRule([
    SEGMENT_NZ,
    // reuse the same rule: *( "/" segment )
    PATH_ABEMPTY,
  ])),
]);

// path-rootless = segment-nz *( "/" segment )
export const PATH_ROOTLESS = new EveryRule([
  SEGMENT_NZ,
  // reuse the same rule: *( "/" segment )
  PATH_ABEMPTY,
]);

export const PATH_EMPTY = EMPTY;

// HIER PART
// hier-part     = "//" authority path-abempty
//                  / path-absolute
//                  / path-rootless
//                  / path-empty

export const HIER_PART = new AnyRule([
  new EveryRule([new KeywordRule("//"), AUTHORITY, PATH_ABEMPTY]),
  PATH_ABSOLUTE,
  PATH_ROOTLESS,
  PATH_EMPTY,
]);

// SCHEME
export const SCHEME = new EveryRule([
  ALPHA,
  new OptionalRule(new ManyRule(new AnyRule([
    ALPHA,
    DIGIT,
    new AnyOfRule("+-."),
  ])))
]);

// query         = *( pchar / "/" / "?" )
export const QUERY = new OptionalRule(new ManyRule(new AnyRule([PCHAR, SLASH, QUESTION])));
// fragment      = *( pchar / "/" / "?" )
export const FRAGMENT = QUERY;

// URI           = scheme ":" hier-part [ "?" query ] [ "#" fragment ]
export function parse_uri(buffer: ByteSink, index: i32, range: Range, uri: URI): bool {
  let start = index;

  // SCHEME
  if (!SCHEME.test(buffer, index, range)) return false;
  uri.scheme = range.toString();
  index = range.end;

  // ":"
  if (!COLON.test(buffer, index, range)) return false;
  index++;

  // HIER_PART
  if (!HIER_PART.test(buffer, index, range)) return false;
  uri.path = range.toString();
  index = range.end;

  trace("HIER_PART: " + uri.path!);
  // query
  if (QUESTION.test(buffer, index, range)) {
    index++;
    if (QUERY.test(buffer, index, range)) {
      uri.query = range.toString();
      index = range.end;
    }
  }

  // fragment
  if (HASH.test(buffer, index, range)) {
    index++;
    if (FRAGMENT.test(buffer, index, range)) {
      uri.fragment = range.toString();
    }
  }

  if (buffer.byteLength != index) return false;

  range.start = start;
  return true;
}
