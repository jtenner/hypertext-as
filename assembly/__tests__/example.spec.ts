import { parse_uri, URI } from "../rfc3986";

describe("uri", () => {
  test("a simple uri", () => {
    let uri = "https://www.google.com/";
    let result = new URI(uri);
    expect(result.valid).toBeTruthy();
    if (result.fragment) trace("Fragment: " + result.fragment!);
    if (result.path) trace("Path: " + result.path!);
    if (result.query) trace("Query: " + result.query!);
    if (result.scheme) trace("Scheme: " + result.scheme!);
  });
});
