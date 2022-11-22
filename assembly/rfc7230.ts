import { AnyOfRule, AnyRule, BetweenInclusiveRule, ByteSink, CountRule, EveryRule, KeywordRule, ManyRule, OptionalRule, Range, Rule } from "byte-parse-as/assembly";
import { URIParser } from "./rfc3986";


export class HTTPParser  {
  constructor() {

    let parent = this.parent = new URIParser();

    //      RWS            = 1*( SP / HTAB )
    let RWS = this.RWS = new ManyRule(new AnyRule([parent.parent.SP, parent.parent.HTAB]));
    //      OWS            = *( SP / HTAB )
    let OWS = this.OWS = new OptionalRule(RWS);
    //      BWS            = OWS
    let BWS = this.BWS = OWS;

    //   tchar = "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "." /
    //           "^" / "_" / "`" / "|" / "~" / DIGIT / ALPHA
    let TCHAR = this.TCHAR = new AnyRule([
      new AnyOfRule("!#$%&'*+-.^_`|~"),
      parent.parent.DIGIT,
      parent.parent.ALPHA,
    ]);

    // token = 1*tchar
    let TOKEN = this.TOKEN = new ManyRule(TCHAR);

    // method = token
    let METHOD = this.METHOD = TOKEN;

    // absolute-path = 1*( "/" segment )
    let ABSOLUTE_PATH = this.ABSOLUTE_PATH = new ManyRule(new EveryRule([parent.parent.SLASH, parent.SEGMENT]));

    // origin-form = absolute-path [ "?" query ]
    let ORIGIN_FORM = this.ORIGIN_FORM = new EveryRule([
      ABSOLUTE_PATH,
      new OptionalRule(new EveryRule([parent.parent.QUESTION, parent.QUERY]))
    ]);

    // absolute-form = absolute-uri
    let ABSOLUTE_FORM = this.ABSOLUTE_FORM = parent.ABSOLUTE_URI;

    // authority-form = authority
    let AUTHORITY_FORM = this.AUTHORITY_FORM = parent.AUTHORITY;

    // asterisk-form = "*"
    let ASTERISK_FORM = this.ASTERISK_FORM = parent.parent.ASTERISK;

    // request-target = origin-form / absolute-form / authority-form / asterisk-form
    let REQUEST_TARGET = this.REQUEST_TARGET = new AnyRule([
      ORIGIN_FORM,
      ABSOLUTE_FORM,
      AUTHORITY_FORM,
      ASTERISK_FORM,
    ]);

    //HTTP-name     = %x48.54.54.50 ; "HTTP", case-sensitive
    let HTTP_NAME = this.HTTP_NAME = new KeywordRule("HTTP");

    // HTTP-version  = HTTP-name "/" DIGIT "." DIGIT
    let HTTP_VERSION = this.HTTP_VERSION = new EveryRule([
      HTTP_NAME,
      parent.parent.SLASH,
      parent.parent.DIGIT,
      parent.parent.DOT,
      parent.parent.DIGIT,
    ]);


    // request-line = method SP request-target SP HTTP-version CRLF
   let REQUEST_LINE = this.REQUEST_LINE = new EveryRule([
      METHOD,
      parent.parent.SP,
      REQUEST_TARGET,
      parent.parent.SP,
      HTTP_VERSION,
      parent.parent.CRLF,
    ]);

    // status-code = 3DIGIT
    let STATUS_CODE = this.STATUS_CODE = new CountRule(parent.parent.DIGIT, 3);

    // obs-text = %x80-FF
    let OBS_TEXT = this.OBS_TEXT = new BetweenInclusiveRule(0x80, 0xFF);

    // reason-phrase  = *( HTAB / SP / VCHAR / obs-text )
    let REASON_PHRASE = this.REASON_PHRASE = new OptionalRule(new ManyRule(new AnyRule([
      parent.parent.HTAB,
      parent.parent.SP,
      parent.parent.VCHAR,
      OBS_TEXT,
    ])));

    // status-line = HTTP-version SP status-code SP reason-phrase CRLF
    let STATUS_LINE = this.STATUS_LINE = new EveryRule([
      HTTP_VERSION,
      parent.parent.SP,
      STATUS_CODE,
      parent.parent.SP,
      REASON_PHRASE,
      parent.parent.CRLF,
    ]);

    // start-line = request-line / status-line
    let START_LINE = this.START_LINE = new AnyRule([
      REQUEST_LINE,
      STATUS_LINE,
    ]);

    // field-name = token
    let FIELD_NAME = this.FIELD_NAME = TOKEN;

    // field-vchar = VCHAR / obs-text
    let FIELD_VCHAR = this.FIELD_VCHAR = new AnyRule([parent.parent.VCHAR, OBS_TEXT]);

    // field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
    let FIELD_CONTENT = this.FIELD_CONTENT = new EveryRule([
      FIELD_VCHAR,
      new OptionalRule(new EveryRule([
        new ManyRule(parent.parent.WSP),
        FIELD_VCHAR,
      ])),
    ]);

    // obs-fold = CRLF 1*( SP / HTAB )
    let OBS_FOLD = this.OBS_FOLD = new EveryRule([
      parent.parent.CRLF,
      new ManyRule(parent.parent.WSP),
    ]);

    // field-value = *( field-content / obs-fold )
    let FIELD_VALUE = this.FIELD_VALUE = new OptionalRule(new ManyRule(new AnyRule([
      FIELD_CONTENT,
      OBS_FOLD,
    ])));

    // header-field = field-name ":" OWS field-value OWS
    let HEADER_FIELD = this.HEADER_FIELD = new EveryRule([
      FIELD_NAME,
      parent.parent.COLON,
      OWS,
      FIELD_VALUE,
      OWS,
    ]);

    let MESSAGE_BODY = this.MESSAGE_BODY = new OptionalRule(new ManyRule(parent.parent.OCTET));

    // HTTP-message = start-line *( header-field CRLF ) CRLF [ message-body ]
    this.HTTP_MESSAGE = new EveryRule([
      START_LINE,
      new ManyRule(new OptionalRule(new EveryRule([HEADER_FIELD, parent.parent.CRLF]))),
      parent.parent.CRLF,
      MESSAGE_BODY,
    ]);

  }

