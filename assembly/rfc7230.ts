import { AnyOfRule, AnyRule, BetweenInclusiveRule, ByteSink, CountRule, EveryRule, KeywordRule, ManyRule, OptionalRule, Range } from "byte-parse-as/assembly";
import { ABSOLUTE_URI, AUTHORITY, QUERY, SEGMENT, URI } from "./rfc3986";
import { ALPHA, CRLF, DIGIT, HTAB, OCTET, SP, VCHAR, WSP } from "./rfc5234";
import { ASTERISK, COLON, DOT, QUESTION, SLASH } from "./util";

//      RWS            = 1*( SP / HTAB )
export const RWS = new ManyRule(new AnyRule([SP, HTAB]));
//      OWS            = *( SP / HTAB )
export const OWS = new OptionalRule(RWS);
//      BWS            = OWS
export const BWS = OWS;

//   tchar = "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "." /
//           "^" / "_" / "`" / "|" / "~" / DIGIT / ALPHA
export const TCHAR = new AnyRule([
  new AnyOfRule("!#$%&'*+-.^_`|~"),
  DIGIT,
  ALPHA,
]);

// token = 1*tchar
export const TOKEN = new ManyRule(TCHAR);

// method = token
export const METHOD = TOKEN;

// absolute-path = 1*( "/" segment )
export const ABSOLUTE_PATH = new ManyRule(new EveryRule([SLASH, SEGMENT]));

// origin-form = absolute-path [ "?" query ]
export const ORIGIN_FORM = new EveryRule([
  ABSOLUTE_PATH,
  new OptionalRule(new EveryRule([QUESTION, QUERY]))
]);

// absolute-form = absolute-uri
export const ABSOLUTE_FORM = ABSOLUTE_URI;

// authority-form = authority
export const AUTHORITY_FORM = AUTHORITY;

// asterisk-form = "*"
export const ASTERISK_FORM = ASTERISK;

// request-target = origin-form / absolute-form / authority-form / asterisk-form
export const REQUEST_TARGET = new AnyRule([
  ORIGIN_FORM,
  ABSOLUTE_FORM,
  AUTHORITY_FORM,
  ASTERISK_FORM,
]);

//HTTP-name     = %x48.54.54.50 ; "HTTP", case-sensitive
export const HTTP_NAME = new KeywordRule("HTTP");

// HTTP-version  = HTTP-name "/" DIGIT "." DIGIT
export const HTTP_VERSION = new EveryRule([
  HTTP_NAME,
  SLASH,
  DIGIT,
  DOT,
  DIGIT,
]);


// request-line = method SP request-target SP HTTP-version CRLF
export const REQUEST_LINE = new EveryRule([
  METHOD,
  SP,
  REQUEST_TARGET,
  SP,
  HTTP_VERSION,
  CRLF,
]);

// status-code = 3DIGIT
export const STATUS_CODE = new CountRule(DIGIT, 3);

// obs-text = %x80-FF
export const OBS_TEXT = new BetweenInclusiveRule(0x80, 0xFF);

// reason-phrase  = *( HTAB / SP / VCHAR / obs-text )
export const REASON_PHRASE = new OptionalRule(new ManyRule(new AnyRule([
  HTAB,
  SP,
  VCHAR,
  OBS_TEXT,
])));

// status-line = HTTP-version SP status-code SP reason-phrase CRLF
export const STATUS_LINE = new EveryRule([
  HTTP_VERSION,
  SP,
  STATUS_CODE,
  SP,
  REASON_PHRASE,
  CRLF,
]);

// start-line = request-line / status-line
export const START_LINE = new AnyRule([
  REQUEST_LINE,
  STATUS_LINE,
]);

// field-name = token
export const FIELD_NAME = TOKEN;

// field-vchar = VCHAR / obs-text
export const FIELD_VCHAR = new AnyRule([VCHAR, OBS_TEXT]);

// field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
export const FIELD_CONTENT = new EveryRule([
  FIELD_VCHAR,
  new OptionalRule(new EveryRule([
    new ManyRule(WSP),
    FIELD_VCHAR,
  ])),
]);

// obs-fold = CRLF 1*( SP / HTAB )
export const OBS_FOLD = new EveryRule([
  CRLF,
  new ManyRule(WSP),
]);

// field-value = *( field-content / obs-fold )
export const FIELD_VALUE = new OptionalRule(new ManyRule(new AnyRule([
  FIELD_CONTENT,
  OBS_FOLD,
])));

// header-field = field-name ":" OWS field-value OWS
export const HEADER_FIELD = new EveryRule([
  FIELD_NAME,
  COLON,
  OWS,
  FIELD_VALUE,
  OWS,
]);

export const MESSAGE_BODY = new OptionalRule(new ManyRule(OCTET));

