export { jsonDb, toCamelCase, toCamelCaseArray, formatDateTime } from './jsonDb.js';
export type { TableName, QueryOptions, JsonDatabase } from './jsonDb.js';
import { jsonDb } from './jsonDb.js';

export function getDb() {
  return jsonDb;
}

export function closeDb(): void {
}
