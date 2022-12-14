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
  static parse(buffer: ByteSink): Request {
    let req = new Request();
    req._parsed = true;
    req.valid = parse_request(buffer, req);
    return req;
  }

  /** The HTTP Method. */
  public method: string | null = null;

  /** The target for the HTTP request. */
  public target: string | null = null;

  /** The HTTP version string, this library only supports 1.1. */
  public version: string = "HTTP/1.1";

  /** This property sets wether the Request was instantiated from `Request.parse()`. */
  private _parsed: bool = false;

  /** If this request was parsed, the body range property will be set. */
  private _bodyRange: Range | null = null;

  /** If this request was not parsed, it will be written to via the `write()` method. */
  private _body: ByteSink | null = null;

  /**
   * If this request was parsed, it returns the parsed body range,
   * otherwise it returns a new range of bytes that were written to
   * this request.
   */
  get body(): Range {
    if (this._parsed) return this._bodyRange!;
    return new Range(0, this._body!.length, this._body!);
  }

  set body(value: Range) {
    if (this._parsed) this._bodyRange = value;
    else this._body = new ByteSink(value.toBuffer());
  }

  /** If this request was parsed, and the parsing was successful, this property will be true. */
  public valid: bool = false;

  /** All the headers for this request. */
  public headers: Map<string, string> | null = null;

  constructor() {}

  /** Encode this request into the given bytesink, returning true if the buffer was written. */
  encode(buffer: ByteSink): bool {
    if (!this.method) return false;
    if (!this.target) return false;
    if (!this.version) return false;
    let method = this.method!;
    let target = this.target!;
    let version = this.version!;
    let body = this.body;

    // Start line
    buffer.write(method);
    buffer.write(" ");
    buffer.write(target);
    buffer.write(" ");
    buffer.write(version);
    buffer.write("\r\n");

    // write all the headers
    if (this.headers) {
      let headers = this.headers!;
      let keys = headers.keys();
      let length = keys.length;
      for (let i = 0; i < length; i++) {
        let key = keys[i];
        let value = headers.get(key);
        buffer.write(key);
        buffer.write(": ");
        buffer.write(value);
        buffer.write("\r\n");
      }
    }

    // CRLF
    buffer.write("\r\n");

    // BODY
    buffer.write(body.toBuffer());

    return true;
  }
}

/**
 * Parse a request within the given buffer, and populate the `Request`
 * object provided byref. It returns true if the request is valid.
 */
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
  static parse(buffer: ByteSink): Response {
    let res = new Response();
    res._parsed = true;
    res.valid = parse_response(buffer, res);
    return res;
  }

  /** If this response was parsed, this property will be set to true if the response was valid. */
  public valid: bool = false;
  /** The HTTP version of this response, this library only supports 1.1. */
  public version: string | null = "HTTP/1.1";
  /** The status code. */
  public status: i32 = 0;
  // TODO: Make a Status Code enum

  /** The response headers. */
  public headers: Map<string, string> | null = null;

  /** If this response was parsed from `Response.parse()` then this will be true.  */
  private _parsed: bool = false;

  /** If this response was parsed, this value will be set if the body was parsed correctly. */
  private _bodyRange: Range | null = null;
  /** If this response was created, this bytesink will be written to. */
  private _body: ByteSink | null = null;

  /**
   * If this response was parsed, it will return the parsed body.
   * Otherwise, it will return a new range with the _body as the
   * underlying stream.
   */
  get body(): Range {
    if (this._parsed) return this._bodyRange!;
    return new Range(0, this._body!.length, this._body!);
  }
  set body(value: Range) {
    if (this._parsed) {
      this._bodyRange = value;
    } else {
      this._body = new ByteSink(value.toBuffer());
    }
  }

  constructor() { }
}

/**
 * Parse a response from the given buffer, and populate the
 * given response object, returning true if parsing was successful.
 */
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