  public parent: URIParser;
  //      RWS            = 1*( SP / HTAB )
  public RWS: Rule;
  //      OWS            = *( SP / HTAB )
  public OWS: Rule;
  //      BWS            = OWS
  public BWS: Rule;

  //   tchar = "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "." /
  //           "^" / "_" / "`" / "|" / "~" / DIGIT / ALPHA
  public TCHAR: Rule;

  // token = 1*tchar
  public TOKEN: Rule;

  // method = token
  public METHOD: Rule;

  // absolute-path = 1*( "/" segment )
  public ABSOLUTE_PATH: Rule;

  // origin-form = absolute-path [ "?" query ]
  public ORIGIN_FORM: Rule;

  // absolute-form = absolute-uri
  public ABSOLUTE_FORM: Rule;

  // authority-form = authority
  public AUTHORITY_FORM: Rule;

  // asterisk-form = "*"
  public ASTERISK_FORM: Rule;

  // request-target = origin-form / absolute-form / authority-form / asterisk-form
  public REQUEST_TARGET: Rule;

  //HTTP-name     = %x48.54.54.50 ; "HTTP", case-sensitive
  public HTTP_NAME: Rule;

  // HTTP-version  = HTTP-name "/" DIGIT "." DIGIT
  public HTTP_VERSION: Rule;


  // request-line = method SP request-target SP HTTP-version CRLF
  public REQUEST_LINE: Rule;

  // status-code = 3DIGIT
  public STATUS_CODE: Rule;

  // obs-text = %x80-FF
  public OBS_TEXT: Rule;

  // reason-phrase  = *( HTAB / SP / VCHAR / obs-text )
  public REASON_PHRASE: Rule;

  // status-line = HTTP-version SP status-code SP reason-phrase CRLF
  public STATUS_LINE: Rule;

  // start-line = request-line / status-line
  public START_LINE: Rule;

  // field-name = token
  public FIELD_NAME: Rule;

  // field-vchar = VCHAR / obs-text
  public FIELD_VCHAR: Rule;

  // field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
  public FIELD_CONTENT: Rule;

  // obs-fold = CRLF 1*( SP / HTAB )
  public OBS_FOLD: Rule;

  // field-value = *( field-content / obs-fold )
  public FIELD_VALUE: Rule;

  // header-field = field-name ":" OWS field-value OWS
  public HEADER_FIELD: Rule;

  public MESSAGE_BODY: Rule;

  // HTTP-message = start-line *( header-field CRLF ) CRLF [ message-body ]
  public HTTP_MESSAGE: Rule;
}

