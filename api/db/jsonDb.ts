import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'guild-db.json');

export type TableName =
  | 'guild'
  | 'role'
  | 'member'
  | 'activity'
  | 'activity_signup'
  | 'warehouse_item'
  | 'borrow_record'
  | 'contribution_record'
  | 'announcement';

export interface QueryOptions {
  where?: (row: any) => boolean;
  orderBy?: string | ((a: any, b: any) => number);
  limit?: number;
  offset?: number;
}

interface DatabaseSchema {
  guild: any[];
  role: any[];
  member: any[];
  activity: any[];
  activity_signup: any[];
  warehouse_item: any[];
  borrow_record: any[];
  contribution_record: any[];
  announcement: any[];
  _counters: Record<string, number>;
}

const TABLES: TableName[] = [
  'guild',
  'role',
  'member',
  'activity',
  'activity_signup',
  'warehouse_item',
  'borrow_record',
  'contribution_record',
  'announcement',
];

const AUTO_INCREMENT_TABLES: TableName[] = [
  'guild',
  'member',
  'activity',
  'activity_signup',
  'warehouse_item',
  'borrow_record',
  'contribution_record',
  'announcement',
];

const createEmptyDb = (): DatabaseSchema => {
  const db: any = { _counters: {} };
  TABLES.forEach((t) => {
    db[t] = [];
  });
  AUTO_INCREMENT_TABLES.forEach((t) => {
    db._counters[t] = 0;
  });
  return db as DatabaseSchema;
};

class JsonDatabase {
  private data: DatabaseSchema;
  private initialized: boolean = false;

  constructor() {
    this.data = createEmptyDb();
    this.load();
  }

  private load(): void {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...createEmptyDb(), ...parsed };
        if (!this.data._counters) {
          this.data._counters = {};
          AUTO_INCREMENT_TABLES.forEach((t) => {
            const rows = (this.data as any)[t] || [];
            const maxId = rows.reduce((max: number, r: any) => Math.max(max, r.id || 0), 0);
            this.data._counters[t] = maxId;
          });
        }
        this.initialized = true;
      } catch (e) {
        console.error('Failed to load JSON DB, initializing empty:', e);
        this.data = createEmptyDb();
        this.save();
      }
    } else {
      this.data = createEmptyDb();
      this.save();
    }
  }

  private save(): void {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  markInitialized(): void {
    this.initialized = true;
    this.save();
  }

  getTable<T = any>(table: TableName): T[] {
    return [...((this.data as any)[table] || [])];
  }

  insert(table: TableName, data: Record<string, any>): any {
    const row: any = { ...data };
    if (AUTO_INCREMENT_TABLES.includes(table)) {
      this.data._counters[table] = (this.data._counters[table] || 0) + 1;
      row.id = this.data._counters[table];
    }
    (this.data as any)[table].push(row);
    this.save();
    return row;
  }

  update<T = any>(table: TableName, id: number | string, data: Partial<T>): T | null {
    const rows: any[] = (this.data as any)[table];
    const idx = rows.findIndex((r: any) => String(r.id) === String(id));
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...data };
    this.save();
    return rows[idx] as T;
  }

  delete(table: TableName, id: number | string): boolean {
    const rows: any[] = (this.data as any)[table];
    const idx = rows.findIndex((r: any) => String(r.id) === String(id));
    if (idx === -1) return false;
    rows.splice(idx, 1);
    this.save();
    return true;
  }

  find<T = any>(table: TableName, predicate: (row: T) => boolean): T | undefined {
    const rows: T[] = (this.data as any)[table];
    return rows.find(predicate);
  }

  findById<T = any>(table: TableName, id: number | string): T | undefined {
    const rows: any[] = (this.data as any)[table];
    return rows.find((r: any) => String(r.id) === String(id)) as T | undefined;
  }

  query<T = any>(table: TableName, options: QueryOptions = {}): T[] {
    let rows: T[] = [...((this.data as any)[table] || [])];

    if (options.where) {
      rows = rows.filter(options.where);
    }

    if (options.orderBy) {
      if (typeof options.orderBy === 'function') {
        rows.sort(options.orderBy);
      } else {
        const key = options.orderBy;
        rows.sort((a: any, b: any) => {
          const av = a[key];
          const bv = b[key];
          if (av === bv) return 0;
          return av > bv ? 1 : -1;
        });
      }
    }

    if (typeof options.offset === 'number') {
      rows = rows.slice(options.offset);
    }

    if (typeof options.limit === 'number') {
      rows = rows.slice(0, options.limit);
    }

    return rows;
  }

  count(table: TableName, predicate?: (row: any) => boolean): number {
    const rows: any[] = (this.data as any)[table];
    if (!predicate) return rows.length;
    return rows.filter(predicate).length;
  }

  reset(): void {
    this.data = createEmptyDb();
    this.initialized = false;
    this.save();
  }
}

export { JsonDatabase };
export const jsonDb = new JsonDatabase();

export function toCamelCase<T = any>(obj: Record<string, any>): T {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result as T;
}

export function toCamelCaseArray<T = any>(rows: Record<string, any>[]): T[] {
  return rows.map((row) => toCamelCase<T>(row));
}

export function formatDateTime(d: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
