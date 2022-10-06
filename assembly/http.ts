import { ByteSink, KeywordRule, Range } from "byte-parse-as/assembly";

export const enum RequestStatus {
  Started = 0,
  IncompleteRequestLine = 1,
  IncompleteHeaders = 2,
  BodyReady = 3,
  Error = 4,
}

export function request_line_state(req: Request): void {
  let buffer = req.buffer;

  if 

}

export class Request {
  headers: Map<string, Range> = new Map<string, Range>();
  buffer: ByteSink = new ByteSink();
  state: (req: Request) => void = request_line_state;
  private requestStatus: RequestStatus = RequestStatus.Started;

  write<T>(bytes: T): void {
    this.buffer.write<T>(bytes);
  }
}

export class Response {
  
}