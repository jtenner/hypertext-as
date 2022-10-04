/**
 * [X] ALPHA =  %x41-5A / %x61-7A   ; A-Z / a-z
 * BIT  =  "0" / "1"
 * [X] CHAR = %x01-7F ; any 7-bit US-ASCII character, excluding NUL
 * [X] CR = %x0D ; carriage return
 * [X] CRLF = CR LF ; Internet standard newline
 * [X] CTL = %x00-1F / %x7F ; controls
 * [X] DIGIT = %x30-39 ; 0-9
 * [X] DQUOTE =  %x22 ; " (Double Quote)
 * [X] HEXDIG =  DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
 * [X] HTAB =  %x09 ; horizontal tab
 * [X] LF =  %x0A ; linefeed
 * LWSP =  *(WSP / CRLF WSP)
 *                              ; Use of this linear-white-space rule
 *                              ;  permits lines containing only white
 *                              ;  space that are no longer legal in
 *                              ;  mail headers and have caused
 *                              ;  interoperability problems in other
 *                              ;  contexts.
 *                              ; Do not use when defining mail
 *                              ;  headers and use with caution in
 *                              ;  other contexts.
 * OCTET = %x00-FF ; 8 bits of data
 * [X] SP =  %x20
 * [X] VCHAR =  %x21-7E ; visible (printing) characters
 * WSP = SP / HTAB ; white space
 * [X] BWS = OWS
 * Connection = *( "," OWS ) connection-option *( OWS "," [ OWS
 *  connection-option ] )
 * Content-Length = 1*DIGIT
 * [X] HTTP-message = start-line *( header-field CRLF ) CRLF [ message-body ]
 * [X] HTTP-name = %x48.54.54.50 ; HTTP
 * [X] HTTP-version = HTTP-name "/" DIGIT "." DIGIT
 * Host = uri-host [ ":" port ]
 * [X] OWS = *( SP / HTAB )
 * [X] RWS = 1*( SP / HTAB )
 * TE = [ ( "," / t-codings ) *( OWS "," [ OWS t-codings ] ) ]
 * Trailer = *( "," OWS ) field-name *( OWS "," [ OWS field-name ] )
 * Transfer-Encoding = *( "," OWS ) transfer-coding *( OWS "," [ OWS
 *  transfer-coding ] )
 * URI-reference = <URI-reference, see [RFC3986], Section 4.1>
 * Upgrade = *( "," OWS ) protocol *( OWS "," [ OWS protocol ] )
 * Via = *( "," OWS ) ( received-protocol RWS received-by [ RWS comment ] ) *( OWS "," [ OWS ( received-protocol RWS received-by [ RWS comment ] ) ] )
 * absolute-URI = <absolute-URI, see [RFC3986], Section 4.3>
 * [X] absolute-form = absolute-URI
 * [X] absolute-path = 1*( "/" segment )
 * [X] asterisk-form = "*"
 * authority = <authority, see [RFC3986], Section 3.2>
 * authority-form = authority
 * chunk = chunk-size [ chunk-ext ] CRLF chunk-data CRLF
 * chunk-data = 1*OCTET
 * chunk-ext = *( ";" chunk-ext-name [ "=" chunk-ext-val ] )
 * chunk-ext-name = token
 * chunk-ext-val = token / quoted-string
 * chunk-size = 1*HEXDIG
 * chunked-body = *chunk last-chunk trailer-part CRLF
 * comment = "(" *( ctext / quoted-pair / comment ) ")"
 * connection-option = token
 * ctext = HTAB / SP / %x21-27 ; '!'-'''
 *  / %x2A-5B ; '*'-'['
 *  / %x5D-7E ; ']'-'~'
 *  / obs-text
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-name = token
 * field-value = *( field-content / obs-fold )
 * field-vchar = VCHAR / obs-text
 * fragment = <fragment, see [RFC3986], Section 3.5>
 * header-field = field-name ":" OWS field-value OWS
 * http-URI = "http://" authority path-abempty [ "?" query ] [ "#"
 *  fragment ]
 * https-URI = "https://" authority path-abempty [ "?" query ] [ "#"
 *  fragment ]
 * last-chunk = 1*"0" [ chunk-ext ] CRLF
 * message-body = *OCTET
 * method = token
 * obs-fold = CRLF 1*( SP / HTAB )
 * obs-text = %x80-FF
 * origin-form = absolute-path [ "?" query ]
 * partial-URI = relative-part [ "?" query ]
 * path-abempty = <path-abempty, see [RFC3986], Section 3.3>
 * port = <port, see [RFC3986], Section 3.2.3>
 * protocol = protocol-name [ "/" protocol-version ]
 * protocol-name = token
 * protocol-version = token
 * pseudonym = token
 * qdtext = HTAB / SP / "!" / %x23-5B ; '#'-'['
 *  / %x5D-7E ; ']'-'~'
 *  / obs-text
 * [X] query = <query, see [RFC3986], Section 3.4>
 * quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
 * quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
 * rank = ( "0" [ "." *3DIGIT ] ) / ( "1" [ "." *3"0" ] )
 * reason-phrase = *( HTAB / SP / VCHAR / obs-text )
 * received-by = ( uri-host [ ":" port ] ) / pseudonym
 * received-protocol = [ protocol-name "/" ] protocol-version
 * relative-part = <relative-part, see [RFC3986], Section 4.2>
 * [X] request-line = method SP request-target SP HTTP-version CRLF
 * [X] request-target = origin-form / absolute-form / authority-form / asterisk-form
 * scheme = <scheme, see [RFC3986], Section 3.1>
 * start-line = request-line / status-line
 * status-code = 3DIGIT
 * status-line = HTTP-version SP status-code SP reason-phrase CRLF
 * t-codings = "trailers" / ( transfer-coding [ t-ranking ] )
 * t-ranking = OWS ";" OWS "q=" rank
 * [X] tchar = "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "." /
 *  "^" / "_" / "`" / "|" / "~" / DIGIT / ALPHA
 * token = 1*tchar
 * trailer-part = *( header-field CRLF )
 * transfer-coding = "chunked" / "compress" / "deflate" / "gzip" /
 *  transfer-extension
 * transfer-extension = token *( OWS ";" OWS transfer-parameter )
 * transfer-parameter = token BWS "=" BWS ( token / quoted-string )
 * uri-host = <host, see [RFC3986], Section 3.2.2>
 *
 * pct-encoded   = "%" HEXDIG HEXDIG
 * segment       = *pchar
 * segment-nz    = 1*pchar
 * segment-nz-nc = 1*( unreserved / pct-encoded / sub-delims / "@" )
 *               ; non-zero-length segment without any colon ":"
 *
 * pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
 */



