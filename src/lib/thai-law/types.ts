export type LawCategory =
  | 'ทั้งหมด'
  | 'วินัย อุทธรณ์ ร้องทุกข์'
  | 'กฎหมายอาญาและวิธีพิจารณา'
  | 'กฎหมายปกครองและการปฏิบัติราชการ'
  | 'การรักษาความสงบเรียบร้อยและความมั่นคง';

export interface PoliceLawAct {
  id: string;
  sysid: string;
  title: string;
  category: string;
  source: string;
  sourceUrl: string;
}

export interface PoliceLawSection {
  id: string;
  actId: string;
  actTitle: string;
  category: string;
  sectionNum: string;
  sectionNumArabic: string;
  sectionLabel: string;
  type: 'section' | 'rule';
  excerpt: string;
  content: string;
  notes?: string;
  source: string;
  sourceUrl: string;
}

export interface LawSearchOptions {
  q?: string;
  category?: string;
  actId?: string;
  page?: number;
  pageSize?: number;
}

export interface LawSearchResult {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: PoliceLawSection[];
  acts: PoliceLawAct[];
  categories: { name: string; count: number }[];
}
