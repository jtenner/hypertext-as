import { AnyRule, BetweenInclusiveRule, CountRule, EqualsRule, EveryRule, KeywordRule, ManyRule, Range } from "../lexer";

describe("equals", () => {
  test("simple byte testing", () => {
    let tester = String.UTF8.encode("abc");
    let rule = new EqualsRule(<u8>"b".charCodeAt(0));
    let range = Range.for(tester);
    expect(rule.test(tester, 0, range)).toBeFalsy();
    expect(rule.test(tester, 1, range)).toBeTruthy();
    expect(range.toString()).toBe("b");
    expect(rule.test(tester, 2, range)).toBeFalsy();
  });
});

describe("many", () => {
  test("many letters", () => {
    let tester = String.UTF8.encode("aabbbbbaa");
    let rule = new ManyRule(new EqualsRule(<u8>"b".charCodeAt(0)));
    let range = Range.for(tester);
    expect(rule.test(tester, 0, range)).toBeFalsy();
    expect(rule.test(tester, 1, range)).toBeFalsy();
    expect(rule.test(tester, 2, range)).toBeTruthy();
    expect(range.toString()).toBe("bbbbb");
  });
});

describe("keywords", () => {
  test("a keyword", () => {
    let tester = String.UTF8.encode(" super test");
    let rule = new KeywordRule("super");
    let range = Range.for(tester);
    expect(rule.test(tester, 0, range)).toBeFalsy();
    expect(rule.test(tester, 1, range)).toBeTruthy();
    expect(range.toString()).toBe("super");
  });
});

describe("every rule", () => {
  test("a sequence of rules", () => {
    let tester = String.UTF8.encode("abcdefg");
    let rule = new EveryRule([
      new EqualsRule(<u8>"a".charCodeAt(0)),
      new EqualsRule(<u8>"b".charCodeAt(0)),
      new EqualsRule(<u8>"c".charCodeAt(0)),
      new EqualsRule(<u8>"d".charCodeAt(0)),
    ]);
    let range = Range.for(tester);
    expect(rule.test(tester, 0, range)).toBeTruthy();
    expect(range.toString()).toBe("abcd");

    expect(rule.test(tester, 1, range)).toBeFalsy();
  });
});

describe("between", () => {
  test("letters between a and d", () => {
    let tester = String.UTF8.encode("ade");
    let rule = new BetweenInclusiveRule(
      <u8>"a".codePointAt(0),
      <u8>"d".codePointAt(0),
    );
    let range = Range.for(tester);
    expect(rule.test(tester, 0, range)).toBeTruthy();
    expect(range.toString()).toBe("a");
    expect(rule.test(tester, 1, range)).toBeTruthy();
    expect(range.toString()).toBe("d");
    expect(rule.test(tester, 2, range)).toBeFalsy();
  });
});

describe("count rule", () => {
  test("three a's", () => {
    let tester = String.UTF8.encode("baaac");
    let rule = new CountRule(new EqualsRule(<u8>"a".charCodeAt(0)), 3);
    let range = Range.for(tester);
    expect(rule.test(tester, 0, range)).toBeFalsy();
    expect(rule.test(tester, 1, range)).toBeTruthy();
    expect(range.toString()).toBe("aaa");
    expect(rule.test(tester, 2, range)).toBeFalsy();
  });
});