import { KeywordRule, AnyOfRule, AnyRule, BetweenInclusiveRule, EqualsRule, EveryRule, ManyRule, OptionalRule, Range } from "./lexer";


export let DOT = new EqualsRule(0x2E);
export let BACKSLASH = new EqualsRule(0x2F);
export let HTTP = new KeywordRule("HTTP");
export let ASTERISK = new EqualsRule(0x2A);
export let QUESTION = new EqualsRule(0x3F);
export let CR = new EqualsRule(0x0D);
export let LF = new EqualsRule(0x0A);
export let CRLF = new EveryRule([CR, LF]);
export let CTL = new AnyRule([
  new BetweenInclusiveRule(0x00, 0x1F),
  new EqualsRule(0x7F),
]);
export let CHAR = new BetweenInclusiveRule(0x01, 0x7F);
export let DQUOTE = new EqualsRule(0x22);
export let ALPHA = new AnyRule([
  new BetweenInclusiveRule(0x41, 0x5A), // lower case a-z
  new BetweenInclusiveRule(0x61, 0x7A), // upper case A-Z
]);
export let DIGIT = new BetweenInclusiveRule(0x30, 0x39);
export let VCHAR = new BetweenInclusiveRule(0x21, 0x7E);
export let SP = new EqualsRule(0x20);
export let HTAB = new EqualsRule(0x09);
export let RWS = new ManyRule(new AnyRule([SP, HTAB]));
export let OWS = new OptionalRule(RWS);
export let BWS = OWS;
export let TCHAR = new AnyRule([
  new AnyOfRule("!#$%&'+-.^_`|~"),
  DIGIT,
  ALPHA
]);
export let TOKEN = new ManyRule(TCHAR);
// LWSP =  *(WSP / CRLF WSP)
export let LWSP = new OptionalRule(
  new ManyRule(
    new AnyRule([
      WSP,
      new EveryRule([CRLF, WSP])
    ]),
  ),
);
export let PERCENT = new EqualsRule(0x25);
export let HEXCHAR = new AnyRule([
  new BetweenInclusiveRule(0x61, 0x66),
  new BetweenInclusiveRule(0x41, 0x46),
]);
export let HEXDIG = new AnyRule([DIGIT, HEXCHAR]);


export let UNRESERVED = new AnyRule([
  ALPHA,
  DIGIT,
  new AnyOfRule("-._~"),
]);

// ABSOLUTE_PATH = 1*( "/" segment )

// pct-encoded   = "%" HEXDIG HEXDIG
export let PCT_ENCODED = new EveryRule([
  PERCENT,
  HEXDIG,
  HEXDIG,
]);

//sub-delims = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
export let SUB_DELIMS = new AnyOfRule("!$&'()*+,;=");

// pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
export let PCHAR = new AnyRule([
  UNRESERVED,
  PCT_ENCODED,
  SUB_DELIMS,
  new AnyOfRule(":@"),
]);

