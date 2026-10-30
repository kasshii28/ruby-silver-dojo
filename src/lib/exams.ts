// The certifications this site covers. Each one is its own page (/<slug>/) with its own questions and study history.
import type { Category } from './types';

export const SITE_NAME = '資格道場';

export interface Exam {
  slug: string;
  /** Short name used in headings, e.g. "Ruby Silver". */
  name: string;
  /** The official name of the certification. */
  fullName: string;
  /** Which version of the exam the questions target. */
  version: string;
  /** Question files under src/data/<slug>/. Ids follow this order and are saved in users' study history, so never reorder them. */
  files: string[];
  cats: readonly Category[];
  /** Prefix of the localStorage keys (`<prefix>-hist` etc.). */
  storage: string;
  officialSource: string;
  /** The real exam: number of questions, minutes and pass mark in percent. */
  size: number;
  minutes: number;
  pass: number;
}

export const EXAMS: readonly Exam[] = [
  {
    slug: 'ruby-silver',
    name: 'Ruby Silver',
    fullName: 'Ruby技術者認定試験 Silver',
    version: 'version 3（Ruby 3.1）',
    files: ['q_syntax', 'q_lib', 'q_oop', 'q_syntax2', 'q_lib2', 'q_oop2', 'q_extra', 'q_official'],
    cats: ['文法', '組み込みライブラリ', 'オブジェクト指向'],
    // The original site's keys, so existing users keep their history.
    storage: 'rs',
    officialSource: 'https://github.com/ruby-association/prep-test/blob/version3/silver_ja.md',
    size: 50,
    minutes: 90,
    pass: 75,
  },
  {
    slug: 'ruby-gold',
    name: 'Ruby Gold',
    fullName: 'Ruby技術者認定試験 Gold',
    version: 'version 3（Ruby 3.1）',
    files: ['g_syntax', 'g_oop', 'g_lib', 'g_stdlib', 'g_official', 'g_syntax2', 'g_oop2', 'g_lib2', 'g_stdlib2'],
    cats: ['文法', 'オブジェクト指向', '組み込みライブラリ', '標準添付ライブラリ', '実行環境'],
    storage: 'rg',
    officialSource: 'https://github.com/ruby-association/prep-test/blob/version3/gold_ja.md',
    size: 50,
    minutes: 90,
    pass: 75,
  },
];

/** What the browser needs to know about the exam on the page. */
export type ExamInfo = Pick<Exam, 'slug' | 'name' | 'fullName' | 'version' | 'cats' | 'storage' | 'officialSource' | 'size' | 'pass'>;

export const examInfo = ({ slug, name, fullName, version, cats, storage, officialSource, size, pass }: Exam): ExamInfo => ({ slug, name, fullName, version, cats, storage, officialSource, size, pass });
