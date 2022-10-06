import { ByteSink, KeywordRule, Range } from "byte-parse-as/assembly";

export const HTTP = new KeywordRule("HTTP");

export function request_line(buffer: ByteSink, index: i32, range: Range): bool {

  return true;
}