export class Request extends HTTPParser {
  static parse(buffer: ByteSink): Request {
    let req = new Request();
    req._parsed = true;
    req.valid = req.parse_request(buffer, req);
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

  constructor() {
    super();
  }

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
  
  /**
   * Parse a request within the given buffer, and populate the `Request`
   * object provided byref. It returns true if the request is valid.
   */
  parse_request(buffer: ByteSink, req: Request): bool {
    let range = new Range(0, 0, buffer);
    // Get the request line
    // request-line = method SP request-target SP HTTP-version CRLF

    // Get the method and advance the cursor
    if (!this.METHOD.test(buffer, 0, range)) return false;
    let method = range.toString();
    req.method = method;
    let index = range.end;

    // whitespace, and advance the cursor
    if (!this.parent.parent.SP.test(buffer, index, range)) return false;
    index = range.end;

    // get the request target
    if (!this.REQUEST_TARGET.test(buffer, index, range)) return false;
    let target = range.toString();
    req.target = target;
    index = range.end;

    // whitespace, and advance the cursor
    if (!this.parent.parent.SP.test(buffer, index, range)) return false;
    index = range.end;

    // version
    if (!this.HTTP_VERSION.test(buffer, index, range)) return false;
    let version = range.toString();
    req.version = version;
    index = range.end;

    // CRLF
    if (!this.parent.parent.CRLF.test(buffer, index, range)) return false;
    index = range.end;

    req.headers = new Map<string, string>();
    // headers
    while (true) {

      // header-field = field-name ":" OWS field-value OWS
      let header_index = index;
      if (!this.FIELD_NAME.test(buffer, header_index, range)) break;
      let header_name = range.toString();
      header_index = range.end;

      // ":"
      if (!this.parent.parent.COLON.test(buffer, header_index, range)) break;
      header_index++;

      // optional whitespace
      if (this.OWS.test(buffer, header_index, range)) header_index = range.end;

      if (!this.FIELD_VALUE.test(buffer, header_index, range)) break;
      let header_value = range.toString();
      header_index = range.end;

      // optional whitespace
      if (this.OWS.test(buffer, header_index, range)) header_index = range.end;

      // set the header
      req.headers!.set(header_name, header_value);

      // advance the cursor
      index = header_index;
    }

    // set the body range
    if (!this.parent.parent.CRLF.test(buffer, index, range)) return false;
    let copy = range.copy();
    copy.start = range.end;
    copy.end = buffer.byteLength;
    req.body = copy;

    return true;
  }
}


export class Response extends HTTPParser {
  static parse(buffer: ByteSink): Response {
    let res = new Response();
    res._parsed = true;
    res.valid = res.parse_response(buffer, res);
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

  constructor() {
    super();
  }
    
  /**
   * Parse a response from the given buffer, and populate the
   * given response object, returning true if parsing was successful.
   */
  parse_response(buffer: ByteSink, res: Response): bool {
    let range = new Range(0, 0, buffer);
    // HTTP-version SP status-code SP reason-phrase CRLF
    // version
    if (!this.HTTP_VERSION.test(buffer, 0, range)) return false;
    let version = range.toString();
    res.version = version;
    let index = range.end;

    // SP
    if (!this.parent.parent.SP.test(buffer, index, range)) return false;
    index = range.end;

    // status-code
    if (!this.STATUS_CODE.test(buffer, index, range)) return false;
    let status = <i32>parseInt(range.toString());
    res.status = status;
    index = range.end;

    // SP
    if (!this.parent.parent.SP.test(buffer, index, range)) return false;
    index = range.end;

    // reason
    if (this.REASON_PHRASE.test(buffer, index, range)) {
      index = range.end;
    }

    // CRLF
    if (!this.parent.parent.CRLF.test(buffer, index, range)) return false;
    index += 2;

    res.headers = new Map<string, string>();
    // headers
    while (true) {

      // header-field = field-name ":" OWS field-value OWS
      let header_index = index;
      if (!this.FIELD_NAME.test(buffer, header_index, range)) break;
      let header_name = range.toString();
      header_index = range.end;

      // ":"
      if (!this.parent.parent.COLON.test(buffer, header_index, range)) break;
      header_index++;

      // optional whitespace
      if (this.OWS.test(buffer, header_index, range)) header_index = range.end;

      if (!this.FIELD_VALUE.test(buffer, header_index, range)) break;
      let header_value = range.toString();
      header_index = range.end;

      // optional whitespace
      if (this.OWS.test(buffer, header_index, range)) header_index = range.end;

      // set the header
      res.headers!.set(header_name, header_value);

      // advance the cursor
      index = header_index;
    }

    // set the body range
    if (!this.parent.parent.CRLF.test(buffer, index, range)) return false;
    let copy = range.copy();
    copy.start = range.end;
    copy.end = buffer.byteLength;
    res.body = copy;

    return true;
  }

}