// HTTP-message = start-line *( header-field CRLF ) CRLF [ message-body ]
export const HTTP_MESSAGE = new EveryRule([
  START_LINE,
  new ManyRule(new OptionalRule(new EveryRule([HEADER_FIELD, CRLF]))),
  CRLF,
  MESSAGE_BODY,
]);

export class Request {
  public method: string | null = null;
  public target: string | null = null;
  public version: string | null = null;
  public body: Range | null = null;

  public valid: bool = false;

  public headers: Map<string, string> | null = null;

  constructor(
    public buffer: ByteSink
  ) {
    this.valid = parse_request(buffer, this);
  }
}

export function parse_request(buffer: ByteSink, req: Request): bool {
  let range = new Range(0, 0, buffer);

  // Get the request line
  // request-line = method SP request-target SP HTTP-version CRLF

  // Get the method and advance the cursor
  if (!METHOD.test(buffer, 0, range)) return false;
  let method = range.toString();
  req.method = method;
  let index = range.end;

  // whitespace, and advance the cursor
  if (!SP.test(buffer, index, range)) return false;
  index = range.end;

  // get the request target
  if (!REQUEST_TARGET.test(buffer, index, range)) return false;
  let target = range.toString();
  req.target = target;
  index = range.end;

  // whitespace, and advance the cursor
  if (!SP.test(buffer, index, range)) return false;
  index = range.end;

  // version
  if (!HTTP_VERSION.test(buffer, index, range)) return false;
  let version = range.toString();
  req.version = version;
  index = range.end;

  // CRLF
  if (!CRLF.test(buffer, index, range)) return false;
  index = range.end;

  req.headers = new Map<string, string>();
  // headers
  while (true) {

    // header-field = field-name ":" OWS field-value OWS
    let header_index = index;
    if (!FIELD_NAME.test(buffer, header_index, range)) break;
    let header_name = range.toString();
    header_index = range.end;

    // ":"
    if (!COLON.test(buffer, header_index, range)) break;
    header_index++;

    // optional whitespace
    if (OWS.test(buffer, header_index, range)) header_index = range.end;

    if (!FIELD_VALUE.test(buffer, header_index, range)) break;
    let header_value = range.toString();
    header_index = range.end;

    // optional whitespace
    if (OWS.test(buffer, header_index, range)) header_index = range.end;

    // set the header
    req.headers!.set(header_name, header_value);

    // advance the cursor
    index = header_index;
  }

  // set the body range
  if (!CRLF.test(buffer, index, range)) return false;
  let copy = range.copy();
  copy.start = range.end;
  copy.end = buffer.byteLength;
  req.body = copy;

  return true;
}

export class Response {
  public valid: bool = false;
  public version: string | null = null;
  public status: i32 = 0;
  public headers: Map<string, string> | null = null;
  public body: Range | null = null;

  constructor(
    public buffer: ByteSink,
  ) {
    this.valid = parse_response(buffer, this);
  }
}

export function parse_response(buffer: ByteSink, res: Response): bool {
  let range = new Range(0, 0, buffer);
  // HTTP-version SP status-code SP reason-phrase CRLF
  // version
  if (!HTTP_VERSION.test(buffer, 0, range)) return false;
  let version = range.toString();
  res.version = version;
  let index = range.end;

  // SP
  if (!SP.test(buffer, index, range)) return false;
  index = range.end;

  // status-code
  if (!STATUS_CODE.test(buffer, index, range)) return false;
  let status = <i32>parseInt(range.toString());
  res.status = status;
  index = range.end;

  // SP
  if (!SP.test(buffer, index, range)) return false;
  index = range.end;

  // reason
  if (REASON_PHRASE.test(buffer, index, range)) {
    index = range.end;
  }

  // CRLF
  if (!CRLF.test(buffer, index, range)) return false;
  index += 2;

  res.headers = new Map<string, string>();
  // headers
  while (true) {

    // header-field = field-name ":" OWS field-value OWS
    let header_index = index;
    if (!FIELD_NAME.test(buffer, header_index, range)) break;
    let header_name = range.toString();
    header_index = range.end;

    // ":"
    if (!COLON.test(buffer, header_index, range)) break;
    header_index++;

    // optional whitespace
    if (OWS.test(buffer, header_index, range)) header_index = range.end;

    if (!FIELD_VALUE.test(buffer, header_index, range)) break;
    let header_value = range.toString();
    header_index = range.end;

    // optional whitespace
    if (OWS.test(buffer, header_index, range)) header_index = range.end;

    // set the header
    res.headers!.set(header_name, header_value);

    // advance the cursor
    index = header_index;
  }

  // set the body range
  if (!CRLF.test(buffer, index, range)) return false;
  let copy = range.copy();
  copy.start = range.end;
  copy.end = buffer.byteLength;
  res.body = copy;

  return true;
}
