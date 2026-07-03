import type { BugKind, BugSite, SnippetTemplate, TemplateToken } from "./types";

// The template bank behind the Debug Sprint. Each template is 5–9 lines of
// tokens; tokens created with s() are BUG SITES that the generator may flip
// to their buggy form. Non-activated sites render clean and act as decoys.
// Every buggy form is a real defect in context (not a style nitpick), and
// every template carries at least 6 sites so a 4–6 bug round always fits.

function s(clean: string, buggy: string, kind: BugKind): BugSite {
  return { clean, buggy, kind };
}

type L = TemplateToken[];
const T = (id: string, lang: SnippetTemplate["lang"], lines: L[]): SnippetTemplate => ({
  id,
  lang,
  lines,
});

export const SNIPPET_TEMPLATES: SnippetTemplate[] = [
  T("py-sum", "python", [
    ["def total", s("(nums):", "(nums)", "colon")],
    ["    s ", s("= 0", "== 0", "assign-vs-equality")],
    ["    for i in ", s("range(len(nums))", "range(1, len(nums))", "off-by-one"), ":"],
    ["        s ", s("+=", "-=", "operator-swap"), " ", s("nums[i]", "nums[i + 1]", "index-error")],
    ["    if s ", s("== 0", "= 0", "assign-vs-equality"), ":"],
    ['        print("empty list")'],
    ["    return ", s("s", "S", "wrong-case")],
  ]),

  T("py-max", "python", [
    ["def biggest", s("(xs):", "(xs)", "colon")],
    ["    best = ", s("xs[0]", "xs[1]", "index-error")],
    ["    for x ", s("in xs:", "in xs", "colon")],
    ["        if x ", s("> best", "< best", "operator-swap"), ":"],
    ["            ", s("best", "Best", "wrong-case"), " = x"],
    ["    return ", s("best", "x", "wrong-return")],
  ]),

  T("py-count-evens", "python", [
    ["def count_evens", s("(nums):", "(nums)", "colon")],
    ["    count ", s("= 0", "== 0", "assign-vs-equality")],
    ["    for n ", s("in nums:", "in nums", "colon")],
    ["        if n ", s("% 2", "% 3", "operator-swap"), " ", s("== 0", "= 0", "assign-vs-equality"), ":"],
    ["            ", s("count", "Count", "wrong-case"), " ", s("+= 1", "-= 1", "operator-swap")],
    ["    return ", s("count", "nums", "wrong-return")],
  ]),

  T("py-reverse", "python", [
    ["def reverse", s("(word):", "(word)", "colon")],
    ["    ", s("out", "Out", "wrong-case"), ' = ""'],
    ["    for ch ", s("in word:", "in word", "colon")],
    ["        out ", s("=", "==", "assign-vs-equality"), " ch ", s("+", "-", "operator-swap"), " out"],
    ["    return ", s("out", "word", "wrong-return")],
  ]),

  T("py-average", "python", [
    ["def average", s("(nums):", "(nums)", "colon")],
    ["    ", s("total", "Total", "wrong-case"), " ", s("= 0", "== 0", "assign-vs-equality")],
    ["    for n ", s("in nums:", "in nums", "colon")],
    ["        total ", s("+= n", "*= n", "operator-swap")],
    ["    return total ", s("/ len(nums)", "* len(nums)", "operator-swap")],
  ]),

  T("py-find", "python", [
    ["def find", s("(items, target):", "(items, target)", "colon")],
    ["    for i in ", s("range(len(items))", "range(1, len(items))", "off-by-one"), ":"],
    ["        if ", s("items[i]", "items[i + 1]", "index-error"), " ", s("==", "=", "assign-vs-equality"), " target:"],
    ["            return ", s("i", "items", "wrong-return")],
    ["    return ", s("-1", "0", "wrong-return")],
  ]),

  T("py-passing", "python", [
    ["def check", s("(score, bonus):", "(score, bonus)", "colon")],
    ["    ", s("total", "Total", "wrong-case"), " = score ", s("+", "-", "operator-swap"), " bonus"],
    ["    if total ", s(">= 75", "<= 75", "operator-swap"), " ", s("and", "or", "boolean-swap"), " total <= 100:"],
    ['        return ', s('"PASS"', '"FAIL"', "wrong-return")],
    ['    return "FAIL"'],
  ]),

  T("py-password", "python", [
    ["def strong", s("(pw):", "(pw)", "colon")],
    ["    has_num = ", s("False", "True", "boolean-swap")],
    ["    for c ", s("in pw:", "in pw", "colon")],
    ["        if c", s(".isdigit():", ".isdigit()", "colon")],
    ["            has_num = ", s("True", "False", "boolean-swap")],
    ["    return has_num ", s("and", "or", "boolean-swap"), " len(pw) ", s(">= 8", "<= 8", "operator-swap")],
  ]),

  T("py-min", "python", [
    ["def smallest", s("(xs):", "(xs)", "colon")],
    ["    low = ", s("xs[0]", "xs[1]", "index-error")],
    ["    for x ", s("in xs:", "in xs", "colon")],
    ["        if x ", s("< low", "> low", "operator-swap"), ":"],
    ["            ", s("low", "Low", "wrong-case"), " = x"],
    ["    return ", s("low", "x", "wrong-return")],
  ]),

  T("py-factorial", "python", [
    ["def fact", s("(n):", "(n)", "colon")],
    ["    ", s("result", "Result", "wrong-case"), " ", s("= 1", "== 1", "assign-vs-equality")],
    ["    for i in ", s("range(2, n + 1)", "range(2, n)", "off-by-one"), ":"],
    ["        result ", s("*=", "+=", "operator-swap"), " i"],
    ["    return ", s("result", "i", "wrong-return")],
  ]),

  T("js-sum", "js", [
    ["function total(nums) {"],
    ["  let sum ", s("= 0", "== 0", "assign-vs-equality"), ";"],
    ["  for (let ", s("i = 0", "i = 1", "off-by-one"), "; ", s("i < nums.length", "i <= nums.length", "off-by-one"), "; i++) {"],
    ["    ", s("sum", "Sum", "wrong-case"), " ", s("+=", "-=", "operator-swap"), " ", s("nums[i]", "nums[i + 1]", "index-error"), ";"],
    ["  }"],
    ["  return ", s("sum", "i", "wrong-return"), ";"],
    ["}"],
  ]),

  T("js-max", "js", [
    ["function biggest(xs) {"],
    ["  let best = ", s("xs[0]", "xs[1]", "index-error"), ";"],
    ["  for (const x ", s("of", "in", "operator-swap"), " xs) {"],
    ["    if (x ", s("> best", "< best", "operator-swap"), ") {"],
    ["      ", s("best", "Best", "wrong-case"), " ", s("=", "==", "assign-vs-equality"), " x;"],
    ["    }"],
    ["  }"],
    ["  return ", s("best", "x", "wrong-return"), ";"],
    ["}"],
  ]),

  T("js-vowels", "js", [
    ["function countVowels(word) {"],
    ["  let ", s("count", "Count", "wrong-case"), " ", s("= 0", "== 0", "assign-vs-equality"), ";"],
    ["  for (const ch ", s("of", "in", "operator-swap"), " word) {"],
    ['    if ("aeiou".includes(', s("ch", "word", "index-error"), ")) {"],
    ["      count ", s("+= 1", "-= 1", "operator-swap"), ";"],
    ["    }"],
    ["  }"],
    ["  return ", s("count", "word", "wrong-return"), ";"],
    ["}"],
  ]),

  T("js-evens", "js", [
    ["function evens(nums) {"],
    ["  const out = [];"],
    ["  for (let ", s("i = 0", "i = 1", "off-by-one"), "; ", s("i < nums.length", "i <= nums.length", "off-by-one"), "; i++) {"],
    ["    if (", s("nums[i]", "nums[i + 1]", "index-error"), " % 2 ", s("=== 0", "= 0", "assign-vs-equality"), ") {"],
    ["      out.push(", s("nums[i]", "i", "index-error"), ");"],
    ["    }"],
    ["  }"],
    ["  return ", s("out", "nums", "wrong-return"), ";"],
    ["}"],
  ]),

  T("js-find-user", "js", [
    ["function findUser(users, name) {"],
    ["  for (const u ", s("of", "in", "operator-swap"), " users) {"],
    ["    if (", s("u.name", "u.Name", "wrong-case"), " ", s("===", "=", "assign-vs-equality"), " ", s("name", "users", "index-error"), ") {"],
    ["      return ", s("u", "name", "wrong-return"), ";"],
    ["    }"],
    ["  }"],
    ["  return ", s("null", "name", "wrong-return"), ";"],
    ["}"],
  ]),

  T("js-cart", "js", [
    ["function cartTotal(items) {"],
    ["  let ", s("total", "Total", "wrong-case"), " ", s("= 0", "== 0", "assign-vs-equality"), ";"],
    ["  for (const item ", s("of", "in", "operator-swap"), " items) {"],
    ["    total ", s("+=", "-=", "operator-swap"), " item.price ", s("*", "+", "operator-swap"), " item.qty;"],
    ["  }"],
    ["  return ", s("total", "items", "wrong-return"), ";"],
    ["}"],
  ]),

  T("js-palindrome", "js", [
    ["function isPalindrome(w) {"],
    ["  let j = ", s("w.length - 1", "w.length", "off-by-one"), ";"],
    ["  for (let ", s("i = 0", "i = 1", "off-by-one"), "; i < j; i++) {"],
    ["    if (", s("w[i]", "w[i + 1]", "index-error"), " ", s("!==", "===", "boolean-swap"), " ", s("w[j - i]", "w[j - i - 1]", "index-error"), ") {"],
    ["      return ", s("false", "true", "boolean-swap"), ";"],
    ["    }"],
    ["  }"],
    ["  return true;"],
    ["}"],
  ]),

  T("ps-login", "pseudo", [
    ["FUNCTION login(user, pass)"],
    ["  ", s("stored", "Stored", "wrong-case"), " = LOOKUP(user)"],
    ["  IF stored ", s("==", "=", "assign-vs-equality"), " NULL THEN"],
    ['    RETURN "no such user"'],
    ["  IF pass ", s("==", "=", "assign-vs-equality"), " stored.pass ", s("AND", "OR", "boolean-swap"), " attempts ", s("< 3", "> 3", "operator-swap"), " THEN"],
    ['    RETURN ', s('"welcome"', '"denied"', "wrong-return")],
    ['  RETURN "denied"'],
  ]),

  T("ps-search", "pseudo", [
    ["FUNCTION search(list, target)"],
    ["  i ", s("= 0", "= 1", "off-by-one")],
    ["  WHILE i ", s("<", "<=", "off-by-one"), " LENGTH(list)"],
    ["    IF ", s("list[i]", "list[i + 1]", "index-error"), " ", s("==", "=", "assign-vs-equality"), " target THEN"],
    ["      RETURN ", s("i", "list", "wrong-return")],
    ["    i = i ", s("+ 1", "- 1", "operator-swap")],
    ["  RETURN ", s("-1", "0", "wrong-return")],
  ]),

  T("ps-grade", "pseudo", [
    ["FUNCTION grade(score)"],
    ["  IF score ", s(">= 90", "<= 90", "operator-swap"), " THEN"],
    ['    RETURN ', s('"A"', '"C"', "wrong-return")],
    ["  IF score ", s(">= 80", "= 80", "assign-vs-equality"), " ", s("AND", "OR", "boolean-swap"), " score ", s("< 90", "> 90", "operator-swap"), " THEN"],
    ["    RETURN ", s('"B"', '"A"', "wrong-return")],
    ['  RETURN "C"'],
  ]),
];
