export class Range {

  constructor(
    public start: i32 = 0,
    public end: i32 = 0,
    public buffer: ArrayBuffer = new ArrayBuffer(0),
  ) {}

  static for(buffer: ArrayBuffer): Range {
    return new Range(0, 0, buffer);
  }

  copy(): Range {
    return new Range(this.start, this.end, this.buffer);
  }

  get length(): i32 {
    return this.end - this.start;
  }

  toString(): string {
    let length = this.length;
    return String.UTF8.decodeUnsafe(
      changetype<usize>(this.buffer) + <usize>this.start,
      <usize>length,
    );
  }
}
export abstract class Rule {
  abstract test(buffer: ArrayBuffer, index: i32, range: Range): bool;
}

export class KeywordRule extends Rule {
  buffer: ArrayBuffer;
  constructor(
    value: string,
  ) {
    super();
    this.buffer = String.UTF8.encode(value);
  }

  test(buffer: ArrayBuffer, index: i32, range: Range): bool {
    let compare = this.buffer;
    let compareLength = compare.byteLength;
    if (buffer.byteLength < index + compareLength) return false;
    let diff = memory.compare(
      changetype<usize>(buffer) + <usize>index,
      changetype<usize>(compare),
      <usize>compareLength,
    );
    if (diff == 0) {
      range.start = index;
      range.end = index + compareLength;
      return true;
    }
    return false;
  }
}

export class AnyRule extends Rule {
  constructor(
    public rules: Rule[],
  ) {
    super();
  }
  test(buffer: ArrayBuffer, index: i32, range: Range): bool {
    let rules = this.rules;
    let length = rules.length;

    for (let i = 0; i < length; i++) {
      let rule = unchecked(rules[i]);
      if (rule.test(buffer, index, range)) return true;
    }
    return false;
  }
}

export class EveryRule extends Rule {
  constructor(
    public rules: Rule[],
  ) {
    super();
  }

  test(buffer: ArrayBuffer, index: i32, range: Range): bool {
    let rules = this.rules;
    let length = rules.length;
    let start = index;
    let end = 0;

    for (let i = 0; i < length; i++) {
      let rule = unchecked(rules[i]);
      if (!rule.test(buffer, start, range)) return false;
      end = start = range.end;
    }
    range.start = index;
    range.end = end;
    return true;
  }
}

export class ManyRule extends Rule {
  constructor(
    public rule: Rule,
  ) {
    super();
  }

  test(buffer: ArrayBuffer, index: i32, range: Range): bool {
    let start = index;
    let rule = this.rule;
    if (!rule.test(buffer, start, range)) return false;

    while (true) {
      start = range.end;
      if (!rule.test(buffer, start, range)) break;
    }
    range.start = index;
    return true;
  }
}

export class OptionalRule extends Rule {
  constructor(
    public rule: Rule,
  ) {
    super();
  }

  test(buffer: ArrayBuffer, index: i32, range: Range): bool {
    if (!this.rule.test(buffer, index, range)) {
      range.start = index;
      range.end = index;
    }
    return true;
  }
}

export class BetweenInclusiveRule extends Rule {
  constructor(
    public start: u8,
    public end: u8,
  ) {
    super();
  }

  test(buffer: ArrayBuffer, index: i32, range: Range): bool {
    if (index >= buffer.byteLength) return false;
    let byte = load<u8>(changetype<usize>(buffer) + <usize>index);
    if (bool(i32(byte >= this.start) & i32(byte <= this.end))) {
      range.start = index;
      range.end = index + 1;
      return true;
    }
    return false;
  }
}

export class EqualsRule extends Rule {
  constructor(
    public byte: u8,
  ) {
    super();
  }

  test(buffer: ArrayBuffer, index: i32, range: Range): bool {
    if (index >= buffer.byteLength) return false;
    let byte = load<u8>(changetype<usize>(buffer) + <usize>index);
    if (byte == this.byte) {
      range.start = index;
      range.end = index + 1;
      return true;
    }
    return false;
  }
}

export class CountRule extends Rule {
  constructor(
    public rule: Rule,
    public count: i32,
  ) {
    super();
  }
  test(buffer: ArrayBuffer, index: i32, range: Range): bool {
    let start = index;
    let begin = index;
    let count = this.count;
    let rule = this.rule;
    for (let i = 0; i < count; i++) {
      if (rule.test(buffer, start, range)) {
        start = range.end;
        continue;
      }
      return false;
    }
    range.start = begin;
    return true;
  }
}

export class AnyOfRule extends Rule {
  chars: ArrayBuffer;

  constructor(
    chars: string,
  ) {
    super();
    this.chars = String.UTF8.encode(chars);
  }

  test(buffer: ArrayBuffer, index: i32, range: Range): bool {
    let chars = this.chars;
    let length = chars.byteLength;
    if (buffer.byteLength < index + 1) return false;
    let compare = load<u8>(changetype<usize>(buffer) + <usize>index);
    for (let i = 0; i < length; i++) {
      let char = load<u8>(changetype<usize>(chars));
      if (char == compare) {
        range.start = index;
        range.end = index + 1;
        return true;
      }
    }
    return false;
  }
}

