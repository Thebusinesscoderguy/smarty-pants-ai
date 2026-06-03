export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'enum';

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  required?: boolean;
  enumValues?: string[];
  example?: string | number | boolean;
}

export interface EntityContext {
  schoolId: string;
  userId: string;
}

export interface EntityDescriptor {
  key: string;
  label: string;
  description?: string;
  columns: ColumnDef[];
  fetch: (ctx: EntityContext) => Promise<Record<string, any>[]>;
  upsert: (rows: Record<string, any>[], ctx: EntityContext) => Promise<{ inserted: number; errors: string[] }>;
}

export interface ValidationError {
  row: number;
  column?: string;
  message: string;
}

export interface ParsedFile {
  headers: string[];
  rows: Record<string, any>[];
}
