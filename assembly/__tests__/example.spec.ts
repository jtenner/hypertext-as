import { ByteSink, Range } from "byte-parse-as/assembly";
import { Request, Response, HTTPParser } from "../rfc7230";

describe("uri", () => {

  test("header field", () => {
    let parser = new HTTPParser();
    let buffer = new ByteSink();
    buffer.write("Content-Length");
    let range = new Range(0, 0, buffer);
    log(parser.TCHAR);
    parser.HEADER_FIELD.test(buffer, 0, range);
    log(range);
    expect(range.toString()).toBe("Content-Length");
  });

  test("a simple uri", () => {
    let buffer = new ByteSink();
    buffer.write(`HTTP/1.1 200 OK\r\nContent-Length: 183\r\nContent-Disposition: inline; filename="index.html"\r\nAccept-Ranges: bytes\r\nContent-Type: text/html; charset=utf-8\r\nVary: Accept-Encoding\r\nDate: Fri, 07 Oct 2022 20:00:00 GMT\r\nConnection: keep-alive\r\nKeep-Alive: timeout=5\r\n\r\n`)
    let request = Response.parse(buffer);
    log(request);
    expect(request.valid).toBeTruthy();
  });

  test("simple request", () => {
    let buffer = new ByteSink();
    buffer.write(`POST /cgi-bin/process.cgi HTTP/1.1\r\nUser-Agent: Mozilla/4.0 (compatible; MSIE5.01; Windows NT)\r\nHost: www.tutorialspoint.com\r\nContent-Type: text/xml; charset=utf-8\r\nContent-Length: length\r\nAccept-Language: en-us\r\nAccept-Encoding: gzip, deflate\r\nConnection: Keep-Alive\r\n\r\n<?xml version="1.0" encoding="utf-8"?>\r\n<string xmlns="http://clearforest.com/">string</string>`);
    let request = Request.parse(buffer);
    log(request);
    log(request.body.toString());
    expect(request.valid).toBeTruthy();
  });
});
