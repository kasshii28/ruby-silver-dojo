// Shared by the build (src/lib/questions.ts) and the browser (src/client).

/** Every category used by any exam. Each exam lists its own in src/lib/exams.ts. */
export const CATEGORIES = ['文法', '組み込みライブラリ', 'オブジェクト指向', '標準添付ライブラリ', '実行環境'] as const;
export type Category = (typeof CATEGORIES)[number];

/** One question as sent to the browser. `id` follows the YAML order and must never change. */
export interface Question {
  id: number;
  cat: Category;
  topic: string;
  q: string;
  /** `__(1)__` marks the blank in fill-in questions. */
  code?: string;
  /** The 〔実行結果〕 shown for fill-in questions. */
  result?: string;
  /** A choice starting with "!" is shown as prose even when `cm` is true. */
  choices: string[];
  /** Indexes into `choices`. More than one means "N つ選択". */
  answer: number[];
  /** Show choices as monospaced code. */
  cm: boolean;
  exp: string;
  /** The question number in the official prep test (*_official.yml). Unset for this site's own questions. */
  official?: number;
}

/** An answer, with `sel` holding original choice indexes. */
export interface Answer {
  sel: number[];
  ok: boolean;
}

/** localStorage `<prefix>-hist`: the latest result per question, the number of tries and of correct tries. */
export interface QuestionStat {
  ok: boolean;
  n: number;
  c: number;
}

/** localStorage `<prefix>-current`: the exam in progress. `perm[id]` maps display position → original choice index. */
export interface Session {
  title: string;
  ids: number[];
  perm: Record<number, number[]>;
  ans: Record<number, Answer>;
  i: number;
  startedAt: number;
}

/** An entry of localStorage `<prefix>-history` (newest first). */
export interface ExamRecord {
  id: number;
  title: string;
  ids: number[];
  perm: Record<number, number[]>;
  ans: Record<number, Answer>;
  startedAt: number;
  finishedAt: number;
  complete: boolean;
}
