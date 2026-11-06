import fs from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { fr } from "./fr";

// Every word the code passes to t(), tx(), tp() or rich() has its French, and
// every French entry is a word the code uses. The code is read, not run.

const SRC = path.resolve(__dirname, "../..");
const SKIP = /(^|\/)(generated|test)(\/|$)|\.test\.tsx?$/;

type Use = { key: string; where: string };

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    const rel = path.relative(SRC, file).replace(/\\/g, "/");
    if (SKIP.test(rel)) return [];
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.tsx?$/.test(entry.name) ? [file] : [];
  });
}

const literal = (node: ts.Node | undefined): string | undefined =>
  node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;

function uses(): Use[] {
  const found: Use[] = [];
  for (const file of sourceFiles(SRC)) {
    const text = fs.readFileSync(file, "utf8");
    if (!/\b(t|tx|tp|rich)\(/.test(text)) continue;
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        const where = `${path.relative(SRC, file).replace(/\\/g, "/")}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
        if (name === "t" || name === "tx" || name === "rich") {
          const key = literal(node.arguments[0]);
          if (key !== undefined) found.push({ key, where });
        } else if (name === "tp") {
          const one = literal(node.arguments[1]);
          const other = literal(node.arguments[2]);
          if (one !== undefined && other !== undefined) found.push({ key: `${one}|${other}`, where });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return found;
}

const used = uses();
const placeholders = (text: string) => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!))].sort();

describe("the French catalog", () => {
  it("finds the words the code uses", () => {
    expect(used.length).toBeGreaterThan(0);
  });

  it("has a French for every word the code uses", () => {
    const missing = used.filter(({ key }) => !(key in fr)).map(({ key, where }) => `${where}  ${key}`);
    expect(missing).toEqual([]);
  });

  it("has no entry the code doesn't use", () => {
    const keys = new Set(used.map(({ key }) => key));
    expect(Object.keys(fr).filter((key) => !keys.has(key))).toEqual([]);
  });

  it("keeps each {placeholder} of the English in the French", () => {
    const wrong = Object.entries(fr)
      .filter(([english, french]) => {
        const forms = english.includes("|") && french.includes("|") ? english.split("|").map((form, i) => [form, french.split("|")[i] ?? ""] as const) : [[english, french] as const];
        return forms.some(([a, b]) => placeholders(a).join() !== placeholders(b).join());
      })
      .map(([english]) => english);
    expect(wrong).toEqual([]);
  });
});
