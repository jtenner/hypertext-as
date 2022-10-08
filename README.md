# hypertext-as

Because you want to parse http and uris.

## Usage Example

```ts
import { ByteSink } from "byte-parse-as/assembly";
import { Request } from "hypertext-as/assembly";

// create a buffer
let buffer = new ByteSink();
buffer.write(`POST /cgi-bin/process.cgi HTTP/1.1\r\nUser-Agent: Mozilla/4.0 (compatible; MSIE5.01; Windows NT)\r\nHost: www.tutorialspoint.com\r\nContent-Type: text/xml; charset=utf-8\r\nContent-Length: length\r\nAccept-Language: en-us\r\nAccept-Encoding: gzip, deflate\r\nConnection: Keep-Alive\r\n\r\n<?xml version="1.0" encoding="utf-8"?>\r\n<string xmlns="http://clearforest.com/">string</string>`);

// parse the request using the `Request` class
let request = new Request(buffer);
request.valid; // true

let body = request.body.toString(); // utf16 string
```