export let SEGMENT = new ManyRule(PCHAR);

export let ABSOLUTE_PATH = new ManyRule(new EveryRule([
  BACKSLASH,
  SEGMENT,
]));

// query         = *( pchar / "/" / "?" )
export let QUERY = new OptionalRule(
  new ManyRule(
    new AnyRule([PCHAR, BACKSLASH, QUESTION]),
  ),
);

export class Request {
  method: string | null = null;
  version: string | null = null;
  target: string | null = null;
  headers: Map<string, string> = new Map<string, string>();
}

// start-line *( header-field CRLF ) CRLF [ message-body ]
export function http_request(buffer: ArrayBuffer, range: Range, req: Request): bool {
  // check the start lin
  if (!request_line(buffer, range, req)) return false;
  let index = range.end;

  while (header_field(buffer, index, range, req)) {
    index = range.end;
  }

  if (!CRLF.test(buffer, index, range)) return false;
  index = range.end;

  message_body(buffer, index, range, req);
  range.start = 0;
  return true;
}

// header-field = field-name ":" OWS field-value OWS
export function header_field(buffer: ArrayBuffer, index: i32, range: Range, req: Request): bool {
  // we are parsing a single header

  // memoize the start
  let start = index;

  // test for a field name
  if (!field_name(buffer, index, range)) return false;
  let field = range.toString();
  index = range.end;

  // test for ":"
  if (!COLON.test(buffer, index, range)) return false;
  index = range.end;

  // test for optional whitespace
  OWS.test(buffer, index, range);
  index = range.end;

  if (!field_value(buffer, index, range)) return false;
  let value = range.toString()
  index = range.end;

  OWS.test(buffer, index, range);

  req.headers.set(field, value);
  range.start = start;
}

// request-line = method SP request-target SP HTTP-version CRLF
// method = token
export function request_line(buffer: ArrayBuffer, range: Range, req: Request): bool {

  // test the method and obtain it
  if (!TOKEN.test(buffer, 0, range)) return false;
  let method = range.toString();
  let index = range.end;

  // next consume some required whitespace
  if (!SP.test(buffer, index, range)) return false;
  index = range.end;

  // next parse the target
  if (!request_target(buffer, index, range)) return false;
  let target = range.toString();
  index = range.end;

  // next consume some required whitespace
  if (!SP.test(buffer, index, range)) return false;
  index = range.end;

  // obtain the http version
  if (!http_version(buffer, index, range)) return false;
  let version = range.toString();
  index = range.end;

  // validate CRLF
  if (!CRLF.test(buffer, index, range)) return false;
  range.start = 0;
  // the end is already set from the location of the CRLF

  // now set the request parameters
  req.method = method;
  req.target = target;
  req.version = version;
  return true;
}

// request-target = origin-form / absolute-form / authority-form / asterisk-form
export function request_target(buffer: ArrayBuffer, index: i32, range: Range): bool {
  return origin_form(buffer, index, range)
    || absolute_form(buffer, index, range)
    || authority_form(buffer, index, range)
    || asterisk_form(buffer, index, range);
}

// HTTP-name = %x48.54.54.50 ; HTTP
// HTTP-version = HTTP-name "/" DIGIT "." DIGIT
export function http_version(buffer: ArrayBuffer, index: i32, range: Range): bool {
  let start = index;

  // check for the http text
  if (!HTTP.test(buffer, index, range)) return false;
  index = range.end;

  // check for the backslash
  if (!BACKSLASH.test(buffer, index, range)) return false;
  index = range.end;

  // digit
  if (!DIGIT.test(buffer, index, range)) return false;
  index = range.end;

  // dot
  if (!DOT.test(buffer, index, range)) return false;
  index = range.end;

  // digit
  if (!DIGIT.test(buffer, index, range)) return false;
  // this version is set correctly

  // The end of the range is already set, need to change the start
  range.start = start;

  // successful match
  return true;
}

// origin-form = absolute-path [ "?" query ]
export function origin_form(buffer: ArrayBuffer, index: i32, range: Range): bool {
  let start = index;
  if (!ABSOLUTE_PATH.test(buffer, index, range)) return false;
  index = range.end;

  if (QUESTION.test(buffer, index, range)) {
    QUERY.test(buffer, index, range);
    range.start = start;
    return true;
  } else {
    // no query, start and end are set properly
    return true;
  }
}

// absolute-form = absolute-URI
export function absolute_form(buffer: ArrayBuffer, index: i32, range: Range): bool {
  return absolute_uri(buffer, index, range);
}

// authority-form = authority
export function authority_form(buffer: ArrayBuffer, index: i32, range: Range): bool {
  return authority(buffer, index, range);
}

export function asterisk_form(buffer: ArrayBuffer, index: i32, range: Range): bool {
  return ASTERISK.test(buffer, index, range);
}
