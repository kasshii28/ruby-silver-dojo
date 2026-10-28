// Reads the question YAML at build time, validates it, and returns the list sent to the browser.
// Any problem fails the build.
import { parse } from 'yaml';
import { CATEGORIES, type Category, type Question } from './types';

// Ids are assigned in this order and saved in users' study history, so never reorder these files.
const FILES = ['q_syntax', 'q_lib', 'q_oop', 'q_syntax2', 'q_lib2', 'q_oop2', 'q_extra', 'q_official'];

const sources = import.meta.glob<string>('../data/questions/*.yml', { query: '?raw', import: 'default', eager: true });

type Raw = Record<string, unknown>;

const isRaw = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCategory = (v: unknown): v is Category => CATEGORIES.some((c) => c === v);
const optString = (v: unknown): string | undefined => (v === null || v === undefined ? undefined : String(v));

function toQuestion(item: unknown, id: number, errors: string[]): Question | null {
  const fail = (msg: string) => {
    errors.push(`No.${id}: ${msg}`);
    return null;
  };
  if (!isRaw(item)) return fail('not a mapping');
  const { cat, topic, q, code, result, choices, answer, cm, exp, verify, official } = item;
  if (!isCategory(cat)) return fail(`unknown cat ${JSON.stringify(cat)}`);
  if (typeof topic !== 'string' || !topic) return fail('topic is missing');
  if (typeof q !== 'string' || !q) return fail('q is missing');
  if (typeof exp !== 'string' || !exp) return fail('exp is missing');
  if (!Array.isArray(choices) || choices.length < 2 || choices.length > 6) return fail('choices must have 2 to 6 items');
  const texts = choices.map((c) => String(c));
  if (new Set(texts).size !== texts.length) return fail('duplicate choices');
  if (!Array.isArray(answer) || answer.length === 0) return fail('answer is missing');
  if (!answer.every((a) => Number.isInteger(a) && a >= 0 && a < texts.length)) return fail(`answer out of range: ${JSON.stringify(answer)}`);
  if (new Set(answer).size !== answer.length) return fail('duplicate answer');
  const want = Number(/([2-9])つ選択/.exec(q)?.[1] ?? 1);
  if (answer.length !== want) return fail(`answer has ${answer.length} items but the question asks for ${want}`);
  if (cm !== undefined && typeof cm !== 'boolean') return fail('cm must be true or false');
  const no = official === undefined ? undefined : Number(official);
  if (no !== undefined && !(Number.isInteger(no) && no > 0)) return fail('official must be a positive integer');
  return {
    id,
    cat,
    topic,
    q,
    code: optString(code),
    result: optString(result),
    choices: texts,
    answer: answer as number[],
    cm: cm ?? (verify === 'output' || verify === 'blank'),
    exp,
    ...(no === undefined ? {} : { official: no }),
  };
}

export function loadQuestions(): Question[] {
  const errors: string[] = [];
  const byName = new Map(Object.entries(sources).map(([path, src]) => [path.replace(/^.*\/([^/]+)\.yml$/, '$1'), src]));
  for (const name of byName.keys()) {
    if (!FILES.includes(name)) errors.push(`${name}.yml is not listed in FILES (src/lib/questions.ts)`);
  }
  const items = FILES.flatMap((name) => {
    const src = byName.get(name);
    if (src === undefined) {
      errors.push(`${name}.yml is missing`);
      return [];
    }
    const doc: unknown = parse(src);
    if (!Array.isArray(doc)) {
      errors.push(`${name}.yml is not a list`);
      return [];
    }
    return doc as unknown[];
  });
  const questions = items.map((item, i) => toQuestion(item, i + 1, errors));
  if (errors.length) throw new Error(`Invalid question data:\n${errors.join('\n')}`);
  return questions.filter((q): q is Question => q !== null);
}
