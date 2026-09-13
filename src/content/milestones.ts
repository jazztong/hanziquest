/**
 * Exam dates and milestone targets for a new student.
 *
 * Shared by the seed (which writes the demo account into a local SQLite file)
 * and by bootstrapStudent (which writes a newly registered account into D1).
 * They were duplicated for exactly as long as there was only one account.
 *
 * Dates are the published or projected ones from docs/research.md; every exam
 * date is a placeholder until a parent confirms it in the dashboard, because
 * the school does not publish its internal calendar.
 */

export interface ExamDateSeed {
  id: string;
  label: string;
  kind: string;
  date: string;
  placeholder: number;
}

export const EXAM_DATES: ExamDateSeed[] = [
  { id: 'e-mid-2026', label: '初一 期末考', kind: 'school-final', date: '2026-11-06', placeholder: 1 },
  { id: 'e-mid-2027', label: '初二 期中考', kind: 'school-midterm', date: '2027-05-14', placeholder: 1 },
  { id: 'e-fin-2027', label: '初二 期末考', kind: 'school-final', date: '2027-11-05', placeholder: 1 },
  { id: 'e-mid-2028', label: '初三 期中考', kind: 'school-midterm', date: '2028-05-12', placeholder: 1 },
  { id: 'e-uec-2028', label: '初中统考 华文 (JY01)', kind: 'uec-junior', date: '2028-10-24', placeholder: 1 },
];

export interface MilestoneSeed {
  key: string;
  title: string;
  titleEn: string;
  kind: string;
  target: number;
  due: string;
  arc: string;
}

export const MILESTONES: MilestoneSeed[] = [
  { key: 'chars-500', title: '认识 500 字', titleEn: 'Recognise 500 characters', kind: 'chars', target: 500, due: '2026-12-31', arc: 'arc-1' },
  { key: 'chars-1000', title: '认识 1000 字', titleEn: 'Recognise 1,000 characters', kind: 'chars', target: 1000, due: '2027-06-30', arc: 'arc-2' },
  { key: 'relics-4', title: '收集 4 件初一古诗文遗物', titleEn: 'Activate the 4 初一 poem relics', kind: 'relics', target: 4, due: '2027-01-05', arc: 'arc-2' },
  { key: 'essay-300', title: '完成第一篇 300 字作文', titleEn: 'First 300-character essay (初一 length)', kind: 'writing', target: 300, due: '2026-11-06', arc: 'arc-1' },
  { key: 'exam-final-2026', title: '期末考准备好', titleEn: '初一 期末考 ready', kind: 'exam', target: 70, due: '2026-11-06', arc: 'arc-1' },
  { key: 'entry-junior2', title: '升上初二', titleEn: '初二 entry ready', kind: 'exam', target: 75, due: '2027-01-05', arc: 'arc-2' },
];